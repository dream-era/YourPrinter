import { ShopQueueMetrics, QueueCrowdLevel, ActiveQueueJob } from "./types";

/**
 * Calculates live queue telemetry and ETA from actual order jobs:
 * Total Active Orders = Printing Orders + Waiting Orders
 * ETA = Total Waiting Pages * Throughput Speed + Warmup Penalty
 */
export function calculateQueueMetrics(
  shopId: string,
  jobs: ActiveQueueJob[],
  historicalAvgWaitMins: number = 12
): ShopQueueMetrics {
  const printingJobs = jobs.filter((j) => j.status === "printing");
  const waitingJobs = jobs.filter((j) => j.status === "pending" || j.status === "accepted");

  const totalActiveOrders = jobs.length;
  const printingOrders = printingJobs.length;
  const waitingOrders = waitingJobs.length;

  // Calculate total pages in queue
  const totalPagesInQueue = waitingJobs.reduce((sum, j) => sum + j.pages * j.copies, 0);

  // Average digital press speed: ~2.5 seconds per page
  const secondsPerPage = 2.5;
  const estimatedReadyTimeMins = Math.max(
    3,
    Math.ceil((totalPagesInQueue * secondsPerPage) / 60) + printingOrders * 2
  );

  // Determine visual crowd level
  let crowdLevel: QueueCrowdLevel = "low";
  if (totalActiveOrders >= 8 || estimatedReadyTimeMins > 25) {
    crowdLevel = "busy";
  } else if (totalActiveOrders >= 3 || estimatedReadyTimeMins >= 10) {
    crowdLevel = "medium";
  }

  return {
    shopId,
    totalActiveOrders,
    printingOrders,
    waitingOrders,
    avgCompletionTimePerDocMins: 1.5,
    estimatedReadyTimeMins,
    historicalAvgWaitMins,
    crowdLevel,
    lastUpdated: new Date().toLocaleTimeString(),
  };
}
