/**
 * Types and Interfaces for Marketplace Engine, Subscriptions, Commissions & Referrals
 */

export type SubscriptionTier = "free" | "premium" | "enterprise";

export interface ShopSubscriptionPlan {
  id: SubscriptionTier;
  name: string;
  priceMonthly: number;
  commissionRate: number; // e.g. 0.10 for 10%
  features: string[];
  isPopular?: boolean;
}

export interface CommissionSplitResult {
  orderTotal: number;
  tier: SubscriptionTier;
  commissionRate: number;
  platformShare: number;
  shopShare: number;
  settlementStatus: "pending" | "settled";
}

export interface CouponItem {
  code: string;
  type: "percentage" | "flat" | "referral" | "festival" | "shop_specific";
  discountValue: number; // 20% or ₹50
  minOrderValue?: number;
  shopId?: string;
  expiresAt: string;
}

export interface CampusAmbassadorStats {
  id: string;
  studentName: string;
  collegeName: string;
  referralCode: string;
  totalReferrals: number;
  totalCreditsEarned: number;
  rank: number;
}
