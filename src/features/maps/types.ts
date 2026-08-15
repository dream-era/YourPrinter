/**
 * Types and Interfaces for Interactive Map System & Marker Clustering
 */

export interface MapBoundingBox {
  west: number;
  south: number;
  east: number;
  north: number;
}

export interface MapViewportState {
  latitude: number;
  longitude: number;
  zoom: number;
  bearing?: number;
  pitch?: number;
}

export interface MapShopPoint {
  id: string;
  name: string;
  slug: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  isOpen: boolean;
  ratingAvg: number;
  ratingCount: number;
  startingPriceBw: number;
  startingPriceColor: number;
  distanceKm: number;
  walkingTimeMins: number;
  activeJobsCount: number;
  estimatedWaitMins: number;
  crowdLevel: "low" | "medium" | "busy";
  isVerified: boolean;
  capabilities: {
    colorPrinting: boolean;
    bwPrinting: boolean;
    spiralBinding: boolean;
    lamination: boolean;
    photoPrinting: boolean;
  };
}
