/**
 * DELETE /api/shops/[shopId]/agents/[agentId]
 * Revokes an agent's key immediately (soft-delete: active=false) — a
 * stolen/lost shop PC's key stops working on its next request, since
 * requireAgent checks `active` on every call.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase/admin";
import { requireShopOwner } from "@/lib/auth/require-shop-owner";

export async function DELETE(
  req: NextRequest,
  props: { params: Promise<{ shopId: string; agentId: string }> }
) {
  const params = await props.params;
  const authResult = await requireShopOwner(req, params.shopId);
  if (!authResult.ok) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const supabase = getServiceRoleClient();
  const { data: agent, error } = await supabase
    .from("shop_agents")
    .update({ active: false })
    .eq("id", params.agentId)
    .eq("shop_id", params.shopId)
    .select("id")
    .single();

  if (error || !agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
