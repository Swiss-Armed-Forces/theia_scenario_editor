import { create } from "zustand";
import type { MonostaticSensor, PclSensor } from "../types/types";
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
  // result, calculatedAt (epoch)
  monostaticCoverages: [MonostaticCoverageResult, number][];
  // result, calculatedAt (epoch)
  minDetectableRcsGrids: [PclMinDetectableRcsResult, number][];
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
      sensors.map(async (sensor): Promise<[MonostaticCoverageResult, number]> => [
        await calculateMonostaticCoverage(sensor, conf),
        Date.now(),
      ]),
    );
    set({ monostaticCoverages: coverages });
  },
  updateMinDetectableRcsGrids: async (
    sensors: PclSensor[],
    conf: PclCoverageCalcConf,
  ) => {
    const grids = await Promise.all(
      sensors.map(async (sensor): Promise<[PclMinDetectableRcsResult, number]> => [
        await calculatePclMinimumDetectableRcs(sensor, conf),
        Date.now(),
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

export type SerializedSimulationState = {
  monostaticCoverages: [MonostaticCoverageResult, number][];
  minDetectableRcsGrids: [PclMinDetectableRcsResult, number][];
};

export function serializeSimulationState(
  state: SimulationStore,
): SerializedSimulationState {
  return {
    monostaticCoverages: state.monostaticCoverages,
    // NaN ("not detectable") doesn't survive JSON.stringify, so encode it
    // with the same -1 sentinel used at the backend boundary.
    minDetectableRcsGrids: state.minDetectableRcsGrids.map(
      ([result, calculatedAt]) => [
        { ...result, grid: encodeMinDetectableRcsGrid(result.grid) },
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
    minDetectableRcsGrids: (data?.minDetectableRcsGrids ?? []).map(
      ([result, calculatedAt]) => [
        { ...result, grid: decodeMinDetectableRcsGrid(result.grid) },
        calculatedAt,
      ],
    ),
  };
}
