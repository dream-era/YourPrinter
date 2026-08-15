/**
 * Types and Interfaces for Intelligent Recommendation Engine
 */

export interface PrintJobRequirements {
  pagesCount: number;
  copiesCount: number;
  isColorRequired: boolean;
  isDuplexRequired: boolean;
  isSpiralBindingRequired: boolean;
}

export interface RecommendationCandidate {
  id: string;
  name: string;
  slug: string;
  address: string;
  latitude: number;
  longitude: number;
  isOpen: boolean;
  ratingAvg: number;
  ratingCount: number;
  distanceKm: number;
  walkingTimeMins: number;
  activeQueueJobs: number;
  estimatedQueueWaitMins: number;
  printSpeedPagesPerMin: number;
  startingPriceBw: number;
  startingPriceColor: number;
  isVerified: boolean;
  capabilities: {
    colorPrinting: boolean;
    bwPrinting: boolean;
    spiralBinding: boolean;
    lamination: boolean;
    photoPrinting: boolean;
  };
}

export interface RecommendationResult {
  recommendedShop: RecommendationCandidate;
  score: number; // 0 - 100
  reasonTitle: string;
  reasonDescription: string;
  totalCompletionTimeMins: number;
  timeSavingsMinsVsNearest: number;
  alternativeShops: Array<{
    shop: RecommendationCandidate;
    score: number;
    totalCompletionTimeMins: number;
  }>;
}
