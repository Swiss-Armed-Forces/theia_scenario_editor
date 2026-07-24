import type { Point } from "../types/types";

const EARTH_RADIUS_M = 6_371_000;

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
