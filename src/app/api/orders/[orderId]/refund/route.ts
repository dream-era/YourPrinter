/**
 * POST /api/orders/[orderId]/refund
 * Body: { amountPaise?: number, reason?: string }
 * Omit amountPaise for a full refund of whatever hasn't already been refunded.
 *
 * Shop owner/staff only — this is the direct refund action (e.g. "we
 * printed it wrong, here's your money back"). For customer-initiated
 * disputes, see /api/orders/[orderId]/dispute + /api/disputes/[id]/resolve,
 * which calls this same underlying issueRefund() helper once approved.
 *
 * Cancels the order (if not already completed) in addition to refunding —
 * an order that's been refunded shouldn't stay in an active queue state.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServiceRoleClient } from "@/lib/supabase/admin";
import { requireShopAccess } from "@/lib/auth/require-shop-access";
import { issueRefund } from "@/lib/razorpay/refund";
import { createNotification } from "@/lib/notifications/create";

const bodySchema = z.object({
  amountPaise: z.number().int().positive().optional(),
  reason: z.string().max(500).optional(),
});

export async function POST(req: NextRequest, props: { params: Promise<{ orderId: string }> }) {
  const params = await props.params;
  const body = await req.json().catch(() => ({}));
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
    .select("id, shop_id, student_id, status, amount_paise, refunded_amount_paise, razorpay_payment_id")
    .eq("id", params.orderId)
    .single();

  if (fetchError || !order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const authResult = await requireShopAccess(req, order.shop_id);
  if (!authResult.ok) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  if (!order.razorpay_payment_id) {
    return NextResponse.json({ error: "This order was never paid — nothing to refund" }, { status: 400 });
  }

  const remaining = order.amount_paise - order.refunded_amount_paise;
  if (remaining <= 0) {
    return NextResponse.json({ error: "This order has already been fully refunded" }, { status: 409 });
  }

  const amountToRefund = parsed.data.amountPaise ?? remaining;
  if (amountToRefund > remaining) {
    return NextResponse.json(
      { error: `Cannot refund ₹${(amountToRefund / 100).toFixed(2)} — only ₹${(remaining / 100).toFixed(2)} remains unrefunded` },
      { status: 400 }
    );
  }

  let refundResult;
  try {
    refundResult = await issueRefund({
      orderId: order.id,
      shopId: order.shop_id,
      paymentId: order.razorpay_payment_id,
      amountPaise: amountToRefund,
      reason: parsed.data.reason,
      initiatedBy: authResult.userId,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 502 });
  }

  const newRefundedTotal = order.refunded_amount_paise + amountToRefund;
  const isFullRefund = newRefundedTotal >= order.amount_paise;

  const orderUpdate: Record<string, unknown> = {
    refunded_amount_paise: newRefundedTotal,
    refund_status: isFullRefund ? "full" : "partial",
  };
  // Only force-cancel if the order hasn't already been picked up.
  if (order.status !== "completed") {
    orderUpdate.status = "cancelled";
    orderUpdate.cancelled_at = new Date().toISOString();
  }

  await supabase.from("orders").update(orderUpdate).eq("id", order.id);

  await createNotification({
    userId: order.student_id,
    orderId: order.id,
    type: "order_cancelled",
    title: isFullRefund ? "Refund issued" : "Partial refund issued",
    body: `₹${(amountToRefund / 100).toFixed(2)} refunded to your original payment method.`,
  });

  return NextResponse.json({
    refundId: refundResult.refundId,
    amountRefundedPaise: amountToRefund,
    totalRefundedPaise: newRefundedTotal,
    refundStatus: isFullRefund ? "full" : "partial",
  });
}
