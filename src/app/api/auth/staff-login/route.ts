/**
 * POST /api/auth/staff-login
 * Body: { shopId, phone, pin }
 *
 * Returns a staff session JWT (see lib/auth/staff-jwt.ts) — pass it as the
 * Bearer token to every shop-scoped route the same way a Supabase Auth
 * token would be used. Session lasts 12h (one shift).
 *
 * Rate limiting: Upstash Redis (lib/security/rate-limit.ts), 5 attempts /
 * 15 min per shop+phone — shared and persistent across serverless
 * instances, unlike an in-memory map.
 */

export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServiceRoleClient } from "@/lib/supabase/admin";
import { verifyPin } from "@/lib/security/pin";
import { signStaffToken } from "@/lib/auth/staff-jwt";
import { getStaffLoginLimiter, checkRateLimit } from "@/lib/security/rate-limit";

const bodySchema = z.object({
  shopId: z.string().uuid(),
  phone: z.string().min(6).max(20),
  pin: z.string().regex(/^\d{4,6}$/),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const { shopId, phone, pin } = parsed.data;

  const rateLimitKey = `${shopId}:${phone}`;
  const { allowed, resetAt } = await checkRateLimit(getStaffLoginLimiter(), rateLimitKey);
  if (!allowed) {
    const retryAfterSeconds = Math.ceil((resetAt - Date.now()) / 1000);
    return NextResponse.json(
      { error: "Too many attempts. Try again later.", retryAfterSeconds },
      { status: 429 }
    );
  }

  const supabase = getServiceRoleClient();
  const { data: staffRow, error } = await supabase
    .from("shop_staff")
    .select("id, user_id, role, active, pin_hash")
    .eq("shop_id", shopId)
    .eq("phone", phone)
    .single();

  if (error || !staffRow || !staffRow.active || !staffRow.pin_hash) {
    // Same error for "not found" and "wrong PIN" — don't leak which one.
    return NextResponse.json({ error: "Invalid phone or PIN" }, { status: 401 });
  }

  const pinValid = await verifyPin(pin, staffRow.pin_hash);
  if (!pinValid) {
    return NextResponse.json({ error: "Invalid phone or PIN" }, { status: 401 });
  }

  const token = signStaffToken({
    staffId: staffRow.id,
    userId: staffRow.user_id,
    shopId,
    role: staffRow.role,
  });

  await supabase
    .from("shop_staff")
    .update({ last_login_at: new Date().toISOString() })
    .eq("id", staffRow.id);

  return NextResponse.json({
    token,
    role: staffRow.role,
    expiresIn: "12h",
  });
}
