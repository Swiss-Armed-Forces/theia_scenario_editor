import { create } from "zustand";
import type { GeoJSONFeature, MonostaticSensor } from "../types/types";
import {
  calculateMonostaticCoverage,
  type MonostaticCoverageCalcConf,
} from "../backend/backend";

interface SimulationStore {
  // sensorId, coverage, calculatedAt (epoch)
  monostaticCoverages: [number, GeoJSONFeature, number][];
  updateMonostaticCoverages: (
    sensors: MonostaticSensor[],
    conf: MonostaticCoverageCalcConf,
  ) => void;
  deleteSensor: (sensorId: number) => void;
}

export const useSimulationStore = create<SimulationStore>((set) => ({
  monostaticCoverages: [],
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
  deleteSensor: (sensorId: number) =>
    set((state) => {
      const newCoverages = state.monostaticCoverages.filter(
        ([id, _coverage, _lastUpdated]) => id !== sensorId,
      );
      return { monostaticCoverages: newCoverages };
    }),
}));
