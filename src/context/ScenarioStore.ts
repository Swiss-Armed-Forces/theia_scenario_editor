import { create } from "zustand";
import type { MonostaticSensor } from "../types/types";
import { useGuiStateStore } from "./GuiStateStore";

interface ScenarioStore {
  blueMonostaticSensors: MonostaticSensor[];
  redMonostaticSensors: MonostaticSensor[];
  unusedIdMonostaticSensor: number;
  unusedIdReceiver: number;
  unusedIdTransmitter: number;
  addMonostaticSensor: (sensor: MonostaticSensor, isBlue: boolean) => void;
}

export const useScenarioStore = create<ScenarioStore>((set) => ({
  blueMonostaticSensors: [],
  redMonostaticSensors: [],
  unusedIdMonostaticSensor: 0,
  unusedIdReceiver: 0,
  unusedIdTransmitter: 0,

  addMonostaticSensor: (sensor, isBlue) =>
    set((state) => {
      useGuiStateStore.getState().showSensor(sensor.id);

      const oldSensors = isBlue
        ? state.blueMonostaticSensors
        : state.redMonostaticSensors;

      const newSensors = [...oldSensors, sensor];

      if (isBlue) {
        return {
          blueMonostaticSensors: newSensors,
          unusedIdMonostaticSensor: Math.max(
            state.unusedIdMonostaticSensor,
            sensor.id + 1,
          ),
          unusedIdReceiver: Math.max(state.unusedIdReceiver, sensor.id + 1),
          unusedIdTransmitter: Math.max(
            state.unusedIdTransmitter,
            sensor.id + 1,
          ),
        };
      } else {
        return {
          redMonostaticSensors: newSensors,
          unusedIdMonostaticSensor: Math.max(
            state.unusedIdMonostaticSensor,
            sensor.id + 1,
          ),
          unusedIdReceiver: Math.max(state.unusedIdReceiver, sensor.id + 1),
          unusedIdTransmitter: Math.max(
            state.unusedIdTransmitter,
            sensor.id + 1,
          ),
        };
      }
    }),
}));
