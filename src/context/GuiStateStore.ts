import { create } from "zustand";

interface GuiStateStore {
  selectedSensorId: number | null;
  selectSensor: (sensorId: number | null) => void;
}

export const useGuiStateStore = create<GuiStateStore>((set) => ({
  selectedSensorId: null,
  selectSensor: (sensorId) =>
    set((state) => {
      return { selectedSensorId: sensorId };
    }),
}));
