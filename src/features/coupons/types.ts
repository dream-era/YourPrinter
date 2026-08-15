/**
 * Types and Interfaces for Coupon Management & Analytics Engine
 */

export type CouponType = "flat" | "percentage" | "referral" | "festival" | "shop_specific";
export type CouponStatus = "active" | "expired" | "exhausted" | "draft";

export interface CouponItem {
  id: string;
  code: string;
  type: CouponType;
  discountValue: number;     // Flat amount (₹) or percentage (%)
  maxDiscountCap?: number;   // Max discount ceiling for percentage coupons (e.g. ₹100)
  minOrderAmount: number;    // Minimum order value to apply coupon
  shopId?: string;           // Restricts coupon to a specific shop (shop_specific)
  totalUsageLimit: number;   // Max total redemptions allowed
  perUserLimit: number;      // Max redemptions per single user
  usedCount: number;         // Current redemption count
  expiresAt: string;         // ISO expiry datetime
  status: CouponStatus;
  description: string;
  createdAt: string;
}

export interface CouponValidationResult {
  isValid: boolean;
  discountAmount: number;
  finalTotal: number;
  coupon?: CouponItem;
  error?: string;
}

export interface CouponAnalyticsSummary {
  totalCoupons: number;
  activeCoupons: number;
  totalRedemptions: number;
  totalDiscountIssued: number;  // Total ₹ discounted across all redeemed coupons
}
