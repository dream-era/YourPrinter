/**
 * lib/auth/staff-jwt.ts
 *
 * Staff (counter operators/managers/cashiers) log in with a PIN, not
 * email/password — a full Supabase Auth session is overkill for a shared
 * counter device. This issues a short-lived, purpose-specific JWT scoped to
 * one staff member at one shop. It is NOT a Supabase Auth token and is
 * verified separately in requireShopAccess (which tries Supabase auth first,
 * then falls back to this).
 *
 * STAFF_JWT_SECRET must be set (a long random string, distinct from
 * MASTER_ENCRYPTION_KEY) — generate with: openssl rand -base64 32
 */

import jwt from "jsonwebtoken";

const SHIFT_LENGTH = "12h"; // staff sessions expire after a typical shift

export interface StaffTokenPayload {
  staffId: string; // shop_staff.id
  userId: string; // profiles.id for this staff member
  shopId: string;
  role: "manager" | "printer_operator" | "cashier";
}

function getSecret(): string {
  const secret = process.env.STAFF_JWT_SECRET;
  if (!secret) {
    throw new Error(
      "STAFF_JWT_SECRET is not set. Generate one with `openssl rand -base64 32`."
    );
  }
  return secret;
}

export function signStaffToken(payload: StaffTokenPayload): string {
  return jwt.sign(payload, getSecret(), { expiresIn: SHIFT_LENGTH });
}

/** Returns the payload if valid, or null if expired/invalid/malformed. */
export function verifyStaffToken(token: string): StaffTokenPayload | null {
  try {
    const decoded = jwt.verify(token, getSecret());
    if (
      typeof decoded === "object" &&
      decoded &&
      "staffId" in decoded &&
      "userId" in decoded &&
      "shopId" in decoded &&
      "role" in decoded
    ) {
      return decoded as unknown as StaffTokenPayload;
    }
    return null;
  } catch {
    return null;
  }
}
