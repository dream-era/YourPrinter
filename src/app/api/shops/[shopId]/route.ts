/**
 * GET /api/shops/[shopId] — public shop details (RLS already restricts to
 * active shops or the owner viewing their own pending shop).
 * PATCH /api/shops/[shopId] — owner-only updates.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServiceRoleClient } from "@/lib/supabase/admin";
import { requireShopOwner } from "@/lib/auth/require-shop-owner";

export async function GET(_req: NextRequest, props: { params: Promise<{ shopId: string }> }) {
  const params = await props.params;
  const supabase = getServiceRoleClient();
  const { data: shop, error } = await supabase
    .from("shops")
    .select(
      "id, name, slug, description, address, contact_email, contact_phone, latitude, longitude, logo_url, business_hours, status, created_at, crowd_threshold_medium, crowd_threshold_high"
    )
    .eq("id", params.shopId)
    .single();

  if (error || !shop) {
    return NextResponse.json({ error: "Shop not found" }, { status: 404 });
  }

  // Include current payment-readiness
  const { data: paymentSettings } = await supabase
    .from("shop_payment_settings")
    .select("status")
    .eq("shop_id", params.shopId)
    .single();

  // Get active orders to compute live crowd level
  const { count: activeOrderCount } = await supabase
    .from("orders")
    .select("*", { count: "exact", head: true })
    .eq("shop_id", params.shopId)
    .in("status", ["accepted", "printing"])
    .gte("created_at", new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString());

  const count = activeOrderCount || 0;
  let queueStatus = "Quiet";
  let estimatedWaitMins = 5;
  if (count >= (shop.crowd_threshold_high || 8)) {
    queueStatus = "Busy";
    estimatedWaitMins = 25;
  } else if (count >= (shop.crowd_threshold_medium || 3)) {
    queueStatus = "Moderate";
    estimatedWaitMins = 12;
  }

  // Fetch pricing to determine services
  const { data: pricing } = await supabase
    .from("pricing")
    .select("bw_rate_paise, color_rate_paise, spiral_binding_rate_paise, hardbound_rate_paise, lamination_rate_paise")
    .eq("shop_id", params.shopId)
    .single();

  const services = [];
  if (pricing) {
    if (pricing.bw_rate_paise > 0) services.push("B&W");
    if (pricing.color_rate_paise > 0) services.push("Color");
    if (pricing.spiral_binding_rate_paise > 0 || pricing.hardbound_rate_paise > 0) services.push("Binding");
    if (pricing.lamination_rate_paise > 0) services.push("Lamination");
  } else {
    // Default fallback services if pricing not set
    services.push("B&W", "Color");
  }

  return NextResponse.json({
    id: shop.id,
    name: shop.name,
    slug: shop.slug,
    description: shop.description || "A high quality print shop.",
    address: shop.address,
    latitude: shop.latitude,
    longitude: shop.longitude,
    phone: shop.contact_phone || "N/A",
    rating: null,
    rating_count: 0,
    distanceKm: 0, // Distance is computed client-side or needs lat/lng params
    estimatedWaitMins,
    queueStatus,
    openUntil: "10 PM",
    coverImages: shop.logo_url ? [shop.logo_url] : [],
    services,
    autoPrintEnabled: false,
    paymentReady: paymentSettings?.status === "active",
  });
}

const updateShopSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  description: z.string().max(1000).optional(),
  address: z.string().max(300).optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  logoUrl: z.string().url().optional(),
  contactEmail: z.string().email().optional().or(z.literal("")),
  contactPhone: z.string().max(20).optional().or(z.literal("")),
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
  if (parsed.data.latitude !== undefined) update.latitude = parsed.data.latitude;
  if (parsed.data.longitude !== undefined) update.longitude = parsed.data.longitude;
  if (parsed.data.logoUrl) update.logo_url = parsed.data.logoUrl;
  if (parsed.data.contactEmail !== undefined) update.contact_email = parsed.data.contactEmail;
  if (parsed.data.contactPhone !== undefined) update.contact_phone = parsed.data.contactPhone;
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
