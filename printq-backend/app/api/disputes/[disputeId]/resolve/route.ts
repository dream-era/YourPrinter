/**
 * POST /api/disputes/[disputeId]/resolve
 * Body: { action: "refund" | "reject", amountPaise?: number, note?: string }
 * Owner/staff only. "refund" reuses the same issueRefund() helper as the
 * direct refund route — a dispute resolution and a manual refund end up in
 * the same `refunds` table either way.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServiceRoleClient } from "@/lib/supabase/server";
import { requireShopAccess } from "@/lib/auth/require-shop-access";
import { issueRefund } from "@/lib/razorpay/refund";
import { createNotification } from "@/lib/notifications/create";

const bodySchema = z.object({
  action: z.enum(["refund", "reject"]),
  amountPaise: z.number().int().positive().optional(),
  note: z.string().max(500).optional(),
});

export async function POST(req: NextRequest, props: { params: Promise<{ disputeId: string }> }) {
  const params = await props.params;
  const body = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const supabase = getServiceRoleClient();
  const { data: dispute, error: fetchError } = await supabase
    .from("disputes")
    .select("id, order_id, shop_id, raised_by, status")
    .eq("id", params.disputeId)
    .single();

  if (fetchError || !dispute) {
    return NextResponse.json({ error: "Dispute not found" }, { status: 404 });
  }
  if (dispute.status !== "open") {
    return NextResponse.json({ error: "This dispute has already been resolved" }, { status: 409 });
  }

  const authResult = await requireShopAccess(req, dispute.shop_id);
  if (!authResult.ok) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  if (parsed.data.action === "reject") {
    const { data: updated } = await supabase
      .from("disputes")
      .update({
        status: "resolved_rejected",
        resolution_note: parsed.data.note,
        resolved_by: authResult.userId,
        resolved_at: new Date().toISOString(),
      })
      .eq("id", dispute.id)
      .select()
      .single();

    await createNotification({
      userId: dispute.raised_by,
      orderId: dispute.order_id,
      type: "order_cancelled",
      title: "Your dispute was reviewed",
      body: parsed.data.note ?? "The shop was unable to approve a refund for this order.",
    });

    return NextResponse.json({ dispute: updated });
  }

  // action === "refund"
  const { data: order } = await supabase
    .from("orders")
    .select("amount_paise, refunded_amount_paise, razorpay_payment_id")
    .eq("id", dispute.order_id)
    .single();

  if (!order?.razorpay_payment_id) {
    return NextResponse.json({ error: "Order was never paid — cannot refund" }, { status: 400 });
  }

  const remaining = order.amount_paise - order.refunded_amount_paise;
  const amountToRefund = parsed.data.amountPaise ?? remaining;
  if (amountToRefund > remaining) {
    return NextResponse.json({ error: "Refund amount exceeds what remains unrefunded" }, { status: 400 });
  }

  let refundResult;
  try {
    refundResult = await issueRefund({
      orderId: dispute.order_id,
      shopId: dispute.shop_id,
      paymentId: order.razorpay_payment_id,
      amountPaise: amountToRefund,
      reason: `Dispute resolution: ${parsed.data.note ?? ""}`,
      initiatedBy: authResult.userId,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 502 });
  }

  const newRefundedTotal = order.refunded_amount_paise + amountToRefund;
  const isFullRefund = newRefundedTotal >= order.amount_paise;

  await supabase
    .from("orders")
    .update({
      refunded_amount_paise: newRefundedTotal,
      refund_status: isFullRefund ? "full" : "partial",
    })
    .eq("id", dispute.order_id);

  const { data: updatedDispute } = await supabase
    .from("disputes")
    .update({
      status: "resolved_refunded",
      resolution_note: parsed.data.note,
      refund_id: refundResult.refundId,
      resolved_by: authResult.userId,
      resolved_at: new Date().toISOString(),
    })
    .eq("id", dispute.id)
    .select()
    .single();

  await createNotification({
    userId: dispute.raised_by,
    orderId: dispute.order_id,
    type: "order_cancelled",
    title: "Refund issued for your dispute",
    body: `₹${(amountToRefund / 100).toFixed(2)} refunded to your original payment method.`,
  });

  return NextResponse.json({ dispute: updatedDispute });
}
