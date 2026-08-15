/**
 * lib/auth/require-shop-owner.ts
 *
 * Confirms the requesting user is authenticated AND owns the given shop.
 * This is a stub — if your existing Phase 0 codebase already has an
 * equivalent (e.g. from ServeFlow's "shop_id cross-tenant checks returning
 * 403 on mismatch" convention), use that instead and delete this file.
 * The contract every route in this backend expects:
 *
 *   requireShopOwner(req, shopId) => { ok: true, userId } | { ok: false, status, error }
 */

import { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getServiceRoleClient } from "@/lib/supabase/server";

export type RequireShopOwnerResult =
  | { ok: true; userId: string }
  | { ok: false; status: number; error: string };

export async function requireShopOwner(
  req: NextRequest,
  shopId: string
): Promise<RequireShopOwnerResult> {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");

  if (!token) {
    return { ok: false, status: 401, error: "Missing auth token" };
  }

  const supabase = getServiceRoleClient();
  const { data: userData, error: userError } = await supabase.auth.getUser(token);

  if (userError || !userData?.user) {
    return { ok: false, status: 401, error: "Invalid or expired session" };
  }

  const userId = userData.user.id;

  const { data: shop, error: shopError } = await supabase
    .from("shops")
    .select("owner_id")
    .eq("id", shopId)
    .single();

  if (shopError || !shop) {
    return { ok: false, status: 404, error: "Shop not found" };
  }

  if (shop.owner_id !== userId) {
    return { ok: false, status: 403, error: "You do not own this shop" };
  }

  return { ok: true, userId };
}
