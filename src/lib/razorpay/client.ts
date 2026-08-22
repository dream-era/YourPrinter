/**
 * lib/razorpay/client.ts
 *
 * Builds a Razorpay SDK instance scoped to ONE shop, using that shop's own
 * Key ID + Key Secret (decrypted from shop_payment_settings). This replaces
 * the old single-platform-account + Route split model — there is no global
 * Razorpay client anymore. Every payment operation must go through
 * getShopRazorpayClient(shopId).
 */

import Razorpay from "razorpay";
import { getServiceRoleClient } from "@/lib/supabase/admin";
import { decryptSecret } from "@/lib/security/encryption";

export class ShopPaymentNotActiveError extends Error {
  constructor(shopId: string, status: string) {
    super(`Shop ${shopId} payment settings are not active (status: ${status})`);
    this.name = "ShopPaymentNotActiveError";
  }
}

export interface ShopPaymentCredentials {
  keyId: string;
  keySecret: string;
  webhookSecret: string;
  commissionBps: number;
}

/**
 * Fetches and decrypts a shop's Razorpay credentials.
 * Throws ShopPaymentNotActiveError if the shop hasn't completed onboarding
 * or verification failed — callers (order creation route) should catch this
 * and surface a clear "this shop can't accept payments yet" error rather
 * than a generic 500.
 */
export async function getShopPaymentCredentials(
  shopId: string
): Promise<ShopPaymentCredentials> {
  const supabase = getServiceRoleClient();

  const { data, error } = await supabase
    .from("shop_payment_settings")
    .select(
      "status, razorpay_key_id, razorpay_key_secret_enc, razorpay_key_secret_iv, razorpay_key_secret_tag, razorpay_webhook_secret_enc, razorpay_webhook_secret_iv, razorpay_webhook_secret_tag, commission_bps"
    )
    .eq("shop_id", shopId)
    .single();

  if (error || !data) {
    throw new ShopPaymentNotActiveError(shopId, "not_configured");
  }

  if (data.status !== "active") {
    throw new ShopPaymentNotActiveError(shopId, data.status);
  }

  const keySecret = decryptSecret({
    ciphertext: data.razorpay_key_secret_enc,
    iv: data.razorpay_key_secret_iv,
    authTag: data.razorpay_key_secret_tag,
  });

  const webhookSecret = decryptSecret({
    ciphertext: data.razorpay_webhook_secret_enc,
    iv: data.razorpay_webhook_secret_iv,
    authTag: data.razorpay_webhook_secret_tag,
  });

  return {
    keyId: data.razorpay_key_id,
    keySecret,
    webhookSecret,
    commissionBps: data.commission_bps,
  };
}

/**
 * Returns a Razorpay SDK client authenticated as the given shop.
 */
export async function getShopRazorpayClient(shopId: string): Promise<{
  client: Razorpay;
  credentials: ShopPaymentCredentials;
}> {
  const credentials = await getShopPaymentCredentials(shopId);
  const client = new Razorpay({
    key_id: credentials.keyId,
    key_secret: credentials.keySecret,
  });
  return { client, credentials };
}
