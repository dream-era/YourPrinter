/**
 * POST /api/shops/[shopId]/payment-settings
 * Shop owner connects their own Razorpay account. We verify the credentials
 * actually work (a live call to Razorpay) BEFORE marking the shop 'active' —
 * per PRD: "No orders until connected" / verified.
 *
 * GET /api/shops/[shopId]/payment-settings
 * Returns masked status only — never the secrets, not even to the owner.
 */

import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";
import { getServiceRoleClient } from "@/lib/supabase/server";
import { encryptSecret } from "@/lib/security/encryption";
import { connectRazorpaySchema } from "@/lib/validations/payment";
import { requireShopOwner } from "@/lib/auth/require-shop-owner"; // see note below

export async function POST(req: NextRequest, props: { params: Promise<{ shopId: string }> }) {
  const params = await props.params;
  const { shopId } = params;

  // Auth: confirm the caller owns this shop. If your existing Phase 0 auth
  // helper has a different name/signature, swap this import — the contract
  // needed is: throws/returns 403 unless the authenticated user owns shopId.
  const authResult = await requireShopOwner(req, shopId);
  if (!authResult.ok) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const body = await req.json().catch(() => null);
  const parsed = connectRazorpaySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const { merchantName, keyId, keySecret, webhookSecret } = parsed.data;

  // Verify credentials actually work before storing them as active.
  // A lightweight, side-effect-free call: fetching a nonexistent order
  // returns a structured 4xx from Razorpay if auth succeeds, vs an auth
  // error if the keys are wrong. We use the "create a ₹1 order, don't
  // capture it" style check instead: creating a minimal order is the most
  // reliable way to confirm both keys are valid and active.
  let verificationError: string | null = null;
  try {
    const testClient = new Razorpay({ key_id: keyId, key_secret: keySecret });
    // A tiny, never-charged test order (amount in paise, currency INR).
    // This does not move money — it only confirms the credentials are
    // accepted by Razorpay's API.
    await testClient.orders.create({
      amount: 100,
      currency: "INR",
      receipt: `printq_verify_${shopId}_${Date.now()}`,
      notes: { purpose: "printq_credential_verification" },
    });
  } catch (err: any) {
    verificationError =
      err?.error?.description || err?.message || "Razorpay rejected these credentials.";
  }

  const supabase = getServiceRoleClient();

  const keySecretEnc = encryptSecret(keySecret);
  const webhookSecretEnc = encryptSecret(webhookSecret);

  const { error: upsertError } = await supabase
    .from("shop_payment_settings")
    .upsert(
      {
        shop_id: shopId,
        razorpay_merchant_name: merchantName,
        razorpay_key_id: keyId,
        razorpay_key_secret_enc: keySecretEnc.ciphertext,
        razorpay_key_secret_iv: keySecretEnc.iv,
        razorpay_key_secret_tag: keySecretEnc.authTag,
        razorpay_webhook_secret_enc: webhookSecretEnc.ciphertext,
        razorpay_webhook_secret_iv: webhookSecretEnc.iv,
        razorpay_webhook_secret_tag: webhookSecretEnc.authTag,
        status: verificationError ? "failed" : "active",
        verified_at: verificationError ? null : new Date().toISOString(),
        last_verification_error: verificationError,
      },
      { onConflict: "shop_id" }
    );

  if (upsertError) {
    return NextResponse.json(
      { error: "Failed to save payment settings", details: upsertError.message },
      { status: 500 }
    );
  }

  if (verificationError) {
    return NextResponse.json(
      { error: "Credentials saved but verification failed", details: verificationError },
      { status: 422 }
    );
  }

  return NextResponse.json({ status: "active", verifiedAt: new Date().toISOString() });
}

export async function GET(req: NextRequest, props: { params: Promise<{ shopId: string }> }) {
  const params = await props.params;
  const { shopId } = params;
  const authResult = await requireShopOwner(req, shopId);
  if (!authResult.ok) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const supabase = getServiceRoleClient();
  const { data, error } = await supabase
    .from("shop_payment_settings")
    .select("status, razorpay_merchant_name, razorpay_key_id, verified_at, last_verification_error")
    .eq("shop_id", shopId)
    .single();

  if (error || !data) {
    return NextResponse.json({ status: "not_configured" });
  }

  // Explicitly never include the *_enc / *_iv / *_tag columns here.
  return NextResponse.json(data);
}
