/**
 * GET /api/shops/[shopId] — public shop details (RLS already restricts to
 * active shops or the owner viewing their own pending shop).
 * PATCH /api/shops/[shopId] — owner-only updates.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServiceRoleClient } from "@/lib/supabase/server";
import { requireShopOwner } from "@/lib/auth/require-shop-owner";

export async function GET(_req: NextRequest, props: { params: Promise<{ shopId: string }> }) {
  const params = await props.params;
  const supabase = getServiceRoleClient();
  const { data: shop, error } = await supabase
    .from("shops")
    .select(
      "id, name, slug, description, address, latitude, longitude, logo_url, business_hours, status, created_at"
    )
    .eq("id", params.shopId)
    .single();

  if (error || !shop) {
    return NextResponse.json({ error: "Shop not found" }, { status: 404 });
  }

  // Include current payment-readiness so the frontend can hide "Upload &
  // Print" if the shop can't yet accept payments.
  const { data: paymentSettings } = await supabase
    .from("shop_payment_settings")
    .select("status")
    .eq("shop_id", params.shopId)
    .single();

  return NextResponse.json({
    ...shop,
    paymentReady: paymentSettings?.status === "active",
  });
}

const updateShopSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  description: z.string().max(1000).optional(),
  address: z.string().max(300).optional(),
  logoUrl: z.string().url().optional(),
  businessHours: z
    .record(z.string(), z.object({ open: z.string(), close: z.string() }))
    .optional(),
});

export async function PATCH(req: NextRequest, props: { params: Promise<{ shopId: string }> }) {
  const params = await props.params;
  const authResult = await requireShopOwner(req, params.shopId);
  if (!authResult.ok) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const body = await req.json().catch(() => null);
  const parsed = updateShopSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const supabase = getServiceRoleClient();
  const update: Record<string, unknown> = {};
  if (parsed.data.name) update.name = parsed.data.name;
  if (parsed.data.description !== undefined) update.description = parsed.data.description;
  if (parsed.data.address !== undefined) update.address = parsed.data.address;
  if (parsed.data.logoUrl) update.logo_url = parsed.data.logoUrl;
  if (parsed.data.businessHours) update.business_hours = parsed.data.businessHours;

  const { data: shop, error } = await supabase
    .from("shops")
    .update(update)
    .eq("id", params.shopId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: "Failed to update shop" }, { status: 500 });
  }

  return NextResponse.json({ shop });
}
