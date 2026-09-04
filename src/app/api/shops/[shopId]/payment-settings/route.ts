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
import { getServiceRoleClient } from "@/lib/supabase/admin";
import { encryptSecret } from "@/lib/security/encryption";
import { connectRazorpaySchema } from "@/lib/validations/payment";
import { requireShopOwner } from "@/lib/auth/require-shop-owner"; // see note below

export async function POST(req: NextRequest, props: { params: Promise<{ shopId: string }> }) {
  try {
    const params = await props.params;
    const { shopId } = params;

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

    let verificationError: string | null = null;
    try {
      const testClient = new Razorpay({ key_id: keyId, key_secret: keySecret });
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
    const webhookSecretEnc = encryptSecret(webhookSecret || "dummy_webhook_secret_not_set");

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
  } catch (err: any) {
    console.error("Unhandled error in POST:", err);
    return NextResponse.json({ error: "Unhandled server error", details: err.message }, { status: 500 });
  }
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
