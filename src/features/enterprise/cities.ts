/**
 * Multi-City Support & Regional Analytics Engine for YourPrinter
 */

export interface CityAnalytics {
  id: string;
  cityName: string;
  state: string;
  activeShopsCount: number;
  ordersToday: number;
  revenueToday: number;
  monthlyRevenue: number;
  topCollege: string;
  isExpanding: boolean;
}

export const CITIES_ANALYTICS_DATA: CityAnalytics[] = [
  {
    id: "mumbai",
    cityName: "Mumbai",
    state: "Maharashtra",
    activeShopsCount: 142,
    ordersToday: 850,
    revenueToday: 51200,
    monthlyRevenue: 1428500,
    topCollege: "IIT Bombay (Powai)",
    isExpanding: false,
  },
  {
    id: "delhi",
    cityName: "Delhi NCR",
    state: "Delhi",
    activeShopsCount: 28,
    ordersToday: 320,
    revenueToday: 19400,
    monthlyRevenue: 580000,
    topCollege: "DU South Campus",
    isExpanding: true,
  },
  {
    id: "bengaluru",
    cityName: "Bengaluru",
    state: "Karnataka",
    activeShopsCount: 14,
    ordersToday: 250,
    revenueToday: 13600,
    monthlyRevenue: 410000,
    topCollege: "IISc Bengaluru",
    isExpanding: true,
  },
  {
    id: "pune",
    cityName: "Pune",
    state: "Maharashtra",
    activeShopsCount: 12,
    ordersToday: 180,
    revenueToday: 9800,
    monthlyRevenue: 290000,
    topCollege: "COEP Pune",
    isExpanding: true,
  },
];
