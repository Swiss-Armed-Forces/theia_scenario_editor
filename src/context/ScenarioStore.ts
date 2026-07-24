import { create } from "zustand";
import type { MonostaticSensor, PclSensor, Receiver } from "../types/types";
import { useGuiStateStore } from "./GuiStateStore";
import { useSimulationStore } from "./SimulationResultStore";
import { lineOfSightDistance } from "../backend/backend";

interface ScenarioStore {
  blueMonostaticSensors: MonostaticSensor[];
  redMonostaticSensors: MonostaticSensor[];
  pclSensors: PclSensor[];
  unusedIdSensor: number;
  unusedIdReceiver: number;
  unusedIdTransmitter: number;
  addMonostaticSensor: (sensor: MonostaticSensor, isBlue: boolean) => void;
  updatePclReceiver: (
    rx: Receiver,
    tx_min_power: number,
    max_distance: number,
  ) => void;
  deleteMonostaticSensor: (sensorId: number, isBlue: boolean) => void;
  updateMonostaticSensor: (sensor: MonostaticSensor, isBlue: boolean) => void;
}

export const useScenarioStore = create<ScenarioStore>((set, get) => ({
  blueMonostaticSensors: [],
  redMonostaticSensors: [],
  pclSensors: [],
  unusedIdSensor: 0,
  unusedIdReceiver: 0,
  unusedIdTransmitter: 0,

  addMonostaticSensor: (sensor, isBlue) =>
    set((state) => {
      useGuiStateStore.getState().showSensor(sensor.id);

      const oldSensors = isBlue
        ? state.blueMonostaticSensors
        : state.redMonostaticSensors;

      // TODO: Backend has inconsistency between antenna gain of Rx and Tx.
      // Fix it when the backend fixed it. Until then, hardcode the rule.
      sensor.transmitter.antenna_gain = calculateAntennaGain(
        sensor.receiver.diameter,
        sensor.transmitter.frequency,
        sensor.transmitter.antenna_efficiency_value,
      );

      const newSensors = [...oldSensors, sensor];

      if (isBlue) {
        return {
          blueMonostaticSensors: newSensors,
          unusedIdSensor: Math.max(state.unusedIdSensor, sensor.id + 1),
          unusedIdReceiver: Math.max(
            state.unusedIdReceiver,
            sensor.receiver.id + 1,
          ),
          unusedIdTransmitter: Math.max(
            state.unusedIdTransmitter,
            sensor.transmitter.id + 1,
          ),
        };
      } else {
        return {
          redMonostaticSensors: newSensors,
          unusedIdSensor: Math.max(state.unusedIdSensor, sensor.id + 1),
          unusedIdReceiver: Math.max(
            state.unusedIdReceiver,
            sensor.receiver.id + 1,
          ),
          unusedIdTransmitter: Math.max(
            state.unusedIdTransmitter,
            sensor.transmitter.id + 1,
          ),
        };
      }
    }),
  deleteMonostaticSensor: (sensorId: number, isBlue: boolean) =>
    set((state) => {
      useSimulationStore.getState().deleteSensor(sensorId);
      if (isBlue) {
        return {
          blueMonostaticSensors: state.blueMonostaticSensors.filter(
            (sensor) => sensor.id != sensorId,
          ),
        };
      } else {
        return {
          redMonostaticSensors: state.redMonostaticSensors.filter(
            (sensor) => sensor.id != sensorId,
          ),
        };
      }
    }),
  updateMonostaticSensor: (sensor: MonostaticSensor, _isBlue: boolean) =>
    set((state) => {
      const index = state.blueMonostaticSensors.findIndex(
        (s) => s.id == sensor.id,
      );

      if (index < 0) {
        throw new Error("Cannot edit sensor that does not exist!");
      }

      // TODO: Backend has inconsistency between antenna gain of Rx and Tx.
      // Fix it when the backend fixed it. Until then, hardcode the rule.
      sensor.transmitter.antenna_gain = calculateAntennaGain(
        sensor.receiver.diameter,
        sensor.transmitter.frequency,
        sensor.transmitter.antenna_efficiency_value,
      );

      const newSensors = structuredClone(state.blueMonostaticSensors);
      newSensors[index] = sensor;
      return { blueMonostaticSensors: newSensors };
    }),

  updatePclReceiver: async (
    rx: Receiver,
    tx_min_power: number,
    max_distance: number,
  ) => {
    // const transmitters =
    const fulfillsConditions = await Promise.all(
      useGuiStateStore.getState().fmTransmitters.map((tx) => {
        if (tx.power < tx_min_power) {
          return false;
        }
        return lineOfSightDistance(tx.point, rx.point).then(
          (d) => d <= max_distance,
        );
      }),
    );
    const transmitters = useGuiStateStore
      .getState()
      .fmTransmitters.filter((_tx, i) => fulfillsConditions[i]);

    let unusedSensorId = get().unusedIdSensor;
    const newPclSensors: PclSensor[] = transmitters.map((tx) => {
      const sensor: PclSensor = {
        id: unusedSensorId,
        transmitter: tx,
        receiver: rx,
        error_model: {
          min_bistatic_range_uncertainty: 0,
          max_bistatic_range_uncertainty: 0,
          min_doppler_uncertainty: 0,
          max_doppler_uncertainty: 0,
        },
      };
      unusedSensorId += 1;
      return sensor;
    });

    const oldPclSensors: PclSensor[] = get().pclSensors.filter(
      (sensor) => sensor.receiver.id !== rx.id,
    );
    set({
      pclSensors: [...oldPclSensors, ...newPclSensors],
      unusedIdSensor: unusedSensorId,
    });
  },
}));

function calculateAntennaGain(
  antenna_diameter: number,
  frequency: number,
  antenna_efficiency_value: number,
): number {
  /*
    The formula implemented is Equ. 2.49 in Skolnik 1980

    G = \rho \frac{4 \pi A}{\lambda^2},

    where :math:`\rho` denotes the antenna efficiency value, :math:`A` the
    aperture area of the antenna and :math:`\lambda` the signal wavelength.

    References
    ----------
    Skolnik, M. I. (1980). Introduction to Radar Systems (2nd ed.). McGraw-Hill.
  */
  // Unit 10^6 m/s matches frequency in MHz.
  const SPEED_OF_LIGHT = 299.792458;
  const wavelength = SPEED_OF_LIGHT / frequency;
  const antenna_area = (Math.PI * antenna_diameter * antenna_diameter) / 4;
  const antenna_gain =
    (antenna_efficiency_value * 4 * Math.PI * antenna_area) /
    (wavelength * wavelength);

  return 10 * Math.log10(antenna_gain);
}
