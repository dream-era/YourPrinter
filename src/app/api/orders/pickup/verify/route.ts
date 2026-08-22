/**
 * POST /api/orders/pickup/verify
 * Body: { qrPayload: string } OR { orderId: string, pickupCode: string }
 *
 * Staff-facing endpoint for the counter handoff moment. Accepts either a
 * scanned QR payload (format: "printq:<orderId>:<code>", see
 * lib/orders/pickup-code.ts) or a manually typed order id + code, so the
 * flow still works if the scanner's down. Marks the order 'completed'.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServiceRoleClient } from "@/lib/supabase/admin";
import { requireShopAccess } from "@/lib/auth/require-shop-access";
import { parseQrPayload } from "@/lib/orders/pickup-code";
import { assertTransition, InvalidTransitionError, type OrderStatus } from "@/lib/orders/state-machine";
import { createNotification } from "@/lib/notifications/create";

const bodySchema = z.union([
  z.object({ qrPayload: z.string() }),
  z.object({ orderId: z.string().uuid(), pickupCode: z.string().length(6) }),
]);

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  let orderId: string;
  let pickupCode: string;

  if ("qrPayload" in parsed.data) {
    const decoded = parseQrPayload(parsed.data.qrPayload);
    if (!decoded) {
      return NextResponse.json({ error: "Unrecognized QR code" }, { status: 400 });
    }
    orderId = decoded.orderId;
    pickupCode = decoded.pickupCode;
  } else {
    orderId = parsed.data.orderId;
    pickupCode = parsed.data.pickupCode;
  }

  const supabase = getServiceRoleClient();
  const { data: order, error: fetchError } = await supabase
    .from("orders")
    .select("id, shop_id, student_id, status, pickup_code")
    .eq("id", orderId)
    .single();

  if (fetchError || !order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const authResult = await requireShopAccess(req, order.shop_id);
  if (!authResult.ok) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  if (order.status !== "ready") {
    return NextResponse.json(
      { error: `Order is not ready for pickup (current status: ${order.status})` },
      { status: 409 }
    );
  }

  if (order.pickup_code !== pickupCode) {
    return NextResponse.json({ error: "Pickup code does not match" }, { status: 400 });
  }

  try {
    assertTransition(order.status as OrderStatus, "completed");
  } catch (err) {
    if (err instanceof InvalidTransitionError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    throw err;
  }

  const { data: updatedOrder, error: updateError } = await supabase
    .from("orders")
    .update({ status: "completed", completed_at: new Date().toISOString() })
    .eq("id", orderId)
    .select()
    .single();

  if (updateError) {
    return NextResponse.json({ error: "Failed to complete order" }, { status: 500 });
  }

  await supabase.from("order_status_history").insert({
    order_id: orderId,
    from_status: "ready",
    to_status: "completed",
    changed_by: authResult.userId,
  });

  await createNotification({
    userId: order.student_id,
    orderId,
    type: "order_completed",
    title: "Order picked up — thanks!",
  });

  return NextResponse.json({ order: updatedOrder });
}
