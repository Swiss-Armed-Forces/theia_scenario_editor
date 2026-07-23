import { create } from "zustand";
import type { GeoJSONFeature, MonostaticSensor } from "../types/types";
import {
  calculateMonostaticCoverage,
  type MonostaticCoverageCalcConf,
} from "../backend/backend";

interface SimulationStore {
  monostaticCoverages: [number, GeoJSONFeature][];
  updateMonostaticCoverages: (
    sensors: MonostaticSensor[],
    conf: MonostaticCoverageCalcConf,
  ) => void;
}

export const useSimulationStore = create<SimulationStore>((set) => ({
  monostaticCoverages: [],
  updateMonostaticCoverages: async (
    sensors: MonostaticSensor[],
    conf: MonostaticCoverageCalcConf,
  ) => {
    console.log(
      "coverage calc",
      sensors.map((s) => s.id),
    );
    const coverages = await Promise.all(
      sensors.map((sensor) =>
        Promise.all([sensor.id, calculateMonostaticCoverage(sensor, conf)] as [
          number,
          Promise<GeoJSONFeature>,
        ]),
      ),
    );
    set({ monostaticCoverages: coverages });
  },
}));
