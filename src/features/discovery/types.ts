/**
 * Types and Interfaces for Smart Discovery System & Live Queue Intelligence
 */

export type QueueCrowdLevel = "low" | "medium" | "busy";

export interface ShopCapability {
  colorPrinting: boolean;
  bwPrinting: boolean;
  spiralBinding: boolean;
  lamination: boolean;
  photoPrinting: boolean;
  a3Printing: boolean;
}

export interface SmartDiscoveryShop {
  id: string;
  name: string;
  slug: string;
  ownerName: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  phone: string;
  isOpen: boolean;
  ratingAvg: number;
  ratingCount: number;
  startingPriceBw: number;
  startingPriceColor: number;
  distanceKm: number;
  walkingTimeMins: number;
  // Queue Intelligence
  activeJobsCount: number;
  estimatedWaitMins: number;
  crowdLevel: QueueCrowdLevel;
  speedPpm: number; // Pages per minute output speed
  availablePrintersCount: number;
  capabilities: ShopCapability;
  // Recommendation Engine Calculated Field
  totalReadyTimeMins?: number;
  recommendationTag?: "fastest_overall" | "nearest" | "cheapest" | "top_rated";
}

export interface DiscoveryFilterState {
  searchQuery: string;
  selectedLandmark?: string;
  openNowOnly: boolean;
  colorOnly: boolean;
  spiralBindingOnly: boolean;
  laminationOnly: boolean;
  photoPrintingOnly: boolean;
  sortBy: "recommended" | "fastest_ready" | "nearest" | "lowest_price" | "highest_rated";
}

export interface LandmarkLocation {
  name: string;
  category: "college" | "area" | "transit";
  latitude: number;
  longitude: number;
}
