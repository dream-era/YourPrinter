/**
 * lib/orders/pickup-code.ts
 * Generates the short code shown to the student and entered/scanned at the
 * counter when the order becomes 'ready'. Not cryptographically sensitive —
 * it only needs to prevent casual mix-ups at a busy counter, not resist a
 * determined attacker (the order itself is already access-controlled by
 * student_id / shop_id via RLS).
 */

import crypto from "crypto";

/** 6-digit numeric code, easy to read aloud or type manually. */
export function generatePickupCode(): string {
  return crypto.randomInt(100000, 999999).toString();
}

/**
 * QR payload encodes both orderId and the code so staff can either scan
 * (fast path) or type the code manually if the scanner's down.
 * Keep this format stable — your QR-generation/rendering step (not included
 * here) should encode exactly this string.
 */
export function buildQrPayload(orderId: string, pickupCode: string): string {
  return `printq:${orderId}:${pickupCode}`;
}

export function parseQrPayload(
  payload: string
): { orderId: string; pickupCode: string } | null {
  const match = payload.match(/^printq:([a-f0-9-]{36}):(\d{6})$/i);
  if (!match) return null;
  return { orderId: match[1], pickupCode: match[2] };
}
