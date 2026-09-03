/**
 * POST /api/shops
 * Creates a new shop, owned by the authenticated user. New shops start
 * 'pending' — they won't appear in nearby search or accept orders until
 * (a) an admin/you flip status to 'active' (or you automate this on some
 * verification criteria) and (b) payment settings are connected + active
 * (see the payment-settings route from the payment layer package).
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServiceRoleClient } from "@/lib/supabase/admin";
import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";

const createShopSchema = z.object({
  name: z.string().min(2).max(120),
  slug: z
    .string()
    .min(2)
    .max(60)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens only"),
  description: z.string().max(1000).optional(),
  address: z.string().max(300).optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  businessHours: z.record(z.string(), z.object({ open: z.string(), close: z.string() })).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    const parsed = createShopSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const supabase = getServiceRoleClient();

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "owner") {
      return NextResponse.json(
        { error: "Only accounts with the 'owner' role can create a shop" },
        { status: 403 }
      );
    }

    const { data: shop, error } = await supabase
      .from("shops")
      .insert({
        owner_id: user.id,
        name: parsed.data.name,
        slug: parsed.data.slug,
        description: parsed.data.description,
        address: parsed.data.address,
        latitude: parsed.data.latitude,
        longitude: parsed.data.longitude,
        business_hours: parsed.data.businessHours ?? null,
        status: "active",
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "That shop slug is already taken" }, { status: 409 });
      }
      return NextResponse.json({ error: `Database Error: ${error.message}` }, { status: 500 });
    }

    await supabase.from("pricing").insert({ shop_id: shop.id });

    return NextResponse.json({ shop }, { status: 201 });
  } catch (err: any) {
    console.error("Unhandled API exception:", err);
    return NextResponse.json({ error: `Server Crash: ${err.message || "Unknown error"}` }, { status: 500 });
  }
}
