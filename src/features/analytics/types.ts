/**
 * Types and Interfaces for Shop Analytics Dashboard
 */

export interface ShopRevenuePoint {
  label: string;   // e.g. "Mon", "Week 1", "Jan"
  revenue: number;
  orders: number;
  [key: string]: number | string;  // index signature for MiniBarChart generic access
}

export interface PeakHourBucket {
  hour: string;   // e.g. "9 AM", "2 PM"
  orders: number;
}

export interface ShopAnalyticsSummary {
  totalRevenueMTD: number;
  totalOrdersMTD: number;
  uniqueCustomersMTD: number;
  repeatCustomerRate: number;      // Percentage
  averageOrderValue: number;
  averageRating: number;
  revenueGrowthPercent: number;    // vs previous month
  ordersGrowthPercent: number;
  revenueChart: ShopRevenuePoint[];
  peakHours: PeakHourBucket[];
}
