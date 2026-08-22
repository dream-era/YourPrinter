/**
 * POST /api/payments/verify
 *
 * Called by the client immediately after Razorpay's checkout widget
 * succeeds. This is a fast-path confirmation ONLY — the webhook handler
 * (app/api/webhooks/razorpay/[shopId]) is the source of truth for order
 * state, since webhooks are authoritative and this endpoint can be skipped
 * by a client that closes the tab mid-flow. Both paths converge on the same
 * "verify signature -> mark paid" logic.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase/admin";
import { getShopPaymentCredentials } from "@/lib/razorpay/client";
import { verifyHmacSignature } from "@/lib/security/encryption";
import { verifyPaymentSchema } from "@/lib/validations/payment";
import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";
import { notifyShopTeam } from "@/lib/notifications/create";
import { maybeAutoAdvanceToPrinting } from "@/lib/orders/auto-advance";

import { checkRateLimit, getStrictLimiter } from "@/lib/security/rate-limit";

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { allowed } = await checkRateLimit(getStrictLimiter(), `verify:${user.id}`);
  if (!allowed) {
    return NextResponse.json({ error: "Too many verification requests" }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = verifyPaymentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = parsed.data;

  const supabase = getServiceRoleClient();

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id, shop_id, student_id, status, razorpay_order_id, document_id")
    .eq("id", orderId)
    .single();

  if (orderError || !order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
  if (order.student_id !== user.id) {
    return NextResponse.json({ error: "Not your order" }, { status: 403 });
  }
  if (order.razorpay_order_id !== razorpayOrderId) {
    return NextResponse.json({ error: "Order/payment mismatch" }, { status: 400 });
  }

  // Signature must be verified using THIS shop's key secret, never a
  // global platform secret — this is the crux of the per-shop model.
  const credentials = await getShopPaymentCredentials(order.shop_id);

  const payload = `${razorpayOrderId}|${razorpayPaymentId}`;
  const isValid = verifyHmacSignature(payload, razorpaySignature, credentials.keySecret);

  if (!isValid) {
    return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 });
  }

  // Idempotent: if the webhook already marked this paid, this is a no-op.
  if (order.status === "accepted" || order.status === "printing" || order.status === "ready" || order.status === "completed") {
    return NextResponse.json({ status: order.status, alreadyProcessed: true });
  }

  const { error: updateError } = await supabase
    .from("orders")
    .update({
      status: "accepted", // "Order Received" -> payment confirmed -> "Accepted" per PRD flow
      razorpay_payment_id: razorpayPaymentId,
      paid_at: new Date().toISOString(),
    })
    .eq("id", orderId);

  if (updateError) {
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
  }

  await notifyShopTeam({
    shopId: order.shop_id,
    orderId: order.id,
    type: "new_order",
    title: "New print order received",
  });

  await maybeAutoAdvanceToPrinting({
    orderId: order.id,
    shopId: order.shop_id,
    documentId: order.document_id,
    studentId: order.student_id,
  });

  return NextResponse.json({ status: "accepted" });
}
