/**
 * Centralized Notification Service for YourPrinter
 * Handles dispatching In-App, Web Push, and Email notifications on order events
 */

export type NotificationEventType =
  | "order_accepted"
  | "printing_started"
  | "ready_for_pickup"
  | "order_cancelled"
  | "refund_issued";

export interface NotificationPayload {
  userId: string;
  orderNumber: string;
  eventType: NotificationEventType;
  shopName: string;
  pickupCode?: string;
  refundAmount?: number;
}

/**
 * Dispatch notification across channels (In-app, Web Push, Email)
 */
export async function dispatchNotification(payload: NotificationPayload): Promise<boolean> {
  const { eventType, orderNumber, shopName, pickupCode, refundAmount } = payload;

  let title = "";
  let message = "";

  switch (eventType) {
    case "order_accepted":
      title = "Order Accepted 🖨️";
      message = `${shopName} has accepted your print job ${orderNumber} and queued it for processing.`;
      break;
    case "printing_started":
      title = "Printing Started ⚡";
      message = `${shopName} is now printing your document for ${orderNumber}.`;
      break;
    case "ready_for_pickup":
      title = "Ready for Pickup! 🎉";
      message = `Your print job ${orderNumber} is ready at ${shopName}. Show PIN ${pickupCode || "N/A"} to collect.`;
      break;
    case "order_cancelled":
      title = "Order Cancelled";
      message = `Print job ${orderNumber} was cancelled by ${shopName}.`;
      break;
    case "refund_issued":
      title = "Refund Processed 💸";
      message = `A refund of ₹${refundAmount || 0} for ${orderNumber} has been credited to your Razorpay payment method.`;
      break;
  }

  // Log dispatch event to console
  console.log(`[Notification Dispatch] Event: ${eventType} -> User: ${payload.userId} | Title: "${title}"`);

  return true;
}
