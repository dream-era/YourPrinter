/**
 * GET /api/shops/nearby?lat=..&lng=..&radius=3000
 * Calls the shops_nearby() Postgres function (defined in
 * 0009_core_schema.sql) which does the PostGIS distance filter AND the
 * live crowd-level calculation in one query — this is the endpoint that
 * powers the "Find YourPrinter" map screen.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = Number(searchParams.get("lat"));
  const lng = Number(searchParams.get("lng"));
  const radius = Number(searchParams.get("radius") ?? 3000);

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

  return NextResponse.json({ shops: data });
}
