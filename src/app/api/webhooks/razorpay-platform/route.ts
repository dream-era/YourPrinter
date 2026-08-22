/**
 * POST /api/webhooks/razorpay-platform
 * Configure this URL in the PLATFORM'S Razorpay dashboard (not any shop's),
 * subscribed to `payment_link.paid`. This is distinct from
 * /api/webhooks/razorpay/[shopId] — that one handles customer payments to
 * shops; this one handles shops paying YourPrinter's commission invoices.
 */

export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase/admin";
import { verifyHmacSignature } from "@/lib/security/encryption";
import { getPlatformWebhookSecret } from "@/lib/razorpay/platform-client";

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-razorpay-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature header" }, { status: 400 });
  }

  const isValid = verifyHmacSignature(rawBody, signature, getPlatformWebhookSecret());
  if (!isValid) {
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
  }

  const event = JSON.parse(rawBody);
  const supabase = getServiceRoleClient();

  if (event.event === "payment_link.paid") {
    const paymentLink = event.payload?.payment_link?.entity;
    const settlementBatchId = paymentLink?.notes?.settlement_batch_id;

    if (settlementBatchId) {
      const { data: batch } = await supabase
        .from("settlement_batches")
        .select("id, status")
        .eq("id", settlementBatchId)
        .single();

      // Idempotent — webhooks can be delivered more than once.
      if (batch && batch.status !== "paid") {
        await supabase
          .from("settlement_batches")
          .update({ status: "paid", paid_at: new Date().toISOString() })
          .eq("id", settlementBatchId);

        await supabase
          .from("platform_commission_ledger")
          .update({ settled: true, settled_at: new Date().toISOString() })
          .eq("settlement_batch_id", settlementBatchId);
      }
    }
  }

  return NextResponse.json({ received: true });
}
