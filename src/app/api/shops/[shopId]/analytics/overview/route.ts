/**
 * GET /api/shops/[shopId]/analytics/overview
 * Powers the top-of-dashboard summary cards. Owner/staff access.
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

  const supabase = getServiceRoleClient();
  const { data, error } = await supabase
    .rpc("shop_dashboard_overview", { p_shop_id: params.shopId })
    .single();

  if (error) {
    return NextResponse.json({ error: "Failed to load overview", details: error.message }, { status: 500 });
  }

  return NextResponse.json({ overview: data });
}
