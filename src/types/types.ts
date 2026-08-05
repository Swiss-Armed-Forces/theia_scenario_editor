import type { LatLng } from "leaflet";
import type { components } from "./schema";

export type Point = components["schemas"]["Point"];
export type Receiver = components["schemas"]["Receiver-Input"];
export type Transmitter = components["schemas"]["Transmitter-Input"];
export const POLARIZATION_HORIZONTAL = 0;
export const POLARIZATION_VERTICAL = 1;
export type MonostaticSensor = components["schemas"]["MonostaticSensor-Input"];
export type PclSensor = components["schemas"]["PclSensor-Input"];
export type GeoJSONFeature = components["schemas"]["GeoJSONFeature"];
export type LatLonHeightGrid = components["schemas"]["LatLonHeightGrid"];

export interface Effector {
  id: number;
  name: string;
  point: Point;
  combat_range: number;
  n_attacks_left: number;
}

export type Sensor = MonostaticSensor | PclSensor;

export type SensorPortfolio = {
  blueMonostaticSensors: MonostaticSensor[];
  redMonostaticSensors: MonostaticSensor[];
};

export type MapClickListener = (p: LatLng) => void;

// A "target" is any entity that can itself be detected by another sensor:
// monostatic sensors, PCL receivers, and effectors. target_id is unique
// across all three kinds (see unusedTargetId in ScenarioStore), unlike the
// per-kind ids (Receiver.id, Transmitter.id, ...) which are each their
// own id space.
export const DEFAULT_RCS = 1.0;

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

export interface DetectableEffector {
  target_id: number;
  rcs: number;
  effector: Effector;
}

export const DEFAULT_LAUNCH_ANGLE = 45;

export type Terrain = { terrain_name: string };

export interface Missile {
  id: number;
  name: string;
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

export function buildDefaultEffector(
  point: Point,
  id: number,
  name: string,
  target_id: number,
): DetectableEffector {
  const DEFAULT_COMBAT_RANGE = 4_000;
  const DEFAULT_N_ATTACKS = 10;
  return {
    target_id,
    rcs: DEFAULT_RCS,
    effector: {
      id,
      name,
      point,
      combat_range: DEFAULT_COMBAT_RANGE,
      n_attacks_left: DEFAULT_N_ATTACKS,
    },
  };
}

export function buildDefaultMissile(
  pStart: Point,
  pStop: Point,
  id: number,
  name: string,
  target_id: number,
  effector_id: number,
  terrain: Terrain,
): Missile {
  return {
    id,
    name,
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
