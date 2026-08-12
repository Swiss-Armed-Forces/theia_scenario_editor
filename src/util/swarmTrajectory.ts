import type {
  DroneSwarm,
  DroneSwarmFactory,
  Trajectory,
  Waypoint,
} from "../types/types";
import { DRONE_TARGET_SIDC } from "../types/types";
import { EARTH_RADIUS_M, haversineDistance } from "./geo";

// Turns a swarm's waypoints into a Trajectory with exactly one sample per
// waypoint - no interpolation/sampling in between. If the user wants a
// smoother or more detailed path, they add more waypoints; this never
// invents points on its own. Times are derived from cumulative
// great-circle distance / velocity; each waypoint's velocity vector points
// along the segment leaving it (the last waypoint reuses the final
// segment's heading, since there's nothing beyond it to aim at).
export function buildSwarmTrajectory(
  waypoints: Waypoint[],
  velocity: number,
  cruiseAltitude: number,
  tStartIso: string,
  targetId: number,
  rcs: number,
): Trajectory {
  const tStart = new Date(tStartIso).getTime();
  const times: string[] = [];
  const lats: number[] = [];
  const lons: number[] = [];
  const alts: number[] = [];
  const vxs: number[] = [];
  const vys: number[] = [];
  const vzs: number[] = [];

  let elapsedSeconds = 0;
  for (let i = 0; i < waypoints.length; i++) {
    const waypoint = waypoints[i];
    const next = waypoints[Math.min(i + 1, waypoints.length - 1)];

    times.push(new Date(tStart + elapsedSeconds * 1000).toISOString());
    lats.push(waypoint.lat);
    lons.push(waypoint.lon);
    alts.push(cruiseAltitude);

    const latRad = (waypoint.lat * Math.PI) / 180;
    const dEast = (next.lon - waypoint.lon) * Math.cos(latRad) * EARTH_RADIUS_M * (Math.PI / 180);
    const dNorth = (next.lat - waypoint.lat) * EARTH_RADIUS_M * (Math.PI / 180);
    const segmentLength = Math.hypot(dEast, dNorth);
    vxs.push(segmentLength > 0 ? (dEast / segmentLength) * velocity : 0);
    vys.push(segmentLength > 0 ? (dNorth / segmentLength) * velocity : 0);
    vzs.push(0);

    if (i < waypoints.length - 1) {
      const dist = haversineDistance(
        { lat: waypoint.lat, lon: waypoint.lon, alt: 0 },
        { lat: next.lat, lon: next.lon, alt: 0 },
      );
      elapsedSeconds += dist / velocity;
    }
  }

  return {
    target_id: targetId,
    target_sidc: DRONE_TARGET_SIDC,
    times,
    lats,
    lons,
    alts,
    vxs,
    vys,
    vzs,
    cross_section_model: { rcs },
  };
}

// Converts the authored/in-memory DroneSwarm into the orbat_file_schema.json
// wire format (OrderOfBattle.drone_swarms entries). This is the save/export
// direction; droneSwarmFromFactory below is the load direction.
export function buildDroneSwarmFactory(droneSwarm: DroneSwarm): DroneSwarmFactory {
  return {
    swarm_trajectory: buildSwarmTrajectory(
      droneSwarm.waypoints,
      droneSwarm.velocity,
      droneSwarm.cruiseAltitude,
      droneSwarm.t_start,
      droneSwarm.target_id,
      droneSwarm.rcs,
    ),
    n_drones: droneSwarm.n_drones,
    lateral_max_deviation: droneSwarm.lateral_max_deviation,
    up_max_deviation: droneSwarm.up_max_deviation,
    effector_range: droneSwarm.effectorRange,
    terrain: droneSwarm.terrain,
  };
}

// Reconstructs an editable DroneSwarm from a DroneSwarmFactory (the
// orbat_file_schema.json wire format read back from a save file). Since
// buildSwarmTrajectory samples exactly one point per waypoint (no
// interpolation - see above), the trajectory's own lats/lons ARE the
// waypoints, so this is an exact inverse of buildDroneSwarmFactory, not a
// lossy approximation. Velocity is backed out from the first segment's
// distance / time (every segment shares the same authored velocity), which
// is exact up to the millisecond precision of the serialized timestamps.
export function droneSwarmFromFactory(factory: DroneSwarmFactory): DroneSwarm {
  const trajectory = factory.swarm_trajectory;
  const n = trajectory.lats.length;
  const waypoints: Waypoint[] = trajectory.lats.map((lat, i) => ({
    lat,
    lon: trajectory.lons[i],
  }));

  let velocity = 1;
  if (n > 1) {
    const dist = haversineDistance(
      { lat: trajectory.lats[0], lon: trajectory.lons[0], alt: 0 },
      { lat: trajectory.lats[1], lon: trajectory.lons[1], alt: 0 },
    );
    const dt =
      (new Date(trajectory.times[1]).getTime() -
        new Date(trajectory.times[0]).getTime()) /
      1000;
    velocity = dt > 0 ? dist / dt : 1;
  }

  return {
    target_id: trajectory.target_id,
    waypoints,
    velocity,
    cruiseAltitude: trajectory.alts[0],
    t_start: trajectory.times[0],
    rcs: trajectory.cross_section_model.rcs,
    n_drones: factory.n_drones,
    lateral_max_deviation: factory.lateral_max_deviation,
    up_max_deviation: factory.up_max_deviation,
    effectorRange: factory.effector_range,
    terrain: factory.terrain,
  };
}
