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
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const search = searchParams.get("search") || "";
  const filter = searchParams.get("filter") || "all";

  const supabase = getServiceRoleClient();
  let query = supabase
    .from("orders")
    .select(
      `id, status, print_options, amount_paise, pickup_code, created_at, accepted_at,
       printing_started_at, ready_at, completed_at, cancelled_at, assigned_staff_id,
       student:profiles!orders_student_id_fkey (full_name, phone),
       document:documents (id, original_filename, page_count, mime_type, size_bytes)`,
      { count: "exact" }
    )
    .eq("shop_id", params.shopId);

  // Apply filters
  if (filter !== "all") {
    if (filter === "today") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      query = query.gte("created_at", today.toISOString());
    } else if (filter === "this_week") {
      const thisWeek = new Date();
      thisWeek.setDate(thisWeek.getDate() - 7);
      query = query.gte("created_at", thisWeek.toISOString());
    } else if (filter === "urgent") {
      query = query.eq("print_options->>urgent", "true");
    } else if (filter === "paid") {
      // anything accepted or beyond is paid, pending_payment is unpaid, cancelled/failed might be paid depending on refund_status
      query = query.not("status", "eq", "pending_payment").not("status", "eq", "failed");
    } else {
      query = query.eq("status", filter);
    }
  }

  // Apply search
  if (search) {
    query = query.ilike("id", `%${search}%`);
  }

  // Apply Pagination
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  query = query.order("created_at", { ascending: false }).range(from, to);

  const { data: orders, count, error } = await query;

  if (error) {
    return NextResponse.json({ error: "Failed to load orders", details: error.message }, { status: 500 });
  }

  return NextResponse.json({ orders, total: count, page, limit });
}
