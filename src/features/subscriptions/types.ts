/**
 * Types and Interfaces for Complete Shop Subscriptions & Billing Engine
 */

export type ShopSubscriptionTierId = "free" | "professional" | "enterprise";

export interface ShopSubscriptionState {
  shopId: string;
  tierId: ShopSubscriptionTierId;
  tierName: string;
  priceMonthly: number;
  commissionRate: number; // e.g. 0.10, 0.05, 0.02
  status: "active" | "past_due" | "canceled" | "expired";
  currentPeriodStart: string;
  currentPeriodEnd: string;
  autoRenew: boolean;
}

export interface BillingInvoiceRecord {
  id: string;
  invoiceNumber: string;
  tierName: string;
  amountPaid: number;
  taxAmount: number; // 18% GST
  paymentMethod: string;
  status: "paid" | "pending" | "failed";
  createdAt: string;
  pdfInvoiceUrl: string;
}
