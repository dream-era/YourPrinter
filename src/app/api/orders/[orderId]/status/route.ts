/**
 * PATCH /api/orders/[orderId]/status
 * Body: { status: "printing" | "ready" | "completed" | "cancelled" }
 *
 * This is the endpoint behind every staff dashboard button:
 * "Start Printing" -> accepted -> printing
 * "Mark Ready"      -> printing -> ready (generates the pickup code)
 * "Mark Picked Up"  -> ready -> completed
 *
 * Only shop owner/staff can call this — students never set status directly
 * (their side of "accepted" happens via payment verification/webhook, and
 * "completed" via the pickup-verify route instead of trusting client input).
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServiceRoleClient } from "@/lib/supabase/server";
import { requireShopAccess } from "@/lib/auth/require-shop-access";
import {
  assertTransition,
  InvalidTransitionError,
  timestampColumnFor,
  type OrderStatus,
} from "@/lib/orders/state-machine";
import { generatePickupCode } from "@/lib/orders/pickup-code";
import { createNotification } from "@/lib/notifications/create";
const bodySchema = z.object({
  status: z.enum(["printing", "ready", "completed", "cancelled"]),
  note: z.string().max(300).optional(),
});

const NOTIFICATION_COPY: Record<string, { type: any; title: string }> = {
  printing: { type: "order_printing", title: "Your print job has started" },
  ready: { type: "order_ready", title: "Your order is ready for pickup!" },
  completed: { type: "order_completed", title: "Order picked up — thanks!" },
  cancelled: { type: "order_cancelled", title: "Your order was cancelled" },
};

export async function PATCH(req: NextRequest, props: { params: Promise<{ orderId: string }> }) {
  const params = await props.params;
  const body = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const nextStatus = parsed.data.status as OrderStatus;

  const supabase = getServiceRoleClient();

  const { data: order, error: fetchError } = await supabase
    .from("orders")
    .select("id, shop_id, student_id, status, document_id")
    .eq("id", params.orderId)
    .single();

  if (fetchError || !order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const authResult = await requireShopAccess(req, order.shop_id);
  if (!authResult.ok) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const currentStatus = order.status as OrderStatus;

  try {
    assertTransition(currentStatus, nextStatus);
  } catch (err) {
    if (err instanceof InvalidTransitionError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    throw err;
  }

  const update: Record<string, unknown> = { status: nextStatus };
  const timestampColumn = timestampColumnFor(nextStatus);
  if (timestampColumn) update[timestampColumn] = new Date().toISOString();
  if (nextStatus === "ready") update.pickup_code = generatePickupCode();

  const { data: updatedOrder, error: updateError } = await supabase
    .from("orders")
    .update(update)
    .eq("id", params.orderId)
    .select()
    .single();

  if (updateError) {
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
  }

  await supabase.from("order_status_history").insert({
    order_id: params.orderId,
    from_status: currentStatus,
    to_status: nextStatus,
    changed_by: authResult.userId,
    note: parsed.data.note ?? null,
  });

  // "Start Printing" also queues the actual print job for the shop's agent
  // to pick up (see printq-print-agent). This is separate from order.status
  // because the physical print can still fail for hardware reasons after
  // the order has already moved to 'printing'.
  if (nextStatus === "printing") {
    await supabase.from("print_jobs").insert({
      order_id: order.id,
      shop_id: order.shop_id,
      document_id: order.document_id,
      status: "queued",
    });
  }

  const copy = NOTIFICATION_COPY[nextStatus];
  if (copy) {
    await createNotification({
      userId: order.student_id,
      orderId: order.id,
      type: copy.type,
      title: copy.title,
      body:
        nextStatus === "ready"
          ? `Show pickup code ${updatedOrder.pickup_code} at the counter.`
          : undefined,
    });
  }

  return NextResponse.json({ order: updatedOrder });
}
