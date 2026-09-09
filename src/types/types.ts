import type { LatLng } from "leaflet";
import type { components } from "./schema";
import { offsetLatLon } from "../util/geo";

export type Point = components["schemas"]["Point"];
export type Receiver = components["schemas"]["Receiver-Input"];
export type Transmitter = components["schemas"]["Transmitter-Input"];
export const POLARIZATION_HORIZONTAL = 0;
export const POLARIZATION_VERTICAL = 1;
export type MonostaticSensor = components["schemas"]["MonostaticSensor-Input"];
export type PclSensor = components["schemas"]["PclSensor-Input"];
export type DefaultMonostaticSensorConfiguration =
  components["schemas"]["DefaultMonostaticSensorConfiguration"];
export type GeoJSONFeature = components["schemas"]["GeoJSONFeature"];
export type LatLonHeightGrid = components["schemas"]["LatLonHeightGrid"];

interface BaseEffector {
  id: number;
  name: string;
  point: Point;
  combat_range: number;
  n_attacks_left: number;
  cadence: number;
}

export interface DirectEffector extends BaseEffector {
  type: "direct";
}

export interface IndirectEffector extends BaseEffector {
  type: "indirect";
  projectile: DirectEffector;
  projectile_speed: number;
  projectile_max_dist: number;
  projectile_rcs: ConstantRcsModel;
}

export type Effector = DirectEffector | IndirectEffector;

export type Sensor = MonostaticSensor | PclSensor;

export type MapClickListener = (p: LatLng) => void;

// A "target" is any entity that can itself be detected by another sensor:
// monostatic sensors, PCL receivers, and effectors. target_id is unique
// across all three kinds (see unusedTargetId in ScenarioStore), unlike the
// per-kind ids (Receiver.id, Transmitter.id, ...) which are each their
// own id space.
export const DEFAULT_RCS = 1.0;

// Effectors have no physical antenna height to lift them off the ground
// (unlike receivers/transmitters, which do), so a point placed directly from
// elevationAt() lies exactly on the terrain surface and can trip the
// backend's LOS check. Applied wherever an effector's point is set.
export const EFFECTOR_ALTITUDE_OFFSET = 2.0;

export interface DetectableMonostaticSensor {
  target_id: number;
  rcs: number;
  sensor: MonostaticSensor;
}

export interface DetectablePclReceiver {
  target_id: number;
  rcs: number;
  receiver: Receiver;
}

// One object per (receiver, transmitter) pairing, but target_id/rcs always mirror
// the pairing's DetectablePclReceiver: both refer to the same physical
// receiver, so they must be identical across every PclSensor derived from
// it (see rebuildPclSensorsFor in ScenarioStore.ts).
export interface DetectablePclSensor {
  target_id: number;
  rcs: number;
  sensor: PclSensor;
}

export interface Gbad {
  target_id: number;
  rcs: number;
  gbad: Effector;
}

// A stationary, killable target with no sensor or weapon of its own (e. g.
// an airport, power plant, or command building).
export interface CriticalInfrastructure {
  target_id: number;
  name: string;
  point: Point;
}

export const DEFAULT_LAUNCH_ANGLE = 45;

export type Terrain = { terrain_name: string };

export interface Missile {
  p_start: Point;
  p_stop: Point;
  t_start: string;
  terrain: Terrain;
  target_id: number;
  effector_id: number;
  rcs: number;
  alpha: number;
}

export function buildDefaultMonostaticSensor(
  point: Point,
  rx_id: number,
  tx_id: number,
  sensor_id: number,
  target_id: number,
): DetectableMonostaticSensor {
  const DEFAULT_ANTENNA_HEIGHT = 8.0;
  const DEFAULT_ANTENNA_DIAMETER = 2.0;
  const DEFAULT_FREQUENCY = 3000.0;
  const DEFAULT_PULSE_WIDTH = 1.0;
  const DEFAULT_BANDWIDTH = 5.0;
  const DEFAULT_ANTENNA_EFFICIENCY_VALUE = 0.6;
  const rx: Receiver = {
    id: rx_id,
    point: point,
    antenna_height: DEFAULT_ANTENNA_HEIGHT,
    diameter: DEFAULT_ANTENNA_DIAMETER,
    cpi_pulses: 2,
    pfa: 1e-6,
    min_elevation: -Math.PI / 2,
    max_elevation: Math.PI / 2,
    min_azimuth: 0,
    max_azimuth: 2 * Math.PI,
    rotation_time: 10,
    bandwidth: DEFAULT_BANDWIDTH,
    gain: 0.0,
    losses: 0.0,
    noise_temperature: 300,
    noise_figure: 1.9,
    antenna_efficiency_value: DEFAULT_ANTENNA_EFFICIENCY_VALUE,
  };

  const tx: Transmitter = {
    id: tx_id,
    point: point,
    power: 50_000,
    erp: 1_000,
    antenna_height: DEFAULT_ANTENNA_HEIGHT,
    antenna_diameter: DEFAULT_ANTENNA_DIAMETER,
    antenna_gain: 0,
    frequency: DEFAULT_FREQUENCY,
    pulse_width: DEFAULT_PULSE_WIDTH,
    polarization: POLARIZATION_HORIZONTAL,
    bandwidth: DEFAULT_BANDWIDTH,
    max_coherent_integration_time: 0.5,
    antenna_efficiency_value: DEFAULT_ANTENNA_EFFICIENCY_VALUE,
  };

  return {
    target_id,
    rcs: DEFAULT_RCS,
    sensor: {
      id: sensor_id,
      transmitter: tx,
      receiver: rx,
      error_model: {
        min_range_uncertainty: 0,
        max_range_uncertainty: 0,
        min_angular_uncertainty: 0,
        max_angular_uncertainty: 0,
      },
    },
  };
}

export function buildDefaultGbad(
  point: Point,
  id: number,
  name: string,
  target_id: number,
): Gbad {
  const DEFAULT_COMBAT_RANGE = 4_000;
  const DEFAULT_N_ATTACKS = 10;
  const DEFAULT_CADENCE = 0.3;
  return {
    target_id,
    rcs: DEFAULT_RCS,
    gbad: {
      type: "direct",
      id,
      name,
      point: { ...point, alt: point.alt + EFFECTOR_ALTITUDE_OFFSET },
      combat_range: DEFAULT_COMBAT_RANGE,
      n_attacks_left: DEFAULT_N_ATTACKS,
      cadence: DEFAULT_CADENCE,
    },
  };
}

export function buildDefaultCriticalInfrastructure(
  point: Point,
  target_id: number,
): CriticalInfrastructure {
  return {
    target_id,
    name: "Critical Infrastructure",
    point,
  };
}

// A single-shot expendable munition: n_attacks_left/cadence rarely matter
// once fired, so they're not exposed for editing (see IndirectGbadSettings).
const PROJECTILE_N_ATTACKS = 1;
const PROJECTILE_CADENCE = 1.0;
// The projectile is only a template: each shot deep-copies it and mints a
// fresh id. So this authored id is never actually used for identity.
// Any value works.
const PROJECTILE_TEMPLATE_ID = 0;

export function buildDefaultIndirectGbad(
  point: Point,
  id: number,
  name: string,
  target_id: number,
): Gbad {
  const DEFAULT_COMBAT_RANGE = 100_000;
  const DEFAULT_N_ATTACKS = 10;
  const DEFAULT_CADENCE = 0.3;
  const DEFAULT_PROJECTILE_COMBAT_RANGE = 5_000;
  const DEFAULT_PROJECTILE_SPEED = 300.0;
  const DEFAULT_PROJECTILE_MAX_DIST = 50_000;
  const DEFAULT_PROJECTILE_RCS = 0.1;
  const launcherPoint = { ...point, alt: point.alt + EFFECTOR_ALTITUDE_OFFSET };
  return {
    target_id,
    rcs: DEFAULT_RCS,
    gbad: {
      type: "indirect",
      id,
      name,
      point: launcherPoint,
      combat_range: DEFAULT_COMBAT_RANGE,
      n_attacks_left: DEFAULT_N_ATTACKS,
      cadence: DEFAULT_CADENCE,
      projectile: {
        type: "direct",
        id: PROJECTILE_TEMPLATE_ID,
        name: `${name} projectile`,
        // The projectile launches from the launcher's own location.
        point: launcherPoint,
        combat_range: DEFAULT_PROJECTILE_COMBAT_RANGE,
        n_attacks_left: PROJECTILE_N_ATTACKS,
        cadence: PROJECTILE_CADENCE,
      },
      projectile_speed: DEFAULT_PROJECTILE_SPEED,
      projectile_max_dist: DEFAULT_PROJECTILE_MAX_DIST,
      projectile_rcs: { rcs: DEFAULT_PROJECTILE_RCS },
    },
  };
}

export function buildDefaultMissile(
  pStart: Point,
  pStop: Point,
  target_id: number,
  effector_id: number,
  terrain: Terrain,
): Missile {
  return {
    p_start: pStart,
    p_stop: pStop,
    t_start: new Date().toISOString(),
    terrain,
    target_id,
    effector_id,
    rcs: DEFAULT_RCS,
    alpha: DEFAULT_LAUNCH_ANGLE,
  };
}

export function buildDefaultPclReceiver(
  point: Point,
  rx_id: number,
  target_id: number,
): [DetectablePclReceiver, number, number] {
  const DEFAULT_ANTENNA_HEIGHT = 8.0;
  const DEFAULT_ANTENNA_DIAMETER = 2.0;
  const DEFAULT_BANDWIDTH = 0.3;
  const DEFAULT_ANTENNA_EFFICIENCY_VALUE = 0.6;
  const MIN_TX_POWER = 1000;
  const MAX_DISTANCE = 50_000;
  const rx: Receiver = {
    id: rx_id,
    point: point,
    antenna_height: DEFAULT_ANTENNA_HEIGHT,
    diameter: DEFAULT_ANTENNA_DIAMETER,
    cpi_pulses: 1,
    pfa: 1e-6,
    min_elevation: -Math.PI / 2,
    max_elevation: Math.PI / 2,
    min_azimuth: 0,
    max_azimuth: 2 * Math.PI,
    rotation_time: 1,
    bandwidth: DEFAULT_BANDWIDTH,
    gain: 0.0,
    losses: 0.0,
    noise_temperature: 300,
    noise_figure: 1.9,
    antenna_efficiency_value: DEFAULT_ANTENNA_EFFICIENCY_VALUE,
  };
  return [
    { target_id, rcs: DEFAULT_RCS, receiver: rx },
    MIN_TX_POWER,
    MAX_DISTANCE,
  ];
}

// A spline node for a drone swarm's trajectory. No altitude: cruise altitude
// is a single swarm-wide value (DroneSwarm.cruiseAltitude), so dragging a
// waypoint never needs an elevationAt() round-trip.
export interface Waypoint {
  lat: number;
  lon: number;
}

// Hand-written mirrors of src/types/orbat_file_schema.json's Trajectory /
// ConstantRcsModel / DroneSwarmFactory - not derived from schema.d.ts, since
// that file only covers openapi.json (same reason Missile/Terrain above are
// hand-written rather than generated).
export interface ConstantRcsModel {
  rcs: number;
}

export interface Trajectory {
  target_id: number;
  target_sidc: string;
  times: string[];
  lats: number[];
  lons: number[];
  alts: number[];
  vxs: number[];
  vys: number[];
  vzs: number[];
  cross_section_model: ConstantRcsModel;
}

// Not consumed by any renderer today (target_sidc isn't used for icon
// selection anywhere in ScenarioMap.tsx, including the already-reserved
// oneway_drones) - just a schema-valid placeholder.
export const DRONE_TARGET_SIDC = "10260100001101000000";

// The orbat_file_schema.json wire format: what actually gets saved under
// OrderOfBattle.drone_swarms and (eventually) sent to the backend.
export interface DroneSwarmFactory {
  swarm_trajectory: Trajectory;
  n_drones: number;
  lateral_max_deviation: number;
  up_max_deviation: number;
  effector_range: number;
  terrain: Terrain;
}

// The authored/in-memory shape of a drone swarm. Same waypoints as
// DroneSwarmFactory.swarm_trajectory, just with velocity kept alongside
// instead of baked into per-point vx/vy, so the map can offer drag-and-drop
// editing without recomputing velocity by hand; ScenarioStore converts
// to/from DroneSwarmFactory at the save-file boundary (see
// buildDroneSwarmFactory / droneSwarmFromFactory in util/swarmTrajectory.ts).
export interface DroneSwarm {
  target_id: number;
  waypoints: Waypoint[];
  velocity: number;
  cruiseAltitude: number;
  t_start: string;
  rcs: number;
  n_drones: number;
  lateral_max_deviation: number;
  up_max_deviation: number;
  effectorRange: number;
  terrain: Terrain;
}

export function buildDefaultDroneSwarm(
  point: Point,
  target_id: number,
  terrain: Terrain,
): DroneSwarm {
  const DEFAULT_VELOCITY = 20;
  const DEFAULT_CRUISE_ALTITUDE_OFFSET = 100;
  const DEFAULT_WAYPOINT_SPACING = 1000;
  const DEFAULT_N_DRONES = 5;
  const DEFAULT_LATERAL_MAX_DEVIATION = 50;
  const DEFAULT_UP_MAX_DEVIATION = 20;
  const DEFAULT_EFFECTOR_RANGE = 100;

  const waypoints: Waypoint[] = [
    { lat: point.lat, lon: point.lon },
    offsetLatLon(point.lat, point.lon, DEFAULT_WAYPOINT_SPACING, 0),
    offsetLatLon(point.lat, point.lon, 2 * DEFAULT_WAYPOINT_SPACING, 0),
  ];

  return {
    target_id,
    waypoints,
    velocity: DEFAULT_VELOCITY,
    cruiseAltitude: point.alt + DEFAULT_CRUISE_ALTITUDE_OFFSET,
    t_start: new Date().toISOString(),
    rcs: DEFAULT_RCS,
    n_drones: DEFAULT_N_DRONES,
    lateral_max_deviation: DEFAULT_LATERAL_MAX_DEVIATION,
    up_max_deviation: DEFAULT_UP_MAX_DEVIATION,
    effectorRange: DEFAULT_EFFECTOR_RANGE,
    terrain,
  };
}
