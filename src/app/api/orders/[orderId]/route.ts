/**
 * GET /api/orders/[orderId]
 * Returns full order detail. Accessible by the student who placed it, or
 * the shop's owner/staff. This is what both the customer tracking screen
 * and the staff order-detail view read from.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase/server";
import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";

export async function GET(req: NextRequest, props: { params: Promise<{ orderId: string }> }) {
  const params = await props.params;
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const supabase = getServiceRoleClient();
  const { data: order, error } = await supabase
    .from("orders")
    .select(
      `*, shop:shops (id, name, address, latitude, longitude, logo_url),
       document:documents (id, original_filename, page_count, mime_type)`
    )
    .eq("id", params.orderId)
    .single();

  if (error || !order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const isStudent = order.student_id === user.id;
  let hasShopAccess = false;
  if (!isStudent) {
    const { data: shop } = await supabase
      .from("shops")
      .select("owner_id")
      .eq("id", order.shop_id)
      .single();
    if (shop?.owner_id === user.id) {
      hasShopAccess = true;
    } else {
      const { data: staffRow } = await supabase
        .from("shop_staff")
        .select("id")
        .eq("shop_id", order.shop_id)
        .eq("user_id", user.id)
        .eq("active", true)
        .single();
      hasShopAccess = !!staffRow;
    }
  }

  if (!isStudent && !hasShopAccess) {
    return NextResponse.json({ error: "You do not have access to this order" }, { status: 403 });
  }

  // Only expose the pickup code to the student themself and shop staff —
  // it's already scoped by the query above, included by default.
  return NextResponse.json({ order });
}
