/**
 * GET /api/shops/[shopId]/orders/queue
 * Powers the staff dashboard kanban: returns orders grouped by status for
 * this shop. Owner or any active staff member can view.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase/admin";
import { requireShopAccess } from "@/lib/auth/require-shop-access";

const QUEUE_STATUSES = ["accepted", "printing", "ready"] as const;

export async function GET(req: NextRequest, props: { params: Promise<{ shopId: string }> }) {
  const params = await props.params;
  const authResult = await requireShopAccess(req, params.shopId);
  if (!authResult.ok) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const supabase = getServiceRoleClient();
  const { data: orders, error } = await supabase
    .from("orders")
    .select(
      `id, status, print_options, amount_paise, pickup_code, created_at, accepted_at,
       printing_started_at, ready_at, assigned_staff_id,
       student:profiles!orders_student_id_fkey (full_name, phone),
       document:documents (id, original_filename, page_count, mime_type)`
    )
    .eq("shop_id", params.shopId)
    .in("status", QUEUE_STATUSES)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: "Failed to load queue", details: error.message }, { status: 500 });
  }

  const grouped: Record<(typeof QUEUE_STATUSES)[number], typeof orders> = {
    accepted: [],
    printing: [],
    ready: [],
  };
  for (const order of orders ?? []) {
    grouped[order.status as (typeof QUEUE_STATUSES)[number]]?.push(order);
  }

  return NextResponse.json({ queue: grouped });
}
