/**
 * lib/razorpay/platform-client.ts
 *
 * YourPrinter's OWN Razorpay account — separate from every shop's account —
 * used only to collect commission via Payment Links. This is a genuinely
 * different credential pair from anything in shop_payment_settings.
 *
 * Env vars (add to your platform environment, not per-shop):
 *   PLATFORM_RAZORPAY_KEY_ID
 *   PLATFORM_RAZORPAY_KEY_SECRET
 *   PLATFORM_RAZORPAY_WEBHOOK_SECRET
 */

import Razorpay from "razorpay";

let _client: Razorpay | null = null;

export function getPlatformRazorpayClient(): Razorpay {
  if (_client) return _client;

  const keyId = process.env.PLATFORM_RAZORPAY_KEY_ID;
  const keySecret = process.env.PLATFORM_RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    throw new Error(
      "PLATFORM_RAZORPAY_KEY_ID and PLATFORM_RAZORPAY_KEY_SECRET must be set (YourPrinter's own account, not a shop's)."
    );
  }

  _client = new Razorpay({ key_id: keyId, key_secret: keySecret });
  return _client;
}

export function getPlatformWebhookSecret(): string {
  const secret = process.env.PLATFORM_RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error("PLATFORM_RAZORPAY_WEBHOOK_SECRET is not set.");
  }
  return secret;
}
