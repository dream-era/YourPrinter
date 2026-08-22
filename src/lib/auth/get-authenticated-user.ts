/**
 * lib/auth/get-authenticated-user.ts
 * Returns the authenticated user (any role) from the request's bearer token,
 * or null. Use this for student-facing routes; use requireShopOwner for
 * shop-owner-only routes.
 */

import { NextRequest } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase/admin";

export async function getAuthenticatedUser(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");
  if (!token) return null;

  const supabase = getServiceRoleClient();
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) return null;

  return data.user;
}
