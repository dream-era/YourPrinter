import { SmartDiscoveryShop, DiscoveryFilterState } from "./types";

/**
 * Calculates Optimal Total Ready Time for a print shop:
 * Total Ready Time = Travel Time (Walking/Transit) + Live Queue Wait Time + Print Output Time
 */
export function calculateTotalReadyTime(
  shop: SmartDiscoveryShop,
  jobPageCount: number = 10,
  isDriving: boolean = false
): number {
  // 1. Travel Time calculation (Walking ~ 12 mins/km, Driving ~ 3 mins/km)
  const travelTimeMins = Math.ceil(shop.distanceKm * (isDriving ? 3 : 12));

  // 2. Queue Wait Time calculation (Jobs Waiting / Available Printers)
  const effectivePrinters = Math.max(1, shop.availablePrintersCount);
  const queueWaitMins = Math.ceil((shop.activeJobsCount * 6) / effectivePrinters);

  // 3. Print Output Time calculation (Pages / Speed PPM)
  const outputTimeMins = Math.ceil(jobPageCount / Math.max(1, shop.speedPpm));

  return travelTimeMins + queueWaitMins + outputTimeMins;
}

/**
 * Analyzes and ranks shops using the Intelligent Recommendation Algorithm
 */
export function rankShopsWithIntelligence(
  shops: SmartDiscoveryShop[],
  filters: DiscoveryFilterState,
  jobPageCount: number = 10
): SmartDiscoveryShop[] {
  // Compute metrics for each shop
  const processedShops = shops.map((shop) => {
    const totalReadyTimeMins = calculateTotalReadyTime(shop, jobPageCount);
    
    // Assign crowd heatmap badge dynamically
    let crowdLevel: "low" | "medium" | "busy" = "low";
    if (shop.estimatedWaitMins > 15) crowdLevel = "busy";
    else if (shop.estimatedWaitMins >= 5) crowdLevel = "medium";

    return {
      ...shop,
      totalReadyTimeMins,
      crowdLevel,
    };
  });

  // Find overall leaders for badges
  let fastestShopId = "";
  let nearestShopId = "";
  let cheapestShopId = "";
  let topRatedShopId = "";

  let minTime = Infinity;
  let minDistance = Infinity;
  let minPrice = Infinity;
  let maxRating = -1;

  processedShops.forEach((s) => {
    if (s.isOpen) {
      if ((s.totalReadyTimeMins || 0) < minTime) {
        minTime = s.totalReadyTimeMins || 0;
        fastestShopId = s.id;
      }
      if (s.distanceKm < minDistance) {
        minDistance = s.distanceKm;
        nearestShopId = s.id;
      }
      if (s.startingPriceBw < minPrice) {
        minPrice = s.startingPriceBw;
        cheapestShopId = s.id;
      }
      if (s.ratingAvg > maxRating) {
        maxRating = s.ratingAvg;
        topRatedShopId = s.id;
      }
    }
  });

  // Attach recommendation tags
  const taggedShops = processedShops.map((s) => {
    let tag: "fastest_overall" | "nearest" | "cheapest" | "top_rated" | undefined;
    if (s.id === fastestShopId) tag = "fastest_overall";
    else if (s.id === nearestShopId) tag = "nearest";
    else if (s.id === cheapestShopId) tag = "cheapest";
    else if (s.id === topRatedShopId) tag = "top_rated";

    return { ...s, recommendationTag: tag };
  });

  // Filter based on capabilities
  const filtered = taggedShops.filter((s) => {
    if (filters.openNowOnly && !s.isOpen) return false;
    if (filters.colorOnly && !s.capabilities.colorPrinting) return false;
    if (filters.spiralBindingOnly && !s.capabilities.spiralBinding) return false;
    if (filters.laminationOnly && !s.capabilities.lamination) return false;
    if (filters.photoPrintingOnly && !s.capabilities.photoPrinting) return false;

    if (filters.searchQuery) {
      const q = filters.searchQuery.toLowerCase();
      const matchesName = s.name.toLowerCase().includes(q);
      const matchesAddress = s.address.toLowerCase().includes(q);
      const matchesCity = s.city.toLowerCase().includes(q);
      if (!matchesName && !matchesAddress && !matchesCity) return false;
    }

    return true;
  });

  // Sort based on selected criteria
  return filtered.sort((a, b) => {
    switch (filters.sortBy) {
      case "recommended":
      case "fastest_ready":
        return (a.totalReadyTimeMins || 0) - (b.totalReadyTimeMins || 0);
      case "nearest":
        return a.distanceKm - b.distanceKm;
      case "lowest_price":
        return a.startingPriceBw - b.startingPriceBw;
      case "highest_rated":
        return b.ratingAvg - a.ratingAvg;
      default:
        return 0;
    }
  });
}
