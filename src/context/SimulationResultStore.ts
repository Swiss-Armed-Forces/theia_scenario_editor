import { create } from "zustand";
import type {
  GeoJSONFeature,
  MonostaticSensor,
  PclSensor,
} from "../types/types";
import {
  calculateMonostaticCoverage,
  calculatePclMinimumDetectableRcs,
  type MonostaticCoverageCalcConf,
  type PclCoverageCalcConf,
} from "../backend/backend";

export interface SimulationStore {
  // sensorId, coverage, calculatedAt (epoch)
  monostaticCoverages: [number, GeoJSONFeature, number][];
  // sensorId, grid of shape (lat, lon, MASL), calculatedAt (epoch)
  minDetectableRcsGrids: [number, number[][][], number][];
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
      sensors.map((sensor) =>
        Promise.all([
          sensor.id,
          calculateMonostaticCoverage(sensor, conf),
          Date.now(),
        ] as [number, Promise<GeoJSONFeature>, number]),
      ),
    );
    set({ monostaticCoverages: coverages });
  },
  updateMinDetectableRcsGrids: async (
    sensors: PclSensor[],
    conf: PclCoverageCalcConf,
  ) => {
    const grids = await Promise.all(
      sensors.map((sensor) =>
        Promise.all([
          sensor.id,
          calculatePclMinimumDetectableRcs(sensor, conf),
          Date.now(),
        ] as [number, Promise<number[][][]>, number]),
      ),
    );
    set({ minDetectableRcsGrids: grids });
  },
  deleteSensor: (sensorId: number) =>
    set((state) => {
      const newCoverages = state.monostaticCoverages.filter(
        ([id, _coverage, _lastUpdated]) => id !== sensorId,
      );
      const newGrids = state.minDetectableRcsGrids.filter(
        ([id, _grid, _lastUpdated]) => id !== sensorId,
      );
      return {
        monostaticCoverages: newCoverages,
        minDetectableRcsGrids: newGrids,
      };
    }),
}));

// Both tuple fields are already JSON-safe (no Map/Set), so no transformation
// is needed beyond picking the fields out of the store.
export type SerializedSimulationState = {
  monostaticCoverages: [number, GeoJSONFeature, number][];
  minDetectableRcsGrids: [number, number[][][], number][];
};

export function serializeSimulationState(
  state: SimulationStore,
): SerializedSimulationState {
  return {
    monostaticCoverages: state.monostaticCoverages,
    minDetectableRcsGrids: state.minDetectableRcsGrids,
  };
}

export function deserializeSimulationState(
  data: Partial<SerializedSimulationState> | undefined,
): Partial<SimulationStore> {
  return {
    monostaticCoverages: data?.monostaticCoverages ?? [],
    minDetectableRcsGrids: data?.minDetectableRcsGrids ?? [],
  };
}
