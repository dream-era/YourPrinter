/**
 * Types and Interfaces for Customer Referral System & Wallet Engine
 */

export interface WalletTransaction {
  id: string;
  type: "referral_credit" | "checkout_redemption" | "bonus";
  amount: number;
  description: string;
  refereeName?: string;
  status: "credited" | "redeemed" | "pending";
  createdAt: string;
}

export interface CustomerWalletSummary {
  userId: string;
  referralCode: string;
  currentBalance: number;
  totalEarned: number;
  totalReferredCount: number;
  monthlyReferralsCount: number;
  transactions: WalletTransaction[];
}

export interface ReferralValidationResult {
  isValid: boolean;
  code: string;
  discountAmount: number;
  referrerName?: string;
  error?: string;
}
