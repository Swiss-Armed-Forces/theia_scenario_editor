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

export type SensorPortfolio = {
  blueMonostaticSensors: MonostaticSensor[];
  redMonostaticSensors: MonostaticSensor[];
};

export type MapClickListener = (p: LatLng) => void;

export function buildDefaultMonostaticSensor(
  point: Point,
  rx_id: number,
  tx_id: number,
  sensor_id: number,
): MonostaticSensor {
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
    id: sensor_id,
    transmitter: tx,
    receiver: rx,
    error_model: {
      min_range_uncertainty: 0,
      max_range_uncertainty: 0,
      min_angular_uncertainty: 0,
      max_angular_uncertainty: 0,
    },
  };
}
