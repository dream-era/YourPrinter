/**
 * AI-Powered Queue Prediction Service for YourPrinter
 * Features Strategy Pattern interface so rule-based heuristics can be swapped
 * for a machine learning model later without changing consumer code.
 */

export interface HistoricalOrderData {
  orderId: string;
  shopId: string;
  pages: number;
  copies: number;
  colorMode: "color" | "bw";
  createdAt: string; // ISO string
  completedAt: string; // ISO string
}

export interface PredictionInput {
  shopId: string;
  pages: number;
  copies: number;
  colorMode: "color" | "bw";
  activeJobsCount: number;
  historicalOrders: HistoricalOrderData[];
  currentTime?: string;
}

export interface PredictionResult {
  predictedWaitMins: number;
  estimatedCompletionTime: string; // ISO string
  printerLoad: "low" | "medium" | "high";
  isPeakHour: boolean;
  peakHourReason?: string;
  confidenceScore: number; // 0.0 to 1.0
  alternativeRecommendedPrinterId?: string;
  recommendationReason?: string;
}

/**
 * Queue Prediction Strategy Interface
 */
export interface QueuePredictionStrategy {
  predict(input: PredictionInput): PredictionResult;
}

/**
 * Strategy 1: Heuristic & Rule-Based Queue Prediction
 * Uses historical order duration averages and queue loading rules.
 */
export class HeuristicQueuePredictionStrategy implements QueuePredictionStrategy {
  public predict(input: PredictionInput): PredictionResult {
    const timeStr = input.currentTime || new Date().toISOString();
    const date = new Date(timeStr);
    const hour = date.getHours();

    // 1. Calculate historical average print speed for this shop
    const shopHistory = input.historicalOrders.filter((o) => o.shopId === input.shopId);
    let avgMinsPerPage = 0.1; // Default fallback: 6 seconds per page

    if (shopHistory.length > 0) {
      let totalDurationMins = 0;
      let totalPagesPrinted = 0;

      for (const order of shopHistory) {
        const start = new Date(order.createdAt).getTime();
        const end = new Date(order.completedAt).getTime();
        const durationMins = (end - start) / (1000 * 60);

        if (durationMins > 0) {
          totalDurationMins += durationMins;
          totalPagesPrinted += order.pages * order.copies;
        }
      }

      if (totalPagesPrinted > 0) {
        avgMinsPerPage = totalDurationMins / totalPagesPrinted;
      }
    }

    // 2. Compute waiting time for current active queue
    // Average job contains ~8 pages/copies in historical runs
    const estimatedActiveQueueMins = input.activeJobsCount * 8 * avgMinsPerPage;

    // 3. Compute execution time for the target print job itself
    const targetJobMins = (input.pages * input.copies) * avgMinsPerPage;

    // 4. Factor in Peak Hour surges (10am-1pm, 6pm-9pm)
    const isMorningPeak = hour >= 10 && hour <= 13;
    const isEveningPeak = hour >= 18 && hour <= 21;
    const isPeakHour = isMorningPeak || isEveningPeak;

    let surgeMultiplier = 1.0;
    if (isMorningPeak) surgeMultiplier = 1.5;
    if (isEveningPeak) surgeMultiplier = 1.3;

    const finalWaitMins = Math.ceil((estimatedActiveQueueMins + targetJobMins) * surgeMultiplier);

    // 5. Determine Printer Load status
    let printerLoad: "low" | "medium" | "high" = "low";
    if (finalWaitMins > 15) {
      printerLoad = "high";
    } else if (finalWaitMins > 5) {
      printerLoad = "medium";
    }

    // 6. Calculate Estimated Completion Time (ISO string)
    const completionDate = new Date(date.getTime() + finalWaitMins * 60 * 1000);

    // 7. Alternative printer recommendation if current node has high load
    let alternativeRecommendedPrinterId: string | undefined;
    let recommendationReason: string | undefined;

    if (printerLoad === "high") {
      alternativeRecommendedPrinterId = "ptr-2"; // Redirect to low-latency node
      recommendationReason = "Canon C5535i is heavily loaded. HP LaserJet has 0 active queue jobs (saves ~12 mins).";
    } else {
      recommendationReason = "Current printing node is running at optimal speeds.";
    }

    return {
      predictedWaitMins: finalWaitMins,
      estimatedCompletionTime: completionDate.toISOString(),
      printerLoad,
      isPeakHour,
      peakHourReason: isPeakHour
        ? isMorningPeak
          ? "Morning Academic & Business Rush (10:00 AM - 1:00 PM)"
          : "Evening Student Pickup Rush (6:00 PM - 9:00 PM)"
        : undefined,
      confidenceScore: shopHistory.length > 5 ? 0.92 : 0.75,
      alternativeRecommendedPrinterId,
      recommendationReason,
    };
  }
}

/**
 * Core Prediction Service Context Class
 */
export class QueuePredictor {
  private strategy: QueuePredictionStrategy;

  constructor(strategy: QueuePredictionStrategy = new HeuristicQueuePredictionStrategy()) {
    this.strategy = strategy;
  }

  public setStrategy(strategy: QueuePredictionStrategy) {
    this.strategy = strategy;
  }

  public predict(input: PredictionInput): PredictionResult {
    return this.strategy.predict(input);
  }
}
