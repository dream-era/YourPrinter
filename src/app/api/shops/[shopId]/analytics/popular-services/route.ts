/**
 * GET /api/shops/[shopId]/analytics/popular-services?days=90
 * Breakdown of order options (color vs B&W, single/double-sided, binding
 * types, lamination, urgent) — no separate "service" table exists, so this
 * reads directly from orders.print_options.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase/admin";
import { requireShopAccess } from "@/lib/auth/require-shop-access";

export async function GET(req: NextRequest, props: { params: Promise<{ shopId: string }> }) {
  const params = await props.params;
  const authResult = await requireShopAccess(req, params.shopId);
  if (!authResult.ok) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const { searchParams } = new URL(req.url);
  const days = Math.min(Math.max(Number(searchParams.get("days") ?? 90), 1), 365);

  const supabase = getServiceRoleClient();
  const { data, error } = await supabase
    .rpc("shop_popular_services", { p_shop_id: params.shopId, days_back: days })
    .single();

  if (error) {
    return NextResponse.json({ error: "Failed to load service breakdown", details: error.message }, { status: 500 });
  }

  return NextResponse.json({ services: data });
}
