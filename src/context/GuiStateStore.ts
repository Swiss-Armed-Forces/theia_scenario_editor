import { create } from "zustand";
import {
  fetchFmTransmitters,
  type MonostaticCoverageCalcConf,
} from "../backend/backend";
import type { Transmitter } from "../types/types";
import { useScenarioStore } from "./ScenarioStore";

interface GuiStateStore {
  selectedSensorId: number | null;
  visibleSensorIds: Set<number>;
  monostaticCoverageCalcConf: MonostaticCoverageCalcConf;
  fmTransmitters: Transmitter[];
  selectSensor: (sensorId: number | null) => void;
  showSensor: (sensorId: number) => void;
  hideSensor: (sensorId: number) => void;
  updateMonostaticCoverageCalcConf: (conf: MonostaticCoverageCalcConf) => void;
  fetchFmTransmitters: () => void;
}

export const useGuiStateStore = create<GuiStateStore>((set) => ({
  selectedSensorId: null,
  visibleSensorIds: new Set<number>(),
  fmTransmitters: [],
  monostaticCoverageCalcConf: {
    targetAlt: 1000.0,
    targetRcs: 1.0,
    probabilityThreshold: 0.8,
    azimuthResolution: 2.0,
    rangeOnly: false,
  },
  selectSensor: (sensorId) =>
    set((_state) => {
      return { selectedSensorId: sensorId };
    }),
  showSensor: (sensorId) =>
    set((state) => {
      const ids = structuredClone(state.visibleSensorIds);
      ids.add(sensorId);
      return { visibleSensorIds: ids };
    }),
  hideSensor: (sensorId) =>
    set((state) => {
      const ids = structuredClone(state.visibleSensorIds);
      ids.delete(sensorId);
      return { visibleSensorIds: ids };
    }),
  updateMonostaticCoverageCalcConf: (conf: MonostaticCoverageCalcConf) =>
    set((_state) => {
      return { monostaticCoverageCalcConf: conf };
    }),
  fetchFmTransmitters: async () => {
    const transmitters = await fetchFmTransmitters();
    set({ fmTransmitters: transmitters });
    useScenarioStore.setState({
      unusedIdTransmitter: Math.max(...transmitters.map((tx) => tx.id)) + 1,
    });
  },
}));
