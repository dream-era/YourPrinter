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
import { getServiceRoleClient, createClient } from "@/lib/supabase/server";

export type RequireShopOwnerResult =
  | { ok: true; userId: string }
  | { ok: false; status: number; error: string };

export async function requireShopOwner(
  req: NextRequest,
  shopId: string
): Promise<RequireShopOwnerResult> {
  let userId: string | undefined;

  const authHeader = req.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");

  if (token) {
    const supabaseService = getServiceRoleClient();
    const { data: userData } = await supabaseService.auth.getUser(token);
    if (userData?.user) {
      userId = userData.user.id;
    }
  } else {
    // Fallback to cookie-based session
    const supabaseServer = await createClient();
    const { data: userData } = await supabaseServer.auth.getUser();
    if (userData?.user) {
      userId = userData.user.id;
    }
  }

  if (!userId) {
    return { ok: false, status: 401, error: "Missing or invalid auth session" };
  }

  const supabase = getServiceRoleClient();
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
