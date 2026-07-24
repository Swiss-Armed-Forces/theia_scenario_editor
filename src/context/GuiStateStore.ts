import { create } from "zustand";
import {
  fetchFmTransmitters,
  type MonostaticCoverageCalcConf,
  type PclCoverageCalcConf,
} from "../backend/backend";
import type { MapClickListener, Transmitter } from "../types/types";
import { useScenarioStore } from "./ScenarioStore";

interface GuiStateStore {
  selectedReceiverId: number | null;
  visibleSensorIds: Set<number>;
  monostaticCoverageCalcConf: MonostaticCoverageCalcConf;
  pclCoverageCalcConf: PclCoverageCalcConf;
  fmTransmitters: Transmitter[];
  mapClickListener: MapClickListener | null;
  setMapClickListener: (listener: MapClickListener | null) => void;
  selectReceiver: (receiverId: number | null) => void;
  showSensor: (sensorId: number) => void;
  hideSensor: (sensorId: number) => void;
  updateMonostaticCoverageCalcConf: (conf: MonostaticCoverageCalcConf) => void;
  updatePclCoverageCalcConf: (conf: PclCoverageCalcConf) => void;
  fetchFmTransmitters: () => void;
}

export const useGuiStateStore = create<GuiStateStore>((set) => ({
  selectedReceiverId: null,
  visibleSensorIds: new Set<number>(),
  fmTransmitters: [],
  monostaticCoverageCalcConf: {
    targetAlt: 1000.0,
    targetRcs: 1.0,
    probabilityThreshold: 0.8,
    azimuthResolution: 2.0,
    rangeOnly: false,
  },
  pclCoverageCalcConf: {
    grid: {
      lat_start: 47.3863,
      lat_stop: 47.5089,
      lat_res: 0.01,
      lon_start: 8.4622,
      lon_stop: 8.6421,
      lon_res: 0.01,
      height_start: 1000,
      height_stop: 1000,
      height_res: 100,
    },
    snrThreshold: 15.0,
    dopplerThreshold: 2.0,
    delayThreshold: 1.0,
  },
  mapClickListener: null,
  setMapClickListener: (mapClickListener: MapClickListener | null) =>
    set((_state) => {
      return { mapClickListener: mapClickListener };
    }),
  selectReceiver: (receiverId) =>
    set((_state) => {
      return { selectedReceiverId: receiverId };
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
  updatePclCoverageCalcConf: (conf: PclCoverageCalcConf) =>
    set((_state) => {
      return { pclCoverageCalcConf: conf };
    }),
  fetchFmTransmitters: async () => {
    const transmitters = await fetchFmTransmitters();
    set({ fmTransmitters: transmitters });
    useScenarioStore.setState({
      unusedIdTransmitter: Math.max(...transmitters.map((tx) => tx.id)) + 1,
    });
  },
}));
