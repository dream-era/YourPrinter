import { MapBoundingBox, MapShopPoint } from "./types";

/**
 * Builds PostGIS ST_MakeEnvelope spatial query string for database filtering:
 * ST_MakeEnvelope(west, south, east, north, 4326)
 */
export function buildPostGISBoundingBoxSQL(bounds: MapBoundingBox): string {
  return `ST_MakeEnvelope(${bounds.west}, ${bounds.south}, ${bounds.east}, ${bounds.north}, 4326)`;
}

/**
 * Filters shop points contained within geographic bounding box bounds
 */
export function filterShopsByBoundingBox(
  shops: MapShopPoint[],
  bounds: MapBoundingBox
): MapShopPoint[] {
  return shops.filter((s) => {
    const inLng = s.longitude >= bounds.west && s.longitude <= bounds.east;
    const inLat = s.latitude >= bounds.south && s.latitude <= bounds.north;
    return inLng && inLat;
  });
}
