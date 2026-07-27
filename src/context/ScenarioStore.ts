import { create } from "zustand";
import type {
  Effector,
  MonostaticSensor,
  PclSensor,
  Receiver,
  Transmitter,
} from "../types/types";
import { useGuiStateStore } from "./GuiStateStore";
import { useSimulationStore } from "./SimulationResultStore";
import { lineOfSightDistance } from "../backend/backend";

export type PclTxSelectionCriteria = { min_power: number; max_dist: number };

export interface ScenarioStore {
  blueMonostaticSensors: MonostaticSensor[];
  redMonostaticSensors: MonostaticSensor[];
  pclSensors: PclSensor[];
  pclReceivers: Receiver[];
  pclTransmitterIds: Map<number, Set<number>>;
  pclTxCriteria: Map<number, PclTxSelectionCriteria>;
  effectors: Effector[];
  unusedIdSensor: number;
  unusedIdReceiver: number;
  unusedIdTransmitter: number;
  unusedIdEffector: number;
  addMonostaticSensor: (sensor: MonostaticSensor, isBlue: boolean) => void;
  addPclReceiver: (
    rx: Receiver,
    criteria: PclTxSelectionCriteria,
  ) => Promise<void>;
  addEffector: (effector: Effector) => void;
  updateEffector: (effector: Effector) => void;
  deleteEffector: (effectorId: number) => void;
  updatePclReceiverSettings: (rx: Receiver) => void;
  updatePclTxCriteria: (
    receiverId: number,
    criteria: PclTxSelectionCriteria,
  ) => void;
  togglePclTransmitter: (receiverId: number, transmitterId: number) => void;
  selectAllMatchingCriteria: (receiverId: number) => Promise<void>;
  deletePclReceiver: (receiverId: number) => void;
  deleteReceiver: (receiverId: number, isBlue: boolean) => void;
  updateMonostaticSensor: (sensor: MonostaticSensor, isBlue: boolean) => void;
}

// Rebuilds the PclSensor rows for a single receiver from its associated
// transmitter ids, reusing existing sensor ids for pairs that already exist
// so unrelated churn (e.g. a settings edit) doesn't disturb visibility state
// or force new ids for transmitters that were already selected.
function rebuildPclSensorsFor(
  receiverId: number,
  receiver: Receiver,
  transmitterIds: Set<number>,
  fmTransmitters: Transmitter[],
  existingSensors: PclSensor[],
  unusedIdSensor: number,
): { sensors: PclSensor[]; unusedIdSensor: number } {
  const txById = new Map(fmTransmitters.map((tx) => [tx.id, tx]));
  const existingIdByTxId = new Map(
    existingSensors
      .filter((sensor) => sensor.receiver.id === receiverId)
      .map((sensor) => [sensor.transmitter.id, sensor.id]),
  );

  let nextId = unusedIdSensor;
  const sensorsForReceiver: PclSensor[] = [];
  for (const txId of transmitterIds) {
    const tx = txById.get(txId);
    if (!tx) {
      continue;
    }
    const existingId = existingIdByTxId.get(txId);
    const id = existingId ?? nextId;
    if (existingId === undefined) {
      nextId += 1;
    }
    sensorsForReceiver.push({
      id,
      transmitter: tx,
      receiver,
      error_model: {
        min_bistatic_range_uncertainty: 0,
        max_bistatic_range_uncertainty: 0,
        min_doppler_uncertainty: 0,
        max_doppler_uncertainty: 0,
      },
    });
  }

  const otherSensors = existingSensors.filter(
    (sensor) => sensor.receiver.id !== receiverId,
  );
  return {
    sensors: [...otherSensors, ...sensorsForReceiver],
    unusedIdSensor: nextId,
  };
}

async function matchingTransmitterIds(
  point: Receiver["point"],
  criteria: PclTxSelectionCriteria,
  fmTransmitters: Transmitter[],
): Promise<Set<number>> {
  const fulfillsConditions = await Promise.all(
    fmTransmitters.map((tx) => {
      if (tx.power < criteria.min_power) {
        return false;
      }
      return lineOfSightDistance(tx.point, point).then(
        (d) => d <= criteria.max_dist,
      );
    }),
  );
  return new Set(
    fmTransmitters.filter((_tx, i) => fulfillsConditions[i]).map((tx) => tx.id),
  );
}

// `Map`/`Set` don't survive JSON.stringify (a Map serializes to "{}",
// silently dropping its contents), so save/load needs an explicit,
// JSON-safe representation of the store rather than dumping getState()
// directly.
export type SerializedScenarioState = {
  blueMonostaticSensors: MonostaticSensor[];
  redMonostaticSensors: MonostaticSensor[];
  pclSensors: PclSensor[];
  pclReceivers: Receiver[];
  pclTransmitterIds: [number, number[]][];
  pclTxCriteria: [number, PclTxSelectionCriteria][];
  effectors: Effector[];
  unusedIdSensor: number;
  unusedIdReceiver: number;
  unusedIdTransmitter: number;
  unusedIdEffector: number;
};

export function serializeScenarioState(
  state: ScenarioStore,
): SerializedScenarioState {
  return {
    blueMonostaticSensors: state.blueMonostaticSensors,
    redMonostaticSensors: state.redMonostaticSensors,
    pclSensors: state.pclSensors,
    pclReceivers: state.pclReceivers,
    pclTransmitterIds: Array.from(state.pclTransmitterIds.entries()).map(
      ([receiverId, ids]): [number, number[]] => [receiverId, Array.from(ids)],
    ),
    pclTxCriteria: Array.from(state.pclTxCriteria.entries()),
    effectors: state.effectors,
    unusedIdSensor: state.unusedIdSensor,
    unusedIdReceiver: state.unusedIdReceiver,
    unusedIdTransmitter: state.unusedIdTransmitter,
    unusedIdEffector: state.unusedIdEffector,
  };
}

export function deserializeScenarioState(
  data: SerializedScenarioState,
): Partial<ScenarioStore> {
  return {
    blueMonostaticSensors: data.blueMonostaticSensors,
    redMonostaticSensors: data.redMonostaticSensors,
    pclSensors: data.pclSensors,
    pclReceivers: data.pclReceivers ?? [],
    pclTransmitterIds: new Map(
      (data.pclTransmitterIds ?? []).map(([receiverId, ids]) => [
        receiverId,
        new Set(ids),
      ]),
    ),
    pclTxCriteria: new Map(data.pclTxCriteria ?? []),
    effectors: data.effectors ?? [],
    unusedIdSensor: data.unusedIdSensor,
    unusedIdReceiver: data.unusedIdReceiver,
    unusedIdTransmitter: data.unusedIdTransmitter,
    unusedIdEffector: data.unusedIdEffector ?? 0,
  };
}

export const useScenarioStore = create<ScenarioStore>((set, get) => ({
  blueMonostaticSensors: [],
  redMonostaticSensors: [],
  pclSensors: [],
  pclReceivers: [],
  pclTransmitterIds: new Map<number, Set<number>>(),
  pclTxCriteria: new Map<number, PclTxSelectionCriteria>(),
  effectors: [],
  unusedIdSensor: 0,
  unusedIdReceiver: 0,
  unusedIdTransmitter: 0,
  unusedIdEffector: 0,

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
  addEffector: (effector) =>
    set((state) => {
      return {
        effectors: [...state.effectors, effector],
        unusedIdEffector: Math.max(state.unusedIdEffector, effector.id + 1),
      };
    }),
  updateEffector: (effector) =>
    set((state) => {
      const i = state.effectors.findIndex((e) => e.id === effector.id);
      const newEffectors = structuredClone(state.effectors);
      newEffectors[i] = effector;
      return {
        effectors: newEffectors,
      };
    }),
  deleteEffector: (effectorId) =>
    set((state) => {
      const newEffectors = state.effectors.filter((e) => e.id !== effectorId);
      return { effectors: newEffectors };
    }),
  deleteReceiver: (receiverId: number, isBlue: boolean) =>
    set((state) => {
      // Monostatic sensors: Delete coverage results and the sensor itself.
      const sensorIds = new Set(
        state.blueMonostaticSensors
          .filter((sensor) => sensor.receiver.id === receiverId)
          .map((sensor) => sensor.id),
      );
      for (const sensorId of sensorIds) {
        useSimulationStore.getState().deleteSensor(sensorId);
      }
      if (isBlue) {
        return {
          blueMonostaticSensors: state.blueMonostaticSensors.filter(
            (sensor) => !sensorIds.has(sensor.id),
          ),
        };
      } else {
        return {
          redMonostaticSensors: state.redMonostaticSensors.filter(
            (sensor) => !sensorIds.has(sensor.id),
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

  addPclReceiver: async (rx: Receiver, criteria: PclTxSelectionCriteria) => {
    const fmTransmitters = useGuiStateStore.getState().fmTransmitters;
    const initialIds = new Set<number>();

    set((state) => {
      const { sensors, unusedIdSensor } = rebuildPclSensorsFor(
        rx.id,
        rx,
        initialIds,
        fmTransmitters,
        state.pclSensors,
        state.unusedIdSensor,
      );
      for (const sensor of sensors.filter((s) => s.receiver.id === rx.id)) {
        useGuiStateStore.getState().showSensor(sensor.id);
      }

      const newTransmitterIds = structuredClone(state.pclTransmitterIds);
      newTransmitterIds.set(rx.id, initialIds);
      const newCriteria = structuredClone(state.pclTxCriteria);
      newCriteria.set(rx.id, criteria);

      return {
        pclReceivers: [...state.pclReceivers, rx],
        pclSensors: sensors,
        pclTransmitterIds: newTransmitterIds,
        pclTxCriteria: newCriteria,
        unusedIdSensor,
        unusedIdReceiver: Math.max(state.unusedIdReceiver, rx.id + 1),
      };
    });
  },

  updatePclReceiverSettings: (rx: Receiver) =>
    set((state) => {
      const index = state.pclReceivers.findIndex((r) => r.id === rx.id);
      if (index < 0) {
        throw new Error("Cannot edit receiver that does not exist!");
      }
      const newReceivers = structuredClone(state.pclReceivers);
      newReceivers[index] = rx;

      const transmitterIds =
        state.pclTransmitterIds.get(rx.id) ?? new Set<number>();
      const { sensors, unusedIdSensor } = rebuildPclSensorsFor(
        rx.id,
        rx,
        transmitterIds,
        useGuiStateStore.getState().fmTransmitters,
        state.pclSensors,
        state.unusedIdSensor,
      );

      return {
        pclReceivers: newReceivers,
        pclSensors: sensors,
        unusedIdSensor,
      };
    }),

  updatePclTxCriteria: (receiverId: number, criteria: PclTxSelectionCriteria) =>
    set((state) => {
      const newCriteria = structuredClone(state.pclTxCriteria);
      newCriteria.set(receiverId, criteria);
      return { pclTxCriteria: newCriteria };
    }),

  togglePclTransmitter: (receiverId: number, transmitterId: number) =>
    set((state) => {
      const receiver = state.pclReceivers.find((r) => r.id === receiverId);
      if (!receiver) {
        throw new Error(
          "Cannot toggle transmitter for receiver that does not exist!",
        );
      }

      const currentIds =
        state.pclTransmitterIds.get(receiverId) ?? new Set<number>();
      const newIds = new Set(currentIds);
      if (newIds.has(transmitterId)) {
        newIds.delete(transmitterId);
      } else {
        newIds.add(transmitterId);
      }

      const { sensors, unusedIdSensor } = rebuildPclSensorsFor(
        receiverId,
        receiver,
        newIds,
        useGuiStateStore.getState().fmTransmitters,
        state.pclSensors,
        state.unusedIdSensor,
      );
      for (const sensor of sensors.filter(
        (s) => s.receiver.id === receiverId,
      )) {
        useGuiStateStore.getState().showSensor(sensor.id);
      }

      const newTransmitterIds = structuredClone(state.pclTransmitterIds);
      newTransmitterIds.set(receiverId, newIds);

      return {
        pclTransmitterIds: newTransmitterIds,
        pclSensors: sensors,
        unusedIdSensor,
      };
    }),

  selectAllMatchingCriteria: async (receiverId: number) => {
    const state = get();
    const receiver = state.pclReceivers.find((r) => r.id === receiverId);
    const criteria = state.pclTxCriteria.get(receiverId);
    if (!receiver || !criteria) {
      throw new Error(
        "Cannot select transmitters for receiver that does not exist!",
      );
    }
    const fmTransmitters = useGuiStateStore.getState().fmTransmitters;
    const matchingIds = await matchingTransmitterIds(
      receiver.point,
      criteria,
      fmTransmitters,
    );

    set((state) => {
      const currentIds =
        state.pclTransmitterIds.get(receiverId) ?? new Set<number>();
      const newIds = new Set(currentIds);
      for (const id of matchingIds) {
        newIds.add(id);
      }

      const { sensors, unusedIdSensor } = rebuildPclSensorsFor(
        receiverId,
        receiver,
        newIds,
        fmTransmitters,
        state.pclSensors,
        state.unusedIdSensor,
      );
      for (const sensor of sensors.filter(
        (s) => s.receiver.id === receiverId,
      )) {
        useGuiStateStore.getState().showSensor(sensor.id);
      }

      const newTransmitterIds = structuredClone(state.pclTransmitterIds);
      newTransmitterIds.set(receiverId, newIds);

      return {
        pclTransmitterIds: newTransmitterIds,
        pclSensors: sensors,
        unusedIdSensor,
      };
    });
  },

  deletePclReceiver: (receiverId: number) =>
    set((state) => {
      const sensorIds = new Set(
        state.pclSensors
          .filter((sensor) => sensor.receiver.id === receiverId)
          .map((sensor) => sensor.id),
      );
      for (const sensorId of sensorIds) {
        useSimulationStore.getState().deleteSensor(sensorId);
      }

      const newTransmitterIds = structuredClone(state.pclTransmitterIds);
      newTransmitterIds.delete(receiverId);
      const newCriteria = structuredClone(state.pclTxCriteria);
      newCriteria.delete(receiverId);

      return {
        pclReceivers: state.pclReceivers.filter((r) => r.id !== receiverId),
        pclSensors: state.pclSensors.filter(
          (sensor) => !sensorIds.has(sensor.id),
        ),
        pclTransmitterIds: newTransmitterIds,
        pclTxCriteria: newCriteria,
      };
    }),
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
