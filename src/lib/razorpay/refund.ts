/**
 * lib/razorpay/refund.ts
 * Issues a refund (full or partial) through the shop's own Razorpay
 * account — same account that received the payment, per the per-shop model.
 * Records the attempt in `refunds` regardless of outcome so there's always
 * an audit trail, even for failures.
 */

import { getServiceRoleClient } from "@/lib/supabase/admin";
import { getShopRazorpayClient } from "@/lib/razorpay/client";

export interface IssueRefundParams {
  orderId: string;
  shopId: string;
  paymentId: string; // razorpay_payment_id on the order
  amountPaise: number; // amount to refund, in paise
  reason?: string;
  initiatedBy: string; // profiles.id
}

export interface IssueRefundResult {
  refundId: string; // our internal refunds.id
  razorpayRefundId: string | null;
  status: "completed" | "failed";
}

export async function issueRefund(
  params: IssueRefundParams
): Promise<IssueRefundResult> {
  const supabase = getServiceRoleClient();

  // Record the attempt first (status: processing) so a crash mid-call still
  // leaves an auditable row.
  const { data: refundRow, error: insertError } = await supabase
    .from("refunds")
    .insert({
      order_id: params.orderId,
      shop_id: params.shopId,
      amount_paise: params.amountPaise,
      reason: params.reason,
      initiated_by: params.initiatedBy,
      status: "processing",
    })
    .select()
    .single();

  if (insertError || !refundRow) {
    throw new Error("Failed to record refund attempt");
  }

  try {
    const { client } = await getShopRazorpayClient(params.shopId);
    const razorpayRefund = await client.payments.refund(params.paymentId, {
      amount: params.amountPaise,
      notes: { printq_order_id: params.orderId, reason: params.reason ?? "" },
    });

    await supabase
      .from("refunds")
      .update({ razorpay_refund_id: razorpayRefund.id, status: "completed" })
      .eq("id", refundRow.id);

    return { refundId: refundRow.id, razorpayRefundId: razorpayRefund.id, status: "completed" };
  } catch (err: any) {
    await supabase.from("refunds").update({ status: "failed" }).eq("id", refundRow.id);
    throw new Error(err?.error?.description || err?.message || "Refund failed at Razorpay");
  }
}
