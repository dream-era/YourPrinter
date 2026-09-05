/**
 * src/lib/security/encryption.ts
 *
 * AES-256-GCM encryption for secrets stored at rest — specifically each
 * shop's own Razorpay Key Secret and (optional) Webhook Secret.
 *
 * KEY FORMAT: 64-character HEX string (32 bytes). This matches the
 * convention already live in this project's Vercel environment —
 * generate with:
 *   openssl rand -hex 32
 *
 * Env var: ENCRYPTION_KEY
 * (If you have an old MASTER_ENCRYPTION_KEY base64 value lying around from
 * an earlier version of this file, it will NOT work here — that was a
 * different encoding entirely. Generate a fresh hex key and re-run the
 * payment-settings connection flow for every shop; there's no way to
 * migrate a base64 key into this format, since they're not the same bytes.)
 *
 * This key must differ between dev/staging/prod, must be set for ALL
 * Vercel environments (Production, Preview, Development), and must never
 * be committed to source control.
 */

import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH_BYTES = 12; // recommended for GCM
const KEY_LENGTH_BYTES = 32; // AES-256

function getKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error(
      "ENCRYPTION_KEY is not set. Generate one with `openssl rand -hex 32` and add it to your environment."
    );
  }

  if (!/^[0-9a-fA-F]{64}$/.test(key)) {
    throw new Error(
      `ENCRYPTION_KEY must be a 64-character hex string (32 bytes). Got ${key.length} characters. Regenerate with \`openssl rand -hex 32\`.`
    );
  }

  const buf = Buffer.from(key, "hex");
  if (buf.length !== KEY_LENGTH_BYTES) {
    throw new Error(
      `ENCRYPTION_KEY decoded to ${buf.length} bytes, expected ${KEY_LENGTH_BYTES}. Regenerate with \`openssl rand -hex 32\`.`
    );
  }
  return buf;
}

export interface EncryptedPayload {
  ciphertext: string; // base64
  iv: string; // base64
  authTag: string; // base64
}

/**
 * Encrypts a plaintext secret. Returns three base64 strings to be stored
 * in separate columns (ciphertext / iv / authTag).
 */
export function encryptSecret(plaintext: string): EncryptedPayload {
  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH_BYTES);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return {
    ciphertext: encrypted.toString("base64"),
    iv: iv.toString("base64"),
    authTag: authTag.toString("base64"),
  };
}

/**
 * Decrypts a secret previously encrypted with encryptSecret(). Throws if
 * the auth tag doesn't match (tampered ciphertext or wrong key) — callers
 * should treat any thrown error here as "these credentials are unusable",
 * not retry with fallback logic.
 */
export function decryptSecret(payload: EncryptedPayload): string {
  const key = getKey();
  const iv = Buffer.from(payload.iv, "base64");
  const authTag = Buffer.from(payload.authTag, "base64");
  const ciphertext = Buffer.from(payload.ciphertext, "base64");

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}

/**
 * Verifies a Razorpay-style HMAC-SHA256 signature — used for both
 * client-side payment verification and webhook signature verification.
 * Returns false on any malformed input rather than throwing, since this
 * runs on untrusted request bodies.
 */
export function verifyHmacSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  try {
    const expected = crypto
      .createHmac("sha256", secret)
      .update(payload)
      .digest("hex");
    const a = Buffer.from(expected);
    const b = Buffer.from(signature);
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
