import { ShopSubscriptionTierId } from "./types";

export interface FeatureGateResult {
  isAllowed: boolean;
  requiredTier: ShopSubscriptionTierId;
  reason?: string;
}

/**
 * Validates whether an active shop subscription tier unlocks a specific feature
 */
export function checkFeatureAccess(
  currentTier: ShopSubscriptionTierId,
  featureKey: "auto_print" | "multi_branch" | "instant_payout" | "verified_badge" | "sms_alerts"
): FeatureGateResult {
  switch (featureKey) {
    case "verified_badge":
    case "sms_alerts":
      if (currentTier === "professional" || currentTier === "enterprise") {
        return { isAllowed: true, requiredTier: "professional" };
      }
      return {
        isAllowed: false,
        requiredTier: "professional",
        reason: "Verified Shop Badge and SMS alerts require a Professional (₹999/mo) or Enterprise plan.",
      };

    case "auto_print":
      if (currentTier === "professional" || currentTier === "enterprise") {
        return { isAllowed: true, requiredTier: "professional" };
      }
      return {
        isAllowed: false,
        requiredTier: "professional",
        reason: "AutoPrint zero-driver hardware spooling requires Professional (₹999/mo) or Enterprise tier.",
      };

    case "multi_branch":
    case "instant_payout":
      if (currentTier === "enterprise") {
        return { isAllowed: true, requiredTier: "enterprise" };
      }
      return {
        isAllowed: false,
        requiredTier: "enterprise",
        reason: "Multi-branch control and T+0 Instant Payouts are exclusive to Enterprise (₹2,999/mo) plan.",
      };

    default:
      return { isAllowed: true, requiredTier: "free" };
  }
}
