"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type QueueStatus = "Quiet" | "Moderate" | "Busy" | "24/7";

export interface MapShop {
  id: string;
  name: string;
  image: string;
  latitude: number;
  longitude: number;
  rating: number;
  distanceKm: number;
  estimatedWaitMins: number;
  queueStatus: QueueStatus;
  openUntil: string;
}

// Mock data removed in production

export function useMapShops(lat?: number, lng?: number, q?: string, filter?: string) {
  const [shops, setShops] = useState<MapShop[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const supabase = createClient();

    const fetchShops = async () => {
      if (lat === undefined || lng === undefined) {
        if (mounted) {
          setShops([]);
          setLoading(false);
        }
        return;
      }
      setLoading(true);
      
      try {
        const url = new URL("/api/shops/nearby", window.location.origin);
        url.searchParams.set("lat", String(lat));
        url.searchParams.set("lng", String(lng));
        url.searchParams.set("radius", "10000");
        if (q) url.searchParams.set("q", q);
        if (filter && filter !== "All") url.searchParams.set("filter", filter);

        const res = await fetch(url.toString());
        if (!res.ok) throw new Error("Failed to fetch shops");
        const { shops: nearbyShops } = await res.json();
        
        if (!nearbyShops || nearbyShops.length === 0) {
          if (mounted) setShops([]);
        } else {
          const formatted = nearbyShops.map((d: any) => ({
            id: d.id,
            name: d.name,
            image: d.logo_url || "",
            latitude: d.latitude,
            longitude: d.longitude,
            rating: d.rating || 4.5,
            distanceKm: parseFloat((d.distance_meters / 1000).toFixed(1)) || 1.0,
            estimatedWaitMins: d.crowd_level === "high" ? 25 : d.crowd_level === "medium" ? 12 : 5,
            queueStatus: (d.crowd_level === "high" ? "Busy" : d.crowd_level === "medium" ? "Moderate" : "Quiet") as QueueStatus,
            openUntil: "10 PM"
          }));
          if (mounted) setShops(formatted);
        }
      } catch (e) {
        console.error(e);
        if (mounted) setShops([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchShops();

    // Subscribe to realtime queue_status updates
    const channel = supabase
      .channel("public:shops")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "shops" }, (payload) => {
        setShops((prev) => 
          prev.map((s) => {
            if (s.id === payload.new.id) {
              return {
                ...s,
                queueStatus: payload.new.crowd_level === "high" ? "Busy" : payload.new.crowd_level === "medium" ? "Moderate" : "Quiet",
                estimatedWaitMins: payload.new.crowd_level === "high" ? 25 : payload.new.crowd_level === "medium" ? 12 : 5,
              };
            }
            return s;
          })
        );
      })
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [lat, lng, q, filter]);

  return { shops, loading };
}
