import { create } from "zustand";
import type { LatLonHeightGrid, MonostaticSensor, PclSensor } from "../types/types";
import {
  calculateMonostaticCoverage,
  calculatePclMinimumDetectableRcs,
  type MonostaticCoverageCalcConf,
  type MonostaticCoverageResult,
  type PclCoverageCalcConf,
  type PclMinDetectableRcsResult,
} from "../backend/backend";
import {
  decodeMinDetectableRcsGrid,
  encodeMinDetectableRcsGrid,
} from "../util/minDetectableRcsGrid";

export interface SimulationStore {
  // result, calculatedAt (ISO date-time)
  monostaticCoverages: [MonostaticCoverageResult, string][];
  // result, calculatedAt (ISO date-time)
  minDetectableRcsGrids: [PclMinDetectableRcsResult, string][];
  updateMonostaticCoverages: (
    sensors: MonostaticSensor[],
    conf: MonostaticCoverageCalcConf,
  ) => void;
  updateMinDetectableRcsGrids: (
    sensors: PclSensor[],
    conf: PclCoverageCalcConf,
  ) => void;
  deleteSensor: (sensorId: number) => void;
}

export const useSimulationStore = create<SimulationStore>((set) => ({
  monostaticCoverages: [],
  minDetectableRcsGrids: [],
  updateMonostaticCoverages: async (
    sensors: MonostaticSensor[],
    conf: MonostaticCoverageCalcConf,
  ) => {
    const coverages = await Promise.all(
      sensors.map(async (sensor): Promise<[MonostaticCoverageResult, string]> => [
        await calculateMonostaticCoverage(sensor, conf),
        new Date().toISOString(),
      ]),
    );
    set({ monostaticCoverages: coverages });
  },
  updateMinDetectableRcsGrids: async (
    sensors: PclSensor[],
    conf: PclCoverageCalcConf,
  ) => {
    const grids = await Promise.all(
      sensors.map(async (sensor): Promise<[PclMinDetectableRcsResult, string]> => [
        await calculatePclMinimumDetectableRcs(sensor, conf),
        new Date().toISOString(),
      ]),
    );
    set({ minDetectableRcsGrids: grids });
  },
  deleteSensor: (sensorId: number) =>
    set((state) => {
      const newCoverages = state.monostaticCoverages.filter(
        ([result, _lastUpdated]) => result.sensorId !== sensorId,
      );
      const newGrids = state.minDetectableRcsGrids.filter(
        ([result, _lastUpdated]) => result.sensorId !== sensorId,
      );
      return {
        monostaticCoverages: newCoverages,
        minDetectableRcsGrids: newGrids,
      };
    }),
}));

// The persisted shape follows orbat_file_schema.json's PclMinDetectableRcsCalculation,
// which uses snake_case field names (sensor_id, snr_threshold, ...) and calls the
// grid "values" - distinct from the in-memory PclMinDetectableRcsResult's camelCase
// naming and "grid" field.
export type SerializedPclMinDetectableRcsCalculation = {
  sensor_id: number;
  settings: {
    grid: LatLonHeightGrid;
    snr_threshold: number;
    doppler_threshold: number;
    delay_threshold: number;
  };
  values: number[][][];
};

export type SerializedSimulationState = {
  monostaticCoverages: [MonostaticCoverageResult, string][];
  pclMinDetectableRcsGrids: [SerializedPclMinDetectableRcsCalculation, string][];
};

export function serializeSimulationState(
  state: SimulationStore,
): SerializedSimulationState {
  return {
    monostaticCoverages: state.monostaticCoverages,
    pclMinDetectableRcsGrids: state.minDetectableRcsGrids.map(
      ([result, calculatedAt]) => [
        {
          sensor_id: result.sensorId,
          settings: {
            grid: result.settings.grid,
            snr_threshold: result.settings.snrThreshold,
            doppler_threshold: result.settings.dopplerThreshold,
            delay_threshold: result.settings.delayThreshold,
          },
          // NaN ("not detectable") doesn't survive JSON.stringify, so encode
          // it with the same -1 sentinel used at the backend boundary.
          values: encodeMinDetectableRcsGrid(result.grid),
        },
        calculatedAt,
      ],
    ),
  };
}

export function deserializeSimulationState(
  data: Partial<SerializedSimulationState> | undefined,
): Partial<SimulationStore> {
  return {
    monostaticCoverages: data?.monostaticCoverages ?? [],
    minDetectableRcsGrids: (data?.pclMinDetectableRcsGrids ?? []).map(
      ([calculation, calculatedAt]) => [
        {
          sensorId: calculation.sensor_id,
          settings: {
            grid: calculation.settings.grid,
            snrThreshold: calculation.settings.snr_threshold,
            dopplerThreshold: calculation.settings.doppler_threshold,
            delayThreshold: calculation.settings.delay_threshold,
          },
          grid: decodeMinDetectableRcsGrid(calculation.values),
        },
        calculatedAt,
      ],
    ),
  };
}
