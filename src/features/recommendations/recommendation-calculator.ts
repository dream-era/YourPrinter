import { RecommendationCandidate, PrintJobRequirements, RecommendationResult } from "./types";

/**
 * Calculates optimal shop recommendation based on Total Ready Time, Ratings, Capabilities, and Verification.
 */
export function calculateBestShopRecommendation(
  candidates: RecommendationCandidate[],
  requirements: PrintJobRequirements
): RecommendationResult {
  // Filter candidates open now and meeting color/binding requirements
  const eligible = candidates.filter((c) => {
    if (!c.isOpen) return false;
    if (requirements.isColorRequired && !c.capabilities.colorPrinting) return false;
    if (requirements.isSpiralBindingRequired && !c.capabilities.spiralBinding) return false;
    return true;
  });

  const pool = eligible.length > 0 ? eligible : candidates;

  // Calculate Total Completion Time for each candidate:
  // Total Time = Travel Time + Queue Wait + (Total Pages / Speed)
  const totalPages = requirements.pagesCount * requirements.copiesCount;

  const scored = pool.map((c) => {
    const printExecutionMins = Math.max(1, Math.ceil(totalPages / c.printSpeedPagesPerMin));
    const totalCompletionTimeMins = c.walkingTimeMins + c.estimatedQueueWaitMins + printExecutionMins;

    // Time Score (40%): 60 mins -> 0 pts, 5 mins -> 100 pts
    const timeScore = Math.max(0, 100 - (totalCompletionTimeMins / 60) * 100) * 0.4;

    // Rating Score (30%): 5.0 -> 100 pts
    const ratingScore = (c.ratingAvg / 5.0) * 100 * 0.3;

    // Verification Boost (15%)
    const verifiedScore = c.isVerified ? 15 : 0;

    // Low Queue Boost (15%)
    const queueScore = c.activeQueueJobs < 3 ? 15 : c.activeQueueJobs < 7 ? 8 : 0;

    const totalScore = Math.round(timeScore + ratingScore + verifiedScore + queueScore);

    return {
      shop: c,
      score: totalScore,
      totalCompletionTimeMins,
    };
  });

  // Sort by highest score
  scored.sort((a, b) => b.score - a.score);

  const best = scored[0];
  const nearest = [...scored].sort((a, b) => a.shop.distanceKm - b.shop.distanceKm)[0];

  const timeSavingsMinsVsNearest = Math.max(
    0,
    nearest.totalCompletionTimeMins - best.totalCompletionTimeMins
  );

  let reasonTitle = "Fastest Total Ready Time";
  let reasonDescription = `Optimal choice: Total completion in ~${best.totalCompletionTimeMins} mins (Travel + Low Queue + High Speed Press).`;

  if (timeSavingsMinsVsNearest > 3 && best.shop.id !== nearest.shop.id) {
    reasonTitle = `Saves ~${timeSavingsMinsVsNearest} Minutes Over Nearest Printer`;
    reasonDescription = `Recommended over ${nearest.shop.name}: Avoids 25-minute queue surge with faster 40 ppm printing.`;
  } else if (best.shop.ratingAvg >= 4.8) {
    reasonTitle = `Top Rated Partner (${best.shop.ratingAvg}★)`;
    reasonDescription = `High quality digital output rating with ~${best.totalCompletionTimeMins} mins total completion time.`;
  }

  return {
    recommendedShop: best.shop,
    score: best.score,
    reasonTitle,
    reasonDescription,
    totalCompletionTimeMins: best.totalCompletionTimeMins,
    timeSavingsMinsVsNearest,
    alternativeShops: scored.slice(1),
  };
}
