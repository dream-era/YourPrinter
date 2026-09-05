/**
 * src/app/api/shops/[shopId]/payment-settings/route.ts
 *
 * POST — shop owner connects their own Razorpay account. Fields match the
 * "Payment Setup" UI exactly:
 *   Business Name (shown to students)  -> merchantName
 *   Razorpay Key ID                    -> keyId
 *   Razorpay Key Secret                -> keySecret
 *   Webhook Secret (Optional)          -> webhookSecret (nullable)
 *
 * We verify Key ID + Key Secret actually work with a real (uncaptured) ₹1
 * test order BEFORE marking the shop's connection "active" — the UI's
 * "Connection Status" reflects exactly this. Webhook secret is optional:
 * a shop can go live on Key ID + Key Secret alone; without a webhook
 * secret, automatic order confirmation via Razorpay's webhook won't work
 * for that shop, but checkout still completes via the client-side
 * /api/payments/verify path. We surface that distinction in the response
 * so the frontend can show a clear (non-blocking) note about it.
 *
 * GET — returns connection status only. Never returns secrets, not even
 * to the owner who set them.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import Razorpay from "razorpay";
import { getServiceRoleClient } from "@/lib/supabase/server";
import { encryptSecret } from "@/lib/security/encryption";
import { requireShopOwner } from "@/lib/auth/require-shop-owner";

const connectRazorpaySchema = z.object({
  merchantName: z.string().min(2).max(120),
  keyId: z
    .string()
    .regex(/^rzp_(live|test)_[A-Za-z0-9]+$/, "Doesn't look like a valid Razorpay Key ID"),
  keySecret: z.string().min(10, "Key secret looks too short"),
  webhookSecret: z.string().min(10, "Webhook secret looks too short").optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { shopId: string } }
) {
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

  // Verify credentials actually work before storing them as active — a
  // minimal, never-captured test order confirms both keys are accepted by
  // Razorpay's API without moving any real money.
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

  let encryptionError: string | null = null;
  let updatePayload: Record<string, unknown> = {};

  try {
    const keySecretEnc = encryptSecret(keySecret);
    updatePayload = {
      shop_id: shopId,
      razorpay_merchant_name: merchantName,
      razorpay_key_id: keyId,
      razorpay_key_secret_enc: keySecretEnc.ciphertext,
      razorpay_key_secret_iv: keySecretEnc.iv,
      razorpay_key_secret_tag: keySecretEnc.authTag,
    };

    if (webhookSecret) {
      const webhookSecretEnc = encryptSecret(webhookSecret);
      updatePayload.razorpay_webhook_secret_enc = webhookSecretEnc.ciphertext;
      updatePayload.razorpay_webhook_secret_iv = webhookSecretEnc.iv;
      updatePayload.razorpay_webhook_secret_tag = webhookSecretEnc.authTag;
    } else {
      // Explicitly clear if they're updating without one (e.g. re-saving
      // Key ID/Secret without touching an already-set webhook secret would
      // be a different code path — this route treats each POST as a full
      // replace of what's provided).
      updatePayload.razorpay_webhook_secret_enc = null;
      updatePayload.razorpay_webhook_secret_iv = null;
      updatePayload.razorpay_webhook_secret_tag = null;
    }
  } catch (err: any) {
    // This is the exact failure in the screenshot: ENCRYPTION_KEY missing
    // or malformed. Surface it clearly rather than a generic 500 — the
    // frontend's "Verification Failed" status block should show this
    // message directly, since it tells you exactly what to fix.
    encryptionError = err.message;
  }

  if (encryptionError) {
    return NextResponse.json(
      { error: "Server configuration error", details: encryptionError },
      { status: 500 }
    );
  }

  updatePayload.status = verificationError ? "failed" : "active";
  updatePayload.verified_at = verificationError ? null : new Date().toISOString();
  updatePayload.last_verification_error = verificationError;

  const { error: upsertError } = await supabase
    .from("shop_payment_settings")
    .upsert(updatePayload, { onConflict: "shop_id" });

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

  return NextResponse.json({
    status: "active",
    verifiedAt: new Date().toISOString(),
    webhookConfigured: !!webhookSecret,
    note: !webhookSecret
      ? "Payments will work, but automatic order confirmation via webhook is disabled until you add a Webhook Secret. Orders will still confirm through the checkout flow directly."
      : undefined,
  });
}

export async function GET(
  req: NextRequest,
  { params }: { params: { shopId: string } }
) {
  const { shopId } = params;
  const authResult = await requireShopOwner(req, shopId);
  if (!authResult.ok) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const supabase = getServiceRoleClient();
  const { data, error } = await supabase
    .from("shop_payment_settings")
    .select(
      "status, razorpay_merchant_name, razorpay_key_id, verified_at, last_verification_error, razorpay_webhook_secret_enc"
    )
    .eq("shop_id", shopId)
    .single();

  if (error || !data) {
    return NextResponse.json({ status: "not_configured" });
  }

  // Never return the *_enc / *_iv / *_tag columns as usable secrets — only
  // a boolean indicating whether a webhook secret has been set at all.
  return NextResponse.json({
    status: data.status,
    merchantName: data.razorpay_merchant_name,
    keyId: data.razorpay_key_id,
    verifiedAt: data.verified_at,
    lastVerificationError: data.last_verification_error,
    webhookConfigured: !!data.razorpay_webhook_secret_enc,
  });
}
