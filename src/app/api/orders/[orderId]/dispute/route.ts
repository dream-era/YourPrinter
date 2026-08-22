/**
 * POST /api/orders/[orderId]/dispute
 * Body: { reason: string }
 * The student's side of "not a support inbox that goes quiet" — creates a
 * tracked dispute the shop must act on via
 * POST /api/disputes/[disputeId]/resolve, rather than an email that can be
 * ignored. Only allowed on orders that reached 'ready' or 'completed' —
 * anything earlier should just be cancelled normally, not disputed.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServiceRoleClient } from "@/lib/supabase/admin";
import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";
import { notifyShopTeam } from "@/lib/notifications/create";

const bodySchema = z.object({
  reason: z.string().min(10).max(1000),
});

export async function POST(req: NextRequest, props: { params: Promise<{ orderId: string }> }) {
  const params = await props.params;
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const supabase = getServiceRoleClient();
  const { data: order, error: fetchError } = await supabase
    .from("orders")
    .select("id, shop_id, student_id, status")
    .eq("id", params.orderId)
    .single();

  if (fetchError || !order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
  if (order.student_id !== user.id) {
    return NextResponse.json({ error: "Not your order" }, { status: 403 });
  }
  if (!["ready", "completed"].includes(order.status)) {
    return NextResponse.json(
      { error: "Disputes can only be raised on orders that were printed (status ready or completed)" },
      { status: 400 }
    );
  }

  const { data: existingOpen } = await supabase
    .from("disputes")
    .select("id")
    .eq("order_id", order.id)
    .eq("status", "open")
    .single();
  if (existingOpen) {
    return NextResponse.json({ error: "A dispute is already open for this order" }, { status: 409 });
  }

  const { data: dispute, error: insertError } = await supabase
    .from("disputes")
    .insert({
      order_id: order.id,
      shop_id: order.shop_id,
      raised_by: user.id,
      reason: parsed.data.reason,
    })
    .select()
    .single();

  if (insertError) {
    return NextResponse.json({ error: "Failed to create dispute" }, { status: 500 });
  }

  await notifyShopTeam({
    shopId: order.shop_id,
    orderId: order.id,
    type: "order_cancelled", // reuse existing notification type; add "dispute_opened" to the enum if you want it distinct
    title: "A customer raised a dispute on an order",
  });

  return NextResponse.json({ dispute }, { status: 201 });
}
