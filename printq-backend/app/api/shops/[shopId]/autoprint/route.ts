/**
 * PATCH /api/shops/[shopId]/autoprint
 * Body: { enabled: boolean }
 * Owner only. Per the PRD's trust-building sequencing, this should only be
 * flipped on for shops with a track record of reliable manual orders and
 * a print agent that's been running reliably — this route doesn't enforce
 * that eligibility check itself (no "months of good orders" metric exists
 * yet), it's a manual decision you make and flip via this endpoint. Add an
 * eligibility gate here later if you want it enforced in code rather than
 * by judgment.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServiceRoleClient } from "@/lib/supabase/server";
import { requireShopOwner } from "@/lib/auth/require-shop-owner";

const bodySchema = z.object({ enabled: z.boolean() });

export async function PATCH(req: NextRequest, props: { params: Promise<{ shopId: string }> }) {
  const params = await props.params;
  const authResult = await requireShopOwner(req, params.shopId);
  if (!authResult.ok) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const body = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  // Autoprint is meaningless without a working agent — warn (not block) if
  // none is registered yet.
  const supabase = getServiceRoleClient();
  const { data: agents } = await supabase
    .from("shop_agents")
    .select("id")
    .eq("shop_id", params.shopId)
    .eq("active", true);

  const { data: shop, error } = await supabase
    .from("shops")
    .update({
      autoprint_enabled: parsed.data.enabled,
      autoprint_enabled_at: parsed.data.enabled ? new Date().toISOString() : null,
    })
    .eq("id", params.shopId)
    .select("id, autoprint_enabled, autoprint_enabled_at")
    .single();

  if (error) {
    return NextResponse.json({ error: "Failed to update autoprint setting" }, { status: 500 });
  }

  return NextResponse.json({
    shop,
    warning:
      parsed.data.enabled && (!agents || agents.length === 0)
        ? "Autoprint is now enabled, but no active print agent is registered for this shop — orders will queue but nothing will print until one is set up."
        : undefined,
  });
}
