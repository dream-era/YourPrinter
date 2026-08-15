import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServiceRoleClient } from "@/lib/supabase/server";
import { requireShopOwner } from "@/lib/auth/require-shop-owner";

export async function GET(_req: NextRequest, props: { params: Promise<{ shopId: string }> }) {
  const params = await props.params;
  const supabase = getServiceRoleClient();
  const { data, error } = await supabase
    .from("pricing")
    .select("color_rate_paise, bw_rate_paise, staple_rate_paise, spiral_binding_rate_paise, hardbound_rate_paise, lamination_rate_paise, urgent_fee_percent, config")
    .eq("shop_id", params.shopId)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Pricing not configured for this shop" }, { status: 404 });
  }
  return NextResponse.json({ pricing: data });
}

const updatePricingSchema = z.object({
  colorRatePaise: z.number().int().min(0).optional(),
  bwRatePaise: z.number().int().min(0).optional(),
  stapleRatePaise: z.number().int().min(0).optional(),
  spiralBindingRatePaise: z.number().int().min(0).optional(),
  hardboundRatePaise: z.number().int().min(0).optional(),
  laminationRatePaise: z.number().int().min(0).optional(),
  urgentFeePercent: z.number().int().min(0).max(200).optional(),
  config: z.any().optional(),
});

export async function PUT(req: NextRequest, props: { params: Promise<{ shopId: string }> }) {
  const params = await props.params;
  const authResult = await requireShopOwner(req, params.shopId);
  if (!authResult.ok) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const body = await req.json().catch(() => null);
  const parsed = updatePricingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const update: Record<string, unknown> = {};
  const map: Record<string, string> = {
    colorRatePaise: "color_rate_paise",
    bwRatePaise: "bw_rate_paise",
    stapleRatePaise: "staple_rate_paise",
    spiralBindingRatePaise: "spiral_binding_rate_paise",
    hardboundRatePaise: "hardbound_rate_paise",
    laminationRatePaise: "lamination_rate_paise",
    urgentFeePercent: "urgent_fee_percent",
    config: "config",
  };
  for (const [key, column] of Object.entries(map)) {
    const value = (parsed.data as Record<string, unknown>)[key];
    if (value !== undefined) update[column] = value;
  }

  const supabase = getServiceRoleClient();
  const { data, error } = await supabase
    .from("pricing")
    .update(update)
    .eq("shop_id", params.shopId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: "Failed to update pricing" }, { status: 500 });
  }

  return NextResponse.json({ pricing: data });
}
