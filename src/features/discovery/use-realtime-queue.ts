"use client";

import * as React from "react";
import { SmartDiscoveryShop } from "./types";

/**
 * Custom React Hook for live Supabase Realtime queue intelligence updates
 */
export function useRealtimeQueue(initialShops: SmartDiscoveryShop[]) {
  const [shops, setShops] = React.useState<SmartDiscoveryShop[]>(initialShops);
  const [isLiveConnected, setIsLiveConnected] = React.useState(true);

  React.useEffect(() => {
    // Simulate periodic real-time background queue updates (Supabase Realtime channel stream)
    const interval = setInterval(() => {
      setShops((prevShops) =>
        prevShops.map((shop) => {
          // Random slight variance simulating real-time job processing & incoming print jobs
          const delta = Math.floor(Math.random() * 3) - 1; // -1, 0, or +1
          const newJobs = Math.max(0, shop.activeJobsCount + delta);
          const newWait = Math.max(1, Math.ceil(newJobs * 3.5));

          let crowdLevel: "low" | "medium" | "busy" = "low";
          if (newWait > 15) crowdLevel = "busy";
          else if (newWait >= 5) crowdLevel = "medium";

          return {
            ...shop,
            activeJobsCount: newJobs,
            estimatedWaitMins: newWait,
            crowdLevel,
          };
        })
      );
    }, 12000); // Live sync tick every 12s

    return () => clearInterval(interval);
  }, []);

  return { shops, isLiveConnected };
}
