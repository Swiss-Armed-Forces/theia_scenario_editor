import { create } from "zustand";

interface GuiStateStore {
  selectedSensorId: number | null;
  visibleSensorIds: Set<number>;
  selectSensor: (sensorId: number | null) => void;
  showSensor: (sensorId: number) => void;
  hideSensor: (sensorId: number) => void;
}

export const useGuiStateStore = create<GuiStateStore>((set) => ({
  selectedSensorId: null,
  visibleSensorIds: new Set<number>(),
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
}));
