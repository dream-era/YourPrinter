/**
 * Enterprise Feature Flags Engine for YourPrinter
 */

export interface FeatureFlagsMap {
  auto_print_enabled: boolean;
  ai_preflight_checks_enabled: boolean;
  campus_ambassador_enabled: boolean;
  referral_credits_enabled: boolean;
  multi_city_routing_enabled: boolean;
  razorpay_instant_settlement: boolean;
}

export const DEFAULT_FEATURE_FLAGS: FeatureFlagsMap = {
  auto_print_enabled: true,
  ai_preflight_checks_enabled: true,
  campus_ambassador_enabled: true,
  referral_credits_enabled: true,
  multi_city_routing_enabled: true,
  razorpay_instant_settlement: true,
};

let currentFlags: FeatureFlagsMap = { ...DEFAULT_FEATURE_FLAGS };

export function getFeatureFlags(): FeatureFlagsMap {
  return currentFlags;
}

export function updateFeatureFlag(flag: keyof FeatureFlagsMap, enabled: boolean): FeatureFlagsMap {
  currentFlags[flag] = enabled;
  console.log(`[Feature Flag Update] ${flag} -> ${enabled}`);
  return { ...currentFlags };
}
