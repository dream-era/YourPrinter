/**
 * lib/pricing/calculate.ts
 *
 * Server-side price computation. The client sends print options and a
 * documentId only — never a price. This function is the single source of
 * truth for what an order costs, computed from the shop's own pricing
 * config table plus the actual page count read from document metadata.
 */

import { getServiceRoleClient } from "@/lib/supabase/server";
import type { CreateOrderInput } from "@/lib/validations/payment";

export interface PriceBreakdown {
  baseAmountPaise: number;
  bindingAmountPaise: number;
  laminationAmountPaise: number;
  urgentFeeAmountPaise: number;
  totalAmountPaise: number;
  pageCount: number;
  effectivePages: number; // pageCount * copies * (sides === 'single' ? 1 : 1) — sheets vs pages nuance below
}

export async function calculateOrderPrice(
  shopId: string,
  documentId: string,
  options: CreateOrderInput["printOptions"]
): Promise<PriceBreakdown> {
  const supabase = getServiceRoleClient();

  // Fetch both document metadata and shop pricing concurrently
  const [docResult, pricingResult] = await Promise.all([
    supabase
      .from("documents")
      .select("page_count, shop_id")
      .eq("id", documentId)
      .single(),
    supabase
      .from("pricing")
      .select("color_rate_paise, bw_rate_paise, staple_rate_paise, spiral_binding_rate_paise, hardbound_rate_paise, lamination_rate_paise, urgent_fee_percent")
      .eq("shop_id", shopId)
      .single(),
  ]);

  const { data: doc, error: docError } = docResult;
  const { data: pricing, error: pricingError } = pricingResult;

  if (docError || !doc) {
    throw new Error("Document not found or page count not yet processed.");
  }
  if (doc.shop_id !== shopId) {
    throw new Error("Document does not belong to the specified shop.");
  }

  const pageCount =
    options.pageRangeStart && options.pageRangeEnd
      ? options.pageRangeEnd - options.pageRangeStart + 1
      : doc.page_count;

  if (!pageCount || pageCount <= 0) {
    throw new Error("Invalid page count.");
  }

  if (pricingError || !pricing) {
    throw new Error("This shop has not configured pricing yet.");
  }

  const perPageRatePaise =
    options.color === "color"
      ? pricing.color_rate_paise
      : pricing.bw_rate_paise;

  // Double-sided halves the number of physical sheets but not the printed
  // page count for pricing purposes — pricing is per printed page here.
  // Adjust this if your shop pricing model charges per sheet instead.
  const sheetsPerCopy =
    options.sides === "double" ? Math.ceil(pageCount / 2) : pageCount;

  const effectivePages = sheetsPerCopy * options.copies;
  const baseAmountPaise = effectivePages * perPageRatePaise;

  const bindingRates: Record<string, number> = {
    none: 0,
    staple: pricing.staple_rate_paise ?? 0,
    spiral: pricing.spiral_binding_rate_paise ?? 0,
    hardbound: pricing.hardbound_rate_paise ?? 0,
  };
  const bindingAmountPaise = bindingRates[options.binding] * options.copies;

  const laminationAmountPaise = options.lamination
    ? (pricing.lamination_rate_paise ?? 0) * pageCount * options.copies
    : 0;

  const urgentFeeAmountPaise = options.urgent
    ? Math.round(
        (baseAmountPaise + bindingAmountPaise + laminationAmountPaise) *
          ((pricing.urgent_fee_percent ?? 0) / 100)
      )
    : 0;

  const totalAmountPaise =
    baseAmountPaise +
    bindingAmountPaise +
    laminationAmountPaise +
    urgentFeeAmountPaise;

  return {
    baseAmountPaise,
    bindingAmountPaise,
    laminationAmountPaise,
    urgentFeeAmountPaise,
    totalAmountPaise,
    pageCount,
    effectivePages,
  };
}
