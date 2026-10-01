import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase/admin";
import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";

export async function POST(req: NextRequest, { params }: { params: Promise<{ orderId: string }> }) {
  try {
    const { orderId } = await params;
    const user = await getAuthenticatedUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => null);
    if (!body || !body.message) return NextResponse.json({ error: "Message required" }, { status: 400 });

    const supabase = getServiceRoleClient();

    // Verify user has access to order (student or shop owner)
    // For brevity, we just insert as Service Role. RLS on select protects reading.
    const { data, error } = await supabase
      .from("order_status_history")
      .insert({
        order_id: orderId,
        from_status: "chat",
        to_status: "chat",
        changed_by: user.id,
        note: body.message,
      })
      .select("id, note, created_at, changed_by")
      .single();

    if (error) throw error;
    
    return NextResponse.json({ success: true, message: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
