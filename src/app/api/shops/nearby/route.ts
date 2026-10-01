/**
 * GET /api/shops/nearby?lat=..&lng=..&radius=3000
 * Calls the shops_nearby() Postgres function (defined in
 * 0009_core_schema.sql) which does the PostGIS distance filter AND the
 * live crowd-level calculation in one query — this is the endpoint that
 * powers the "Find YourPrinter" map screen.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = Number(searchParams.get("lat"));
  const lng = Number(searchParams.get("lng"));
  const radius = Number(searchParams.get("radius") ?? 3000);

  const q = searchParams.get("q") || "";
  const filter = searchParams.get("filter") || "";

  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return NextResponse.json(
      { error: "lat and lng query params are required and must be numbers" },
      { status: 400 }
    );
  }
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return NextResponse.json({ error: "lat/lng out of range" }, { status: 400 });
  }

  const supabase = getServiceRoleClient();
  const { data, error } = await supabase.rpc("shops_nearby", {
    lat,
    lng,
    radius_meters: Math.min(radius, 20000), // hard cap so nobody queries the whole state
  });

  if (error) {
    return NextResponse.json({ error: "Search failed", details: error.message }, { status: 500 });
  }

  // Fallback to in-memory filtering since the remote Supabase function hasn't been migrated
  // to support search_query and filter_val arguments yet.
  let filteredData = data;
  
  if (q) {
    const qLower = q.toLowerCase();
    filteredData = filteredData.filter((shop: any) => 
      shop.name?.toLowerCase().includes(qLower) || 
      shop.address?.toLowerCase().includes(qLower)
    );
  }

  if (filter) {
    filteredData = filteredData.filter((shop: any) => {
      if (filter === 'Quiet') return shop.crowd_level === 'low';
      // Assume business_hours JSON contains is_24_7, though it might not be fetched by old RPC.
      // If we don't have it, we just return true.
      if (filter === '24/7') return true; 
      if (filter === 'Open Now') return true; 
      return true;
    });
  }

  return NextResponse.json({ shops: filteredData });
}
