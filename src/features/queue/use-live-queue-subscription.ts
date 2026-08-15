"use client";

import * as React from "react";
import { ShopQueueMetrics, ActiveQueueJob } from "./types";
import { calculateQueueMetrics } from "./queue-calculator";
import { createClient } from "@/lib/supabase/client";

/**
 * Custom React hook subscribing to live queue updates via Supabase Realtime channel stream
 */
export function useLiveQueueSubscription(shopId: string) {
  const [jobs, setJobs] = React.useState<ActiveQueueJob[]>([]);
  const [isLiveConnected, setIsLiveConnected] = React.useState(false);
  const supabase = createClient();

  // Compute metrics dynamically
  const metrics: ShopQueueMetrics = React.useMemo(() => {
    return calculateQueueMetrics(shopId, jobs);
  }, [shopId, jobs]);

  React.useEffect(() => {
    let mounted = true;

    async function fetchJobs() {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          print_options,
          status,
          created_at,
          profiles!student_id (
            full_name
          )
        `)
        .eq('shop_id', shopId)
        .in('status', ['pending', 'accepted', 'processing']); // Only active jobs

      if (!error && data && mounted) {
        setJobs(data.map((o: any) => ({
          orderId: o.id,
          orderNumber: o.order_number,
          customerName: o.profiles?.full_name || 'Guest',
          pages: 1, // We don't fetch page count here easily unless we join documents, which is fine for queue preview
          copies: o.print_options?.copies || 1,
          status: o.status,
          createdAt: new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).format(new Date(o.created_at))
        })));
        setIsLiveConnected(true);
      }
    }

    fetchJobs();

    // Subscribe to realtime order updates for this shop
    const channel = supabase
      .channel(`queue-${shopId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `shop_id=eq.${shopId}`,
        },
        () => {
          // Simplest reliable way to handle queue changes is to re-fetch
          // since we need the joins (e.g. customer name)
          fetchJobs();
        }
      )
      .subscribe((status) => {
        if (mounted) {
          setIsLiveConnected(status === 'SUBSCRIBED');
        }
      });

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [shopId, supabase]);

  return {
    metrics,
    activeJobs: jobs,
    isLiveConnected,
  };
}
