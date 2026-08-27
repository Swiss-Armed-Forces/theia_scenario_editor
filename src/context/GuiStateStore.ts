import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  fetchDefaultMonostaticSensorConfigurations,
  fetchFmTransmitters,
  fetchTerrainModels,
  type MonostaticCoverageCalcConf,
  type PclCoverageCalcConf,
} from "../backend/backend";
import type {
  DefaultMonostaticSensorConfiguration,
  MapClickListener,
  Point,
  Transmitter,
} from "../types/types";
import { useScenarioStore } from "./ScenarioStore";
import { isApiReachable } from "../util/isApiReachable";

export const DEFAULT_MONOSTATIC_COVERAGE_CALC_CONF: MonostaticCoverageCalcConf =
  {
    targetAlt: 1000.0,
    targetRcs: 1.0,
    probabilityThreshold: 0.8,
    latRes: 0.01,
    lonRes: 0.025,
  };

export const DEFAULT_PCL_COVERAGE_CALC_CONF: PclCoverageCalcConf = {
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
};

export type CalcSettingsView = "monostatic" | "pcl" | null;

interface GuiStateStore {
  selectedReceiverId: number | null;
  selectedEffectorId: number | null;
  selectedMissileTargetId: number | null;
  selectedDroneSwarmTargetId: number | null;
  activeCalcSettingsView: CalcSettingsView;
  setActiveCalcSettingsView: (view: CalcSettingsView) => void;
  visibleSensorIds: Set<number>;
  monostaticCoverageCalcConf: MonostaticCoverageCalcConf;
  pclCoverageCalcConf: PclCoverageCalcConf;
  fmTransmitters: Transmitter[];
  terrainModels: string[];
  mapClickListener: MapClickListener | null;
  setMapClickListener: (listener: MapClickListener | null) => void;
  distancePoints: Point[];
  addDistancePoint: (point: Point) => void;
  clearDistancePoints: () => void;
  pendingMissileStart: Point | null;
  setPendingMissileStart: (point: Point | null) => void;
  selectReceiver: (receiverId: number | null) => void;
  selectEffector: (effectorId: number | null) => void;
  selectMissile: (missileTargetId: number | null) => void;
  selectDroneSwarm: (droneSwarmTargetId: number | null) => void;
  pclSelectionReceiverId: number | null;
  setPclSelectionReceiverId: (receiverId: number | null) => void;
  showSensor: (sensorId: number) => void;
  hideSensor: (sensorId: number) => void;
  updateMonostaticCoverageCalcConf: (conf: MonostaticCoverageCalcConf) => void;
  updatePclCoverageCalcConf: (conf: PclCoverageCalcConf) => void;
  resetMonostaticCoverageCalcConf: () => void;
  resetPclCoverageCalcConf: () => void;
  fetchFmTransmitters: () => void;
  fetchTerrainModels: () => void;
  mapTileUrl: string;
  initTileUrl: () => void;
  maxZoomLevel: number;
  defaultMonostaticSensorConfigurations: DefaultMonostaticSensorConfiguration[];
  fetchDefaultMonostaticSensorConfigurations: () => void;
  monostaticExpertMode: boolean;
  setMonostaticExpertMode: (expertMode: boolean) => void;
}

const TILE_SERVER_OSM = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const TILE_SERVER_LOCAL = "http://localhost:8080/{z}/{x}/{y}.png";

export const useGuiStateStore = create<GuiStateStore>()(
  persist(
    (set) => ({
      selectedReceiverId: null,
      selectedEffectorId: null,
      selectedMissileTargetId: null,
      selectedDroneSwarmTargetId: null,
      activeCalcSettingsView: null,
      setActiveCalcSettingsView: (view) =>
        set((_state) => {
          if (view === null) {
            return { activeCalcSettingsView: null };
          }
          // Selecting a category's calc settings is mutually exclusive with
          // having an individual component selected, so the settings panel
          // never has to decide between showing both at once.
          return {
            activeCalcSettingsView: view,
            selectedReceiverId: null,
            selectedEffectorId: null,
            selectedMissileTargetId: null,
            selectedDroneSwarmTargetId: null,
          };
        }),
      visibleSensorIds: new Set<number>(),
      fmTransmitters: [],
      terrainModels: [],
      monostaticCoverageCalcConf: DEFAULT_MONOSTATIC_COVERAGE_CALC_CONF,
      pclCoverageCalcConf: DEFAULT_PCL_COVERAGE_CALC_CONF,
      mapClickListener: null,
      setMapClickListener: (mapClickListener: MapClickListener | null) =>
        set((_state) => {
          return { mapClickListener: mapClickListener };
        }),
      distancePoints: [],
      addDistancePoint: (point: Point) =>
        set((state) => {
          return { distancePoints: [...state.distancePoints, point] };
        }),
      clearDistancePoints: () =>
        set((_state) => {
          return { distancePoints: [] };
        }),
      pendingMissileStart: null,
      setPendingMissileStart: (point: Point | null) =>
        set((_state) => {
          return { pendingMissileStart: point };
        }),
      // Selecting one component deselects any other, so at most one item is
      // ever "active" for the settings panel to display.
      selectReceiver: (receiverId) =>
        set((_state) => {
          if (receiverId === null) {
            return { selectedReceiverId: null };
          }
          return {
            selectedReceiverId: receiverId,
            selectedEffectorId: null,
            selectedMissileTargetId: null,
            selectedDroneSwarmTargetId: null,
            activeCalcSettingsView: null,
          };
        }),
      selectEffector: (effectorId) =>
        set((_state) => {
          if (effectorId === null) {
            return { selectedEffectorId: null };
          }
          return {
            selectedEffectorId: effectorId,
            selectedReceiverId: null,
            selectedMissileTargetId: null,
            selectedDroneSwarmTargetId: null,
            activeCalcSettingsView: null,
          };
        }),
      selectMissile: (missileTargetId) =>
        set((_state) => {
          if (missileTargetId === null) {
            return { selectedMissileTargetId: null };
          }
          return {
            selectedMissileTargetId: missileTargetId,
            selectedReceiverId: null,
            selectedEffectorId: null,
            selectedDroneSwarmTargetId: null,
            activeCalcSettingsView: null,
          };
        }),
      selectDroneSwarm: (droneSwarmTargetId) =>
        set((_state) => {
          if (droneSwarmTargetId === null) {
            return { selectedDroneSwarmTargetId: null };
          }
          return {
            selectedDroneSwarmTargetId: droneSwarmTargetId,
            selectedReceiverId: null,
            selectedEffectorId: null,
            selectedMissileTargetId: null,
            activeCalcSettingsView: null,
          };
        }),
      pclSelectionReceiverId: null,
      setPclSelectionReceiverId: (receiverId) =>
        set((_state) => {
          return { pclSelectionReceiverId: receiverId };
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
      resetMonostaticCoverageCalcConf: () =>
        set((_state) => {
          return {
            monostaticCoverageCalcConf: DEFAULT_MONOSTATIC_COVERAGE_CALC_CONF,
          };
        }),
      resetPclCoverageCalcConf: () =>
        set((_state) => {
          return { pclCoverageCalcConf: DEFAULT_PCL_COVERAGE_CALC_CONF };
        }),
      fetchFmTransmitters: async () => {
        const transmitters = await fetchFmTransmitters();
        set({ fmTransmitters: transmitters });
        useScenarioStore.setState({
          unusedIdTransmitter: Math.max(...transmitters.map((tx) => tx.id)) + 1,
        });
      },
      fetchTerrainModels: async () => {
        const terrainModels = await fetchTerrainModels();
        set({ terrainModels: terrainModels });
      },
      defaultMonostaticSensorConfigurations: [],
      fetchDefaultMonostaticSensorConfigurations: async () => {
        const configurations =
          await fetchDefaultMonostaticSensorConfigurations();
        set({ defaultMonostaticSensorConfigurations: configurations });
      },
      monostaticExpertMode: false,
      setMonostaticExpertMode: (expertMode) =>
        set((_state) => {
          return { monostaticExpertMode: expertMode };
        }),
      mapTileUrl: TILE_SERVER_LOCAL, // sensible default while we check
      maxZoomLevel: 12,
      initTileUrl: async () => {
        const isReachable = await isApiReachable(
          TILE_SERVER_OSM.replace("{s}", "a")
            .replace("{z}", "8")
            .replace("{x}", "134")
            .replace("{y}", "89"),
          1000,
        );
        set({
          mapTileUrl: isReachable ? TILE_SERVER_OSM : TILE_SERVER_LOCAL,
          maxZoomLevel: isReachable ? 18 : 12,
        });
      },
    }),
    {
      name: "theia-coverage-calc-conf",
      // Only the coverage calc parameters should survive a reload; the rest
      // (selection state, visibility, map click listener, ...) is session-
      // scoped and would make no sense restored from a stale browser cache.
      partialize: (state) => ({
        monostaticCoverageCalcConf: state.monostaticCoverageCalcConf,
        pclCoverageCalcConf: state.pclCoverageCalcConf,
      }),
    },
  ),
);
