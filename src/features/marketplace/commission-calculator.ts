import { SubscriptionTier, CommissionSplitResult, ShopSubscriptionPlan } from "./types";

export const SUBSCRIPTION_PLANS: Record<SubscriptionTier, ShopSubscriptionPlan> = {
  free: {
    id: "free",
    name: "Standard Free Plan",
    priceMonthly: 0,
    commissionRate: 0.10, // 10% platform share
    features: ["10% Platform Commission", "Standard Print Queue Spooler", "Standard Map Ranking", "Basic Analytics"],
  },
  premium: {
    id: "premium",
    name: "Growth Premium Plan",
    priceMonthly: 999,
    commissionRate: 0.05, // 5% platform share
    features: ["5% Platform Commission (50% Off)", "Verified Shop Badge ✅", "Priority Search Boosting", "SMS Customer Alerts", "Advanced Revenue Analytics"],
    isPopular: true,
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise Multi-Hub",
    priceMonthly: 2999,
    commissionRate: 0.02, // 2% platform share
    features: ["2% Lowest Platform Commission", "Multi-Branch Management", "Dedicated Account Manager", "Custom API Integrations", "Instant T+0 Bank Settlement"],
  },
};

/**
 * Calculates Shop Share vs Platform Share for an order based on shop's subscription tier
 */
export function calculateCommissionSplit(
  orderTotal: number,
  tier: SubscriptionTier = "free"
): CommissionSplitResult {
  const plan = SUBSCRIPTION_PLANS[tier] || SUBSCRIPTION_PLANS.free;
  const commissionRate = plan.commissionRate;

  const platformShare = Math.round(orderTotal * commissionRate * 100) / 100;
  const shopShare = Math.round((orderTotal - platformShare) * 100) / 100;

  return {
    orderTotal,
    tier,
    commissionRate,
    platformShare,
    shopShare,
    settlementStatus: "pending",
  };
}
