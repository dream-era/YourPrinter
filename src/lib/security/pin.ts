/**
 * lib/security/pin.ts
 * Hashing/verification for staff PIN codes (4-6 digits). Uses bcrypt like a
 * password — a PIN is low-entropy, so this alone isn't strong against
 * unlimited guessing, which is why the staff-login route rate-limits
 * attempts (see app/api/auth/staff-login/route.ts).
 */

import bcrypt from "bcryptjs";

const SALT_ROUNDS = 10;

export async function hashPin(pin: string): Promise<string> {
  if (!/^\d{4,6}$/.test(pin)) {
    throw new Error("PIN must be 4-6 digits");
  }
  return bcrypt.hash(pin, SALT_ROUNDS);
}

export async function verifyPin(pin: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pin, hash);
}
