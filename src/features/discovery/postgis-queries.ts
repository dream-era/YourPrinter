import { LandmarkLocation } from "./types";

/**
 * Pre-indexed Colleges, Higher Ed Campuses & Major Tech Parks in Mumbai/India
 */
export const PRESET_LANDMARKS: LandmarkLocation[] = [
  { name: "IIT Bombay (Powai Campus)", category: "college", latitude: 19.1334, longitude: 72.9133 },
  { name: "VJTI Mumbai (Matunga)", category: "college", latitude: 19.0222, longitude: 72.8561 },
  { name: "St. Xavier's College (Fort)", category: "college", latitude: 18.9438, longitude: 72.8315 },
  { name: "NMIMS / Mithibai College (Vile Parle)", category: "college", latitude: 19.1032, longitude: 72.8373 },
  { name: "Bandra Kurla Complex (BKC)", category: "area", latitude: 19.0657, longitude: 72.8686 },
  { name: "Phoenix Lower Parel Hub", category: "area", latitude: 18.9953, longitude: 72.8258 },
  { name: "Mindspace IT Park (Malad)", category: "area", latitude: 19.1764, longitude: 72.8344 },
];

/**
 * Haversine formula for calculating spherical distance between two coordinates in kilometers
 * (Mirrors PostGIS ST_DistanceSphere algorithm)
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}
