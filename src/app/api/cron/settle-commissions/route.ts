/**
 * POST /api/cron/settle-commissions
 * Intended to be called on a schedule (e.g. Vercel Cron, weekly) — NOT by
 * any user-facing client. Protected by a shared secret header, not user auth.
 *
 * For every shop with unsettled rows in platform_commission_ledger, sums
 * what they owe and creates a Razorpay Payment Link (on the PLATFORM's own
 * account) requesting that amount. The shop owner pays it from their
 * Razorpay dashboard or the link directly. Marking rows `settled = true`
 * happens in the platform webhook when that link is actually paid — this
 * route only invoices, it doesn't assume payment.
 *
 * Vercel Cron setup (vercel.json):
 *   { "crons": [{ "path": "/api/cron/settle-commissions", "schedule": "0 3 * * 1" }] }
 * (Mondays 3am UTC — adjust to your preference.) Vercel Cron requests
 * include an Authorization header automatically if you set CRON_SECRET as
 * an env var; this route checks for it.
 */

export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase/server";
import { getPlatformRazorpayClient } from "@/lib/razorpay/platform-client";

const MINIMUM_SETTLEMENT_PAISE = 100; // don't bother invoicing for < ₹1

export async function POST(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getServiceRoleClient();

  // Group unsettled ledger rows by shop.
  const { data: unsettledRows, error: fetchError } = await supabase
    .from("platform_commission_ledger")
    .select("id, shop_id, commission_paise, created_at")
    .eq("settled", false)
    .is("settlement_batch_id", null);

  if (fetchError) {
    return NextResponse.json({ error: "Failed to load ledger" }, { status: 500 });
  }

  const byShop = new Map<string, { total: number; ids: string[]; earliest: string }>();
  for (const row of unsettledRows ?? []) {
    const entry = byShop.get(row.shop_id) ?? { total: 0, ids: [] as string[], earliest: row.created_at };
    entry.total += row.commission_paise;
    entry.ids.push(row.id);
    if (row.created_at < entry.earliest) entry.earliest = row.created_at;
    byShop.set(row.shop_id, entry);
  }

  const results: Array<{ shopId: string; status: string; amountPaise?: number; error?: string }> = [];
  const periodEnd = new Date().toISOString();

  for (const [shopId, { total, ids, earliest }] of byShop.entries()) {
    if (total < MINIMUM_SETTLEMENT_PAISE) {
      results.push({ shopId, status: "skipped_below_minimum", amountPaise: total });
      continue;
    }

    const { data: shop } = await supabase
      .from("shops")
      .select("name")
      .eq("id", shopId)
      .single();

    // Create the settlement batch row first so we have an id to put in the
    // payment link's notes (used by the webhook to find it again).
    const { data: batch, error: batchError } = await supabase
      .from("settlement_batches")
      .insert({
        shop_id: shopId,
        period_start: earliest,
        period_end: periodEnd,
        total_commission_paise: total,
        status: "pending",
      })
      .select()
      .single();

    if (batchError || !batch) {
      results.push({ shopId, status: "failed_to_create_batch", error: batchError?.message });
      continue;
    }

    try {
      const platformClient = getPlatformRazorpayClient();
      const paymentLink = await (platformClient.paymentLink.create as any)({
        amount: total,
        currency: "INR",
        description: `YourPrinter commission — ${shop?.name ?? shopId}`,
        notes: { settlement_batch_id: batch.id, shop_id: shopId },
      });

      await supabase
        .from("settlement_batches")
        .update({
          status: "invoiced",
          razorpay_payment_link_id: paymentLink.id,
          razorpay_payment_link_url: paymentLink.short_url,
        })
        .eq("id", batch.id);

      await supabase
        .from("platform_commission_ledger")
        .update({ settlement_batch_id: batch.id })
        .in("id", ids);

      results.push({ shopId, status: "invoiced", amountPaise: total });
    } catch (err: any) {
      await supabase.from("settlement_batches").update({ status: "failed" }).eq("id", batch.id);
      results.push({ shopId, status: "failed", error: err?.message, amountPaise: total });
    }
  }

  return NextResponse.json({ processed: results.length, results });
}
