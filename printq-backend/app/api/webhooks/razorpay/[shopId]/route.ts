/**
 * POST /api/webhooks/razorpay/[shopId]
 *
 * Each shop's Razorpay dashboard is configured to send webhooks to its OWN
 * URL (this route, with its shopId in the path), signed with ITS OWN
 * webhook secret. This is the authoritative source of order state — the
 * client-side /api/payments/verify route is a fast-path UX nicety, but if
 * the client never calls it (closed tab, network drop), this webhook is
 * what actually marks the order paid.
 *
 * IMPORTANT: this route must read the RAW request body for signature
 * verification — do not call req.json() before verifying, since that can
 * alter whitespace/formatting and break the HMAC check.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase/server";
import { getShopPaymentCredentials } from "@/lib/razorpay/client";
import { verifyHmacSignature } from "@/lib/security/encryption";
import { notifyShopTeam } from "@/lib/notifications/create";
import { maybeAutoAdvanceToPrinting } from "@/lib/orders/auto-advance";

export async function POST(req: NextRequest, props: { params: Promise<{ shopId: string }> }) {
  const params = await props.params;
  const { shopId } = params;
  const rawBody = await req.text();
  const signature = req.headers.get("x-razorpay-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature header" }, { status: 400 });
  }

  let credentials;
  try {
    credentials = await getShopPaymentCredentials(shopId);
  } catch {
    // Don't leak whether the shop exists to an unauthenticated caller.
    return NextResponse.json({ error: "Webhook rejected" }, { status: 400 });
  }

  const isValid = verifyHmacSignature(rawBody, signature, credentials.webhookSecret);
  if (!isValid) {
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
  }

  const event = JSON.parse(rawBody);
  const supabase = getServiceRoleClient();

  switch (event.event) {
    case "payment.captured": {
      const payment = event.payload?.payment?.entity;
      const razorpayOrderId = payment?.order_id;
      if (!razorpayOrderId) break;

      const { data: order } = await supabase
        .from("orders")
        .select("id, shop_id, status, document_id, student_id")
        .eq("razorpay_order_id", razorpayOrderId)
        .single();

      if (order && order.shop_id === shopId) {
        // Idempotent — webhooks can be delivered more than once.
        if (order.status === "pending_payment") {
          await supabase
            .from("orders")
            .update({
              status: "accepted",
              razorpay_payment_id: payment.id,
              paid_at: new Date().toISOString(),
            })
            .eq("id", order.id);

          // Notifications table insert -> Realtime subscribers (shop staff
          // dashboard, subscribed on notifications where user_id = theirs)
          // pick this up live. If /api/payments/verify already fired this
          // for the same order (client-side fast path beat the webhook),
          // this results in a harmless duplicate notification row rather
          // than a duplicate order state change (guarded by the status
          // check above) — acceptable tradeoff vs. added complexity here.
          await notifyShopTeam({
            shopId,
            orderId: order.id,
            type: "new_order",
            title: "New print order received",
          });

          await maybeAutoAdvanceToPrinting({
            orderId: order.id,
            shopId,
            documentId: order.document_id,
            studentId: order.student_id,
          });
        }
      }
      break;
    }

    case "payment.failed": {
      const payment = event.payload?.payment?.entity;
      const razorpayOrderId = payment?.order_id;
      if (!razorpayOrderId) break;

      await supabase
        .from("orders")
        .update({ status: "failed" })
        .eq("razorpay_order_id", razorpayOrderId)
        .eq("shop_id", shopId)
        .eq("status", "pending_payment");
      break;
    }

    default:
      // Unhandled event types are acknowledged but ignored.
      break;
  }

  // Razorpay expects a 2xx quickly — always acknowledge once verified,
  // even for event types we don't act on, or Razorpay will keep retrying.
  return NextResponse.json({ received: true });
}
