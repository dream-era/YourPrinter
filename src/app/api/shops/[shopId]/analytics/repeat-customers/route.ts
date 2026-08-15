/**
 * GET /api/shops/[shopId]/analytics/repeat-customers?minOrders=2&limit=20
 * Students with multiple paid orders at this shop, ranked by order count
 * then total spend.
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
  const minOrders = Math.max(Number(searchParams.get("minOrders") ?? 2), 1);
  const limit = Math.min(Math.max(Number(searchParams.get("limit") ?? 20), 1), 100);

  const supabase = getServiceRoleClient();
  const { data, error } = await supabase.rpc("shop_repeat_customers", {
    p_shop_id: params.shopId,
    min_orders: minOrders,
    result_limit: limit,
  });

  if (error) {
    return NextResponse.json({ error: "Failed to load repeat customers", details: error.message }, { status: 500 });
  }

  return NextResponse.json({ repeatCustomers: data });
}
