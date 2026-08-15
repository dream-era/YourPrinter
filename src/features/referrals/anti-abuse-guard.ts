/**
 * Anti-Abuse Fraud Prevention Engine for Customer Referrals
 */

export interface FraudCheckPayload {
  referrerUserId: string;
  refereeUserId: string;
  refereeEmail: string;
  refereePhone: string;
  clientIp: string;
  monthlyReferralCount: number;
}

export interface FraudCheckResult {
  isAllowed: boolean;
  reason?: string;
}

/**
 * Validates referral claims to prevent self-referral and bot farming abuse
 */
export function validateReferralClaim(payload: FraudCheckPayload): FraudCheckResult {
  // 1. Self-Referral Prevention
  if (payload.referrerUserId === payload.refereeUserId) {
    return {
      isAllowed: false,
      reason: "Self-referrals are not eligible for referral credits.",
    };
  }

  // 2. Monthly Referral Cap Check (Max 10 per month)
  if (payload.monthlyReferralCount >= 10) {
    return {
      isAllowed: false,
      reason: "Monthly referral reward limit (10 friends / ₹500) reached for this account.",
    };
  }

  return { isAllowed: true };
}
