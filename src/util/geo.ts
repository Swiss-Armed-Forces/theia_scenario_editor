import type { Point } from "../types/types";

export const EARTH_RADIUS_M = 6_371_000;

/**
 * Great-circle distance between two points, ignoring altitude. Used for fast
 * client-side candidate highlighting; the backend's `lineOfSightDistance` is
 * terrain-aware and used instead wherever precision actually matters.
 */
export function haversineDistance(p1: Point, p2: Point): number {
  const lat1 = (p1.lat * Math.PI) / 180;
  const lat2 = (p2.lat * Math.PI) / 180;
  const dLat = ((p2.lat - p1.lat) * Math.PI) / 180;
  const dLon = ((p2.lon - p1.lon) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_M * c;
}

/**
 * Offsets a (lat, lon) by a local-tangent-plane displacement in meters.
 * Accurate enough for placing/nudging points a few kilometers apart.
 */
export function offsetLatLon(
  lat: number,
  lon: number,
  dNorthMeters: number,
  dEastMeters: number,
): { lat: number; lon: number } {
  const latRad = (lat * Math.PI) / 180;
  const dLat = (dNorthMeters / EARTH_RADIUS_M) * (180 / Math.PI);
  const dLon =
    (dEastMeters / (EARTH_RADIUS_M * Math.cos(latRad))) * (180 / Math.PI);
  return { lat: lat + dLat, lon: lon + dLon };
}
