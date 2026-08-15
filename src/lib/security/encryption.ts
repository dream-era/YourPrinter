/**
 * lib/security/encryption.ts
 *
 * AES-256-GCM encryption for secrets that must be stored at rest
 * (per-shop Razorpay Key Secret + Webhook Secret).
 *
 * Master key comes from process.env.ENCRYPTION_KEY — a 64-character HEX string,
 * generated with:
 *   openssl rand -hex 32
 *
 * This key must NEVER be committed, must differ between dev/staging/prod,
 * and should live in your hosting provider's secret manager (Vercel env
 * vars marked "sensitive"), not a plain .env file in production.
 *
 * Rotation note: if you ever rotate ENCRYPTION_KEY, every row in
 * shop_payment_settings must be re-encrypted with the new key in the same
 * migration — there is no versioning built in here. If you expect to rotate
 * keys more than once, add a `key_version` column before going live.
 */

import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH_BYTES = 12; // recommended for GCM

function getMasterKey(): Buffer {
  const keyHex = process.env.ENCRYPTION_KEY;
  if (!keyHex) {
    throw new Error(
      "ENCRYPTION_KEY is not set. Generate one with `openssl rand -hex 32` and add it to your environment."
    );
  }
  const buf = Buffer.from(keyHex, "hex");
  if (buf.length !== 32) {
    throw new Error(
      `ENCRYPTION_KEY must be a 64-character hex string (32 bytes), got ${buf.length} bytes. Regenerate with \`openssl rand -hex 32\`.`
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
  const key = getMasterKey();
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
 * Decrypts a secret previously encrypted with encryptSecret().
 * Throws if the auth tag doesn't match (tampered or wrong key) — callers
 * should treat any thrown error here as "credentials unusable", not retry
 * with fallback logic.
 */
export function decryptSecret(payload: EncryptedPayload): string {
  const key = getMasterKey();
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
 * Convenience: verifies a Razorpay-style HMAC-SHA256 signature
 * (used both for payment verification and webhook verification).
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
    // timingSafeEqual requires equal-length buffers
    const a = Buffer.from(expected);
    const b = Buffer.from(signature);
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
