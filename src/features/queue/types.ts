/**
 * Types and Interfaces for Live Queue Intelligence
 */

export type QueueCrowdLevel = "low" | "medium" | "busy";

export interface ShopQueueMetrics {
  shopId: string;
  totalActiveOrders: number;
  printingOrders: number;
  waitingOrders: number;
  avgCompletionTimePerDocMins: number;
  estimatedReadyTimeMins: number;
  historicalAvgWaitMins: number;
  crowdLevel: QueueCrowdLevel;
  lastUpdated: string;
}

export interface ActiveQueueJob {
  orderId: string;
  orderNumber: string;
  customerName: string;
  pages: number;
  copies: number;
  status: "pending" | "accepted" | "printing" | "ready";
  createdAt: string;
}
