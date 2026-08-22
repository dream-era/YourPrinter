/**
 * POST /api/orders
 *
 * Creates a YourPrinter order + a corresponding Razorpay order, using the
 * TARGET SHOP'S OWN Razorpay credentials (per shop_payment_settings).
 * Price is always computed server-side from pricing config + verified
 * document page count — the client only sends print options, never a price.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase/admin";
import { getShopRazorpayClient, ShopPaymentNotActiveError } from "@/lib/razorpay/client";
import { calculateOrderPrice } from "@/lib/pricing/calculate";
import { createOrderSchema } from "@/lib/validations/payment";
import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user"; // see companion file

import { checkRateLimit, getStandardLimiter } from "@/lib/security/rate-limit";

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { allowed } = await checkRateLimit(getStandardLimiter(), `order:${user.id}`);
  if (!allowed) {
    return NextResponse.json({ error: "Too many order requests. Please try again later." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = createOrderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const { shopId, documentId, printOptions } = parsed.data;

  const supabase = getServiceRoleClient();

  // Confirm the document belongs to this student (uploaded by them) and
  // to the target shop — prevents someone paying shop A's price to print
  // at shop B, or printing someone else's uploaded file.
  const { data: doc, error: docError } = await supabase
    .from("documents")
    .select("id, uploaded_by, shop_id")
    .eq("id", documentId)
    .single();

  if (docError || !doc) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }
  if (doc.uploaded_by !== user.id) {
    return NextResponse.json({ error: "This document does not belong to you" }, { status: 403 });
  }
  if (doc.shop_id !== shopId) {
    return NextResponse.json({ error: "Document was not uploaded for this shop" }, { status: 400 });
  }

  // Price is computed here — never trust anything from the request body.
  let price;
  try {
    price = await calculateOrderPrice(shopId, documentId, printOptions);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Pricing failed" }, { status: 400 });
  }

  // Get a Razorpay client scoped to this shop's own account.
  let razorpay, credentials;
  try {
    const result = await getShopRazorpayClient(shopId);
    razorpay = result.client;
    credentials = result.credentials;
  } catch (err) {
    if (err instanceof ShopPaymentNotActiveError) {
      return NextResponse.json(
        { error: "This shop cannot accept payments yet. Please try another shop." },
        { status: 422 }
      );
    }
    return NextResponse.json({ error: "Payment setup error" }, { status: 500 });
  }

  // Create our internal order row first (status: pending_payment) so we
  // have a stable internal order id to reconcile against, regardless of
  // what happens with Razorpay next.
  const { data: order, error: orderInsertError } = await supabase
    .from("orders")
    .insert({
      shop_id: shopId,
      student_id: user.id,
      document_id: documentId,
      print_options: printOptions,
      amount_paise: price.totalAmountPaise,
      status: "pending_payment",
    })
    .select("id")
    .single();

  if (orderInsertError || !order) {
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }

  // Create the Razorpay order on the SHOP'S OWN account.
  let razorpayOrder;
  try {
    razorpayOrder = await razorpay.orders.create({
      amount: price.totalAmountPaise,
      currency: "INR",
      receipt: order.id,
      notes: { printq_order_id: order.id, shop_id: shopId },
    });
  } catch (err: any) {
    // Roll back to a failed state rather than leaving a dangling pending order.
    await supabase.from("orders").update({ status: "failed" }).eq("id", order.id);
    return NextResponse.json(
      { error: "Failed to create payment order", details: err?.error?.description },
      { status: 502 }
    );
  }

  await supabase
    .from("orders")
    .update({ razorpay_order_id: razorpayOrder.id })
    .eq("id", order.id);

  // Record the commission the platform is owed for this order, to be
  // settled later (no auto-split available with per-shop accounts).
  const commissionPaise = Math.round(
    (price.totalAmountPaise * credentials.commissionBps) / 10000
  );
  await supabase.from("platform_commission_ledger").insert({
    shop_id: shopId,
    order_id: order.id,
    order_amount_paise: price.totalAmountPaise,
    commission_bps: credentials.commissionBps,
    commission_paise: commissionPaise,
  });

  return NextResponse.json({
    orderId: order.id,
    razorpayOrderId: razorpayOrder.id,
    razorpayKeyId: credentials.keyId, // safe to expose — needed by client-side Razorpay checkout widget
    amountPaise: price.totalAmountPaise,
    priceBreakdown: price,
  });
}
