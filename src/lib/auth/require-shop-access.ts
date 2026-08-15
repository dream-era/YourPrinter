/**
 * lib/auth/require-shop-access.ts
 * Like require-shop-owner, but also allows shop_staff members (any active
 * role: manager, printer_operator, cashier). Use this for order-queue /
 * order-status routes that staff (not just the owner) need to operate.
 *
 * Accepts TWO kinds of bearer token:
 *  1. A normal Supabase Auth session (the shop owner, or a staff member who
 *     also happens to have a full account).
 *  2. A staff PIN-session JWT (see lib/auth/staff-jwt.ts) issued by
 *     /api/auth/staff-login. This is tried second since it's a fallback for
 *     the common case of counter staff who log in via PIN, not email.
 */

import { NextRequest } from "next/server";
import { getServiceRoleClient, createClient } from "@/lib/supabase/server";
import { verifyStaffToken } from "@/lib/auth/staff-jwt";

export type RequireShopAccessResult =
  | { ok: true; userId: string; role: "owner" | "manager" | "printer_operator" | "cashier" }
  | { ok: false; status: number; error: string };

export async function requireShopAccess(
  req: NextRequest,
  shopId: string
): Promise<RequireShopAccessResult> {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");

  const supabase = getServiceRoleClient();
  let userId: string | undefined;

  // Attempt 1: Supabase Auth session (owner, or a staff member with a full account).
  if (token) {
    const { data: userData } = await supabase.auth.getUser(token);
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

  if (userId) {
    const { data: shop } = await supabase
      .from("shops")
      .select("owner_id")
      .eq("id", shopId)
      .single();

    if (shop?.owner_id === userId) {
      return { ok: true, userId, role: "owner" };
    }

    const { data: staffRow } = await supabase
      .from("shop_staff")
      .select("role, active")
      .eq("shop_id", shopId)
      .eq("user_id", userId)
      .eq("active", true)
      .single();

    if (staffRow) {
      return { ok: true, userId, role: staffRow.role };
    }

    return { ok: false, status: 403, error: "You do not have access to this shop" };
  }

  // Attempt 2: staff PIN-session JWT. (Needs token in header)
  if (token) {
    const staffPayload = verifyStaffToken(token);
    if (staffPayload) {
      if (staffPayload.shopId !== shopId) {
        return { ok: false, status: 403, error: "This session is for a different shop" };
      }

      // Re-check the staff row is still active — a reset PIN or removal should
      // invalidate outstanding sessions even before the JWT naturally expires.
      const { data: staffRow } = await supabase
        .from("shop_staff")
        .select("active, role")
        .eq("id", staffPayload.staffId)
        .single();

      if (!staffRow?.active) {
        return { ok: false, status: 401, error: "Staff session no longer valid" };
      }

      return { ok: true, userId: staffPayload.userId, role: staffRow.role };
    }
  }

  return { ok: false, status: 401, error: "Invalid or expired session" };
}
