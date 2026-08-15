/**
 * GET /api/shops/[shopId]/analytics/peak-hours?days=30
 * Order counts by hour-of-day (0-23) over the given window.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase/server";
import { requireShopAccess } from "@/lib/auth/require-shop-access";

export async function GET(req: NextRequest, props: { params: Promise<{ shopId: string }> }) {
  const params = await props.params;
  const authResult = await requireShopAccess(req, params.shopId);
  if (!authResult.ok) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const { searchParams } = new URL(req.url);
  const days = Math.min(Math.max(Number(searchParams.get("days") ?? 30), 1), 365);

  const supabase = getServiceRoleClient();
  const { data, error } = await supabase.rpc("shop_peak_hours", {
    p_shop_id: params.shopId,
    days_back: days,
  });

  if (error) {
    return NextResponse.json({ error: "Failed to load peak hours", details: error.message }, { status: 500 });
  }

  return NextResponse.json({ peakHours: data });
}
