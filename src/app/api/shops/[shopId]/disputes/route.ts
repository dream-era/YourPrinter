/**
 * GET /api/shops/[shopId]/disputes?status=open
 * Owner/staff view of disputes raised against their shop.
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
  const status = searchParams.get("status");

  const supabase = getServiceRoleClient();
  let query = supabase
    .from("disputes")
    .select(
      `*, order:orders (id, amount_paise, print_options, status), student:profiles!disputes_raised_by_fkey (full_name, phone)`
    )
    .eq("shop_id", params.shopId)
    .order("created_at", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: "Failed to load disputes" }, { status: 500 });
  }

  return NextResponse.json({ disputes: data });
}
