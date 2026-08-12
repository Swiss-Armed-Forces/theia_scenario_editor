import type { Waypoint } from "../types/types";
import { offsetLatLon } from "./geo";

// Perpendicular distance (equirectangular approximation, fine at the scale
// of a single trajectory) from `point` to the line through `a` and `b`.
function perpendicularDistance(a: Waypoint, b: Waypoint, point: Waypoint): number {
  const latRef = (a.lat * Math.PI) / 180;
  const scale = Math.cos(latRef);
  const ax = a.lon * scale;
  const ay = a.lat;
  const bx = b.lon * scale;
  const by = b.lat;
  const px = point.lon * scale;
  const py = point.lat;

  const dx = bx - ax;
  const dy = by - ay;
  const lengthSq = dx * dx + dy * dy;
  if (lengthSq === 0) {
    return Math.hypot(px - ax, py - ay);
  }
  // |cross product| / |base|, i.e. distance from point to the infinite line.
  const cross = dx * (py - ay) - dy * (px - ax);
  return Math.abs(cross) / Math.sqrt(lengthSq);
}

function segmentLengthSq(a: Waypoint, b: Waypoint): number {
  const latRef = (a.lat * Math.PI) / 180;
  const scale = Math.cos(latRef);
  const dx = (b.lon - a.lon) * scale;
  const dy = b.lat - a.lat;
  return dx * dx + dy * dy;
}

// Grows by repeatedly splitting the longest segment at its midpoint, and
// shrinks by repeatedly dropping the interior point that deviates least from
// the line through its neighbors - in both cases, existing waypoints are
// never moved. `newCount` is expected to be >= 2 (callers enforce this via a
// min={2} input).
export function resizeWaypoints(
  waypoints: Waypoint[],
  newCount: number,
): Waypoint[] {
  let result = [...waypoints];

  while (result.length < newCount) {
    let longestIndex = 0;
    let longestLengthSq = -Infinity;
    for (let i = 0; i < result.length - 1; i++) {
      const lengthSq = segmentLengthSq(result[i], result[i + 1]);
      if (lengthSq > longestLengthSq) {
        longestLengthSq = lengthSq;
        longestIndex = i;
      }
    }
    const a = result[longestIndex];
    const b = result[longestIndex + 1];
    const midpoint: Waypoint = { lat: (a.lat + b.lat) / 2, lon: (a.lon + b.lon) / 2 };
    result = [
      ...result.slice(0, longestIndex + 1),
      midpoint,
      ...result.slice(longestIndex + 1),
    ];
  }

  while (result.length > newCount && result.length > 2) {
    let leastIndex = 1;
    let leastDeviation = Infinity;
    for (let i = 1; i < result.length - 1; i++) {
      const deviation = perpendicularDistance(
        result[i - 1],
        result[i + 1],
        result[i],
      );
      if (deviation < leastDeviation) {
        leastDeviation = deviation;
        leastIndex = i;
      }
    }
    result = [...result.slice(0, leastIndex), ...result.slice(leastIndex + 1)];
  }

  return result;
}

// Builds a ribbon polygon of `halfWidthMeters` on either side of the
// piecewise-linear path through `waypoints` - used to depict a swarm's
// lateral sampling width as a shaded region. Per-vertex normals are the
// (normalized) average of the two adjacent segment normals, a simple miter
// join with no special handling for sharp angles - adequate for a schematic
// depiction, not precision GIS.
export function buildLateralBand(
  waypoints: Waypoint[],
  halfWidthMeters: number,
): Waypoint[] {
  const n = waypoints.length;
  if (n < 2) {
    return [];
  }

  const segmentDirs: { east: number; north: number }[] = [];
  for (let i = 0; i < n - 1; i++) {
    const a = waypoints[i];
    const b = waypoints[i + 1];
    const latRef = (a.lat * Math.PI) / 180;
    const east = (b.lon - a.lon) * Math.cos(latRef);
    const north = b.lat - a.lat;
    const length = Math.hypot(east, north) || 1;
    segmentDirs.push({ east: east / length, north: north / length });
  }

  function normalAt(i: number): { east: number; north: number } {
    const before = segmentDirs[Math.max(i - 1, 0)];
    const after = segmentDirs[Math.min(i, segmentDirs.length - 1)];
    const east = before.east + after.east;
    const north = before.north + after.north;
    const length = Math.hypot(east, north) || 1;
    // Rotate the averaged direction 90 degrees to get the normal.
    return { east: -north / length, north: east / length };
  }

  const left: Waypoint[] = [];
  const right: Waypoint[] = [];
  for (let i = 0; i < n; i++) {
    const normal = normalAt(i);
    left.push(
      offsetLatLon(
        waypoints[i].lat,
        waypoints[i].lon,
        normal.north * halfWidthMeters,
        normal.east * halfWidthMeters,
      ),
    );
    right.push(
      offsetLatLon(
        waypoints[i].lat,
        waypoints[i].lon,
        -normal.north * halfWidthMeters,
        -normal.east * halfWidthMeters,
      ),
    );
  }

  return [...left, ...right.reverse()];
}
