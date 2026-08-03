import { create } from "zustand";
import type {
  DetectableEffector,
  DetectableMonostaticSensor,
  DetectablePclReceiver,
  DetectablePclSensor,
  Receiver,
  Transmitter,
} from "../types/types";
import { DEFAULT_RCS } from "../types/types";
import { useGuiStateStore } from "./GuiStateStore";
import { useSimulationStore } from "./SimulationResultStore";
import { lineOfSightDistance } from "../backend/backend";

export type PclTxSelectionCriteria = { min_power: number; max_dist: number };

export interface ScenarioStore {
  blueMonostaticSensors: DetectableMonostaticSensor[];
  redMonostaticSensors: DetectableMonostaticSensor[];
  pclSensors: DetectablePclSensor[];
  pclReceivers: DetectablePclReceiver[];
  pclTransmitterIds: Map<number, Set<number>>;
  pclTxCriteria: Map<number, PclTxSelectionCriteria>;
  effectors: DetectableEffector[];
  unusedIdSensor: number;
  unusedIdReceiver: number;
  unusedIdTransmitter: number;
  unusedIdEffector: number;
  unusedTargetId: number;
  addMonostaticSensor: (
    sensor: DetectableMonostaticSensor,
    isBlue: boolean,
  ) => void;
  addPclReceiver: (
    rx: DetectablePclReceiver,
    criteria: PclTxSelectionCriteria,
  ) => Promise<void>;
  addEffector: (effector: DetectableEffector) => void;
  updateEffector: (effector: DetectableEffector) => void;
  deleteEffector: (effectorId: number) => void;
  updatePclReceiverSettings: (rx: DetectablePclReceiver) => void;
  updatePclTxCriteria: (
    receiverId: number,
    criteria: PclTxSelectionCriteria,
  ) => void;
  togglePclTransmitter: (receiverId: number, transmitterId: number) => void;
  selectAllMatchingCriteria: (receiverId: number) => Promise<void>;
  deletePclReceiver: (receiverId: number) => void;
  deleteReceiver: (receiverId: number, isBlue: boolean) => void;
  updateMonostaticSensor: (
    sensor: DetectableMonostaticSensor,
    isBlue: boolean,
  ) => void;
}

// Rebuilds the PclSensor rows for a single receiver from its associated
// transmitter ids, reusing existing sensor ids for pairs that already exist
// so unrelated churn (e.g. a settings edit) doesn't disturb visibility state
// or force new ids for transmitters that were already selected. Every row
// mirrors the receiver's target_id/rcs, since they all refer to the same
// physical receiver.
function rebuildPclSensorsFor(
  receiverId: number,
  detectableRx: DetectablePclReceiver,
  transmitterIds: Set<number>,
  fmTransmitters: Transmitter[],
  existingSensors: DetectablePclSensor[],
  unusedIdSensor: number,
): { sensors: DetectablePclSensor[]; unusedIdSensor: number } {
  const receiver = detectableRx.receiver;
  const txById = new Map(fmTransmitters.map((tx) => [tx.id, tx]));
  const existingIdByTxId = new Map(
    existingSensors
      .filter((d) => d.sensor.receiver.id === receiverId)
      .map((d) => [d.sensor.transmitter.id, d.sensor.id]),
  );

  let nextId = unusedIdSensor;
  const sensorsForReceiver: DetectablePclSensor[] = [];
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
      target_id: detectableRx.target_id,
      rcs: detectableRx.rcs,
      sensor: {
        id,
        transmitter: tx,
        receiver,
        error_model: {
          min_bistatic_range_uncertainty: 0,
          max_bistatic_range_uncertainty: 0,
          min_doppler_uncertainty: 0,
          max_doppler_uncertainty: 0,
        },
      },
    });
  }

  const otherSensors = existingSensors.filter(
    (d) => d.sensor.receiver.id !== receiverId,
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
  monostatic_sensors: DetectableMonostaticSensor[];
  pcl_sensors: DetectablePclSensor[];
  pcl_receivers: DetectablePclReceiver[];
  pcl_transmitter_ids: [number, number[]][];
  pcl_tx_criteria: [number, PclTxSelectionCriteria][];
  effectors: DetectableEffector[];
  unused_id_sensor: number;
  unused_id_receiver: number;
  unused_id_transmitter: number;
  unused_id_effector: number;
  unused_target_id: number;
};

export function serializeScenarioState(
  state: ScenarioStore,
): SerializedScenarioState {
  return {
    monostatic_sensors: state.blueMonostaticSensors,
    pcl_sensors: state.pclSensors,
    pcl_receivers: state.pclReceivers,
    pcl_transmitter_ids: Array.from(state.pclTransmitterIds.entries()).map(
      ([receiverId, ids]): [number, number[]] => [receiverId, Array.from(ids)],
    ),
    pcl_tx_criteria: Array.from(state.pclTxCriteria.entries()),
    effectors: state.effectors,
    unused_id_sensor: state.unusedIdSensor,
    unused_id_receiver: state.unusedIdReceiver,
    unused_id_transmitter: state.unusedIdTransmitter,
    unused_id_effector: state.unusedIdEffector,
    unused_target_id: state.unusedTargetId,
  };
}

function hasTargetId(item: object): item is { target_id: number; rcs: number } {
  return "target_id" in item;
}

export function deserializeScenarioState(
  data: SerializedScenarioState,
): Partial<ScenarioStore> {
  // Save files written before target_id/rcs existed have bare entities in
  // these three arrays instead of the Detectable* wrapper. That mismatch is
  // only visible at runtime (the file is loaded via an unchecked JSON.parse
  // cast in ImportButton.tsx), so this backfills target_id/rcs for any item
  // that doesn't already have them, minting target_ids from a single counter
  // shared across all three lists in a fixed order: monostatic sensors, then
  // PCL receivers, then effectors.
  let nextTargetId = data.unused_target_id ?? 0;

  const monostaticSensors = (data.monostatic_sensors ?? []).map(
    (item): DetectableMonostaticSensor =>
      hasTargetId(item)
        ? item
        : {
            target_id: nextTargetId++,
            rcs: DEFAULT_RCS,
            sensor:
              item as unknown as SerializedScenarioState["monostatic_sensors"][number]["sensor"],
          },
  );
  const pclReceivers = (data.pcl_receivers ?? []).map(
    (item): DetectablePclReceiver =>
      hasTargetId(item)
        ? item
        : {
            target_id: nextTargetId++,
            rcs: DEFAULT_RCS,
            receiver: item as unknown as Receiver,
          },
  );

  // A PclSensor's target_id/rcs always mirror its receiver's (both refer to
  // the same physical receiver), so legacy rows are backfilled by lookup
  // here rather than minting a new target_id from the counter.
  const targetIdByReceiverId = new Map(
    pclReceivers.map((d) => [d.receiver.id, d]),
  );
  const pclSensors = (data.pcl_sensors ?? []).map(
    (item): DetectablePclSensor => {
      if (hasTargetId(item)) {
        return item;
      }
      const sensor =
        item as unknown as DetectablePclSensor["sensor"];
      const detectableRx = targetIdByReceiverId.get(sensor.receiver.id);
      return {
        target_id: detectableRx?.target_id ?? nextTargetId++,
        rcs: detectableRx?.rcs ?? DEFAULT_RCS,
        sensor,
      };
    },
  );

  const effectors = (data.effectors ?? []).map(
    (item): DetectableEffector =>
      hasTargetId(item)
        ? item
        : {
            target_id: nextTargetId++,
            rcs: DEFAULT_RCS,
            effector: item as unknown as DetectableEffector["effector"],
          },
  );

  return {
    blueMonostaticSensors: monostaticSensors,
    pclSensors,
    pclReceivers,
    pclTransmitterIds: new Map(
      (data.pcl_transmitter_ids ?? []).map(([receiverId, ids]) => [
        receiverId,
        new Set(ids),
      ]),
    ),
    pclTxCriteria: new Map(data.pcl_tx_criteria ?? []),
    effectors,
    unusedIdSensor: data.unused_id_sensor,
    unusedIdReceiver: data.unused_id_receiver,
    unusedIdTransmitter: data.unused_id_transmitter,
    unusedIdEffector: data.unused_id_effector ?? 0,
    unusedTargetId: nextTargetId,
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
  unusedTargetId: 0,

  addMonostaticSensor: (detectableSensor, isBlue) =>
    set((state) => {
      const sensor = detectableSensor.sensor;
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

      const newSensors = [...oldSensors, detectableSensor];
      const counters = {
        unusedIdSensor: Math.max(state.unusedIdSensor, sensor.id + 1),
        unusedIdReceiver: Math.max(
          state.unusedIdReceiver,
          sensor.receiver.id + 1,
        ),
        unusedIdTransmitter: Math.max(
          state.unusedIdTransmitter,
          sensor.transmitter.id + 1,
        ),
        unusedTargetId: Math.max(
          state.unusedTargetId,
          detectableSensor.target_id + 1,
        ),
      };

      if (isBlue) {
        return { blueMonostaticSensors: newSensors, ...counters };
      } else {
        return { redMonostaticSensors: newSensors, ...counters };
      }
    }),
  addEffector: (detectableEffector) =>
    set((state) => {
      return {
        effectors: [...state.effectors, detectableEffector],
        unusedIdEffector: Math.max(
          state.unusedIdEffector,
          detectableEffector.effector.id + 1,
        ),
        unusedTargetId: Math.max(
          state.unusedTargetId,
          detectableEffector.target_id + 1,
        ),
      };
    }),
  updateEffector: (effector) =>
    set((state) => {
      const i = state.effectors.findIndex(
        (e) => e.effector.id === effector.effector.id,
      );
      const newEffectors = structuredClone(state.effectors);
      newEffectors[i] = effector;
      return {
        effectors: newEffectors,
      };
    }),
  deleteEffector: (effectorId) =>
    set((state) => {
      const newEffectors = state.effectors.filter(
        (e) => e.effector.id !== effectorId,
      );
      return { effectors: newEffectors };
    }),
  deleteReceiver: (receiverId: number, isBlue: boolean) =>
    set((state) => {
      // Monostatic sensors: Delete coverage results and the sensor itself.
      const sensorIds = new Set(
        state.blueMonostaticSensors
          .filter((sensor) => sensor.sensor.receiver.id === receiverId)
          .map((sensor) => sensor.sensor.id),
      );
      for (const sensorId of sensorIds) {
        useSimulationStore.getState().deleteSensor(sensorId);
      }
      if (isBlue) {
        return {
          blueMonostaticSensors: state.blueMonostaticSensors.filter(
            (sensor) => !sensorIds.has(sensor.sensor.id),
          ),
        };
      } else {
        return {
          redMonostaticSensors: state.redMonostaticSensors.filter(
            (sensor) => !sensorIds.has(sensor.sensor.id),
          ),
        };
      }
    }),
  updateMonostaticSensor: (detectableSensor, _isBlue: boolean) =>
    set((state) => {
      const index = state.blueMonostaticSensors.findIndex(
        (s) => s.sensor.id == detectableSensor.sensor.id,
      );

      if (index < 0) {
        throw new Error("Cannot edit sensor that does not exist!");
      }

      // TODO: Backend has inconsistency between antenna gain of Rx and Tx.
      // Fix it when the backend fixed it. Until then, hardcode the rule.
      detectableSensor.sensor.transmitter.antenna_gain = calculateAntennaGain(
        detectableSensor.sensor.receiver.diameter,
        detectableSensor.sensor.transmitter.frequency,
        detectableSensor.sensor.transmitter.antenna_efficiency_value,
      );

      const newSensors = structuredClone(state.blueMonostaticSensors);
      newSensors[index] = detectableSensor;
      return { blueMonostaticSensors: newSensors };
    }),

  addPclReceiver: async (
    detectableRx: DetectablePclReceiver,
    criteria: PclTxSelectionCriteria,
  ) => {
    const fmTransmitters = useGuiStateStore.getState().fmTransmitters;
    const rx = detectableRx.receiver;
    const initialIds = new Set<number>();

    set((state) => {
      const { sensors, unusedIdSensor } = rebuildPclSensorsFor(
        rx.id,
        detectableRx,
        initialIds,
        fmTransmitters,
        state.pclSensors,
        state.unusedIdSensor,
      );
      for (const d of sensors.filter((d) => d.sensor.receiver.id === rx.id)) {
        useGuiStateStore.getState().showSensor(d.sensor.id);
      }

      const newTransmitterIds = structuredClone(state.pclTransmitterIds);
      newTransmitterIds.set(rx.id, initialIds);
      const newCriteria = structuredClone(state.pclTxCriteria);
      newCriteria.set(rx.id, criteria);

      return {
        pclReceivers: [...state.pclReceivers, detectableRx],
        pclSensors: sensors,
        pclTransmitterIds: newTransmitterIds,
        pclTxCriteria: newCriteria,
        unusedIdSensor,
        unusedIdReceiver: Math.max(state.unusedIdReceiver, rx.id + 1),
        unusedTargetId: Math.max(
          state.unusedTargetId,
          detectableRx.target_id + 1,
        ),
      };
    });
  },

  updatePclReceiverSettings: (detectableRx: DetectablePclReceiver) =>
    set((state) => {
      const rx = detectableRx.receiver;
      const index = state.pclReceivers.findIndex(
        (r) => r.receiver.id === rx.id,
      );
      if (index < 0) {
        throw new Error("Cannot edit receiver that does not exist!");
      }
      const newReceivers = structuredClone(state.pclReceivers);
      newReceivers[index] = detectableRx;

      const transmitterIds =
        state.pclTransmitterIds.get(rx.id) ?? new Set<number>();
      const { sensors, unusedIdSensor } = rebuildPclSensorsFor(
        rx.id,
        detectableRx,
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
      const detectableRx = state.pclReceivers.find(
        (r) => r.receiver.id === receiverId,
      );
      if (!detectableRx) {
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
        detectableRx,
        newIds,
        useGuiStateStore.getState().fmTransmitters,
        state.pclSensors,
        state.unusedIdSensor,
      );
      for (const d of sensors.filter(
        (d) => d.sensor.receiver.id === receiverId,
      )) {
        useGuiStateStore.getState().showSensor(d.sensor.id);
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
    const detectableRx = state.pclReceivers.find(
      (r) => r.receiver.id === receiverId,
    );
    const criteria = state.pclTxCriteria.get(receiverId);
    if (!detectableRx || !criteria) {
      throw new Error(
        "Cannot select transmitters for receiver that does not exist!",
      );
    }
    const fmTransmitters = useGuiStateStore.getState().fmTransmitters;
    const matchingIds = await matchingTransmitterIds(
      detectableRx.receiver.point,
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
        detectableRx,
        newIds,
        fmTransmitters,
        state.pclSensors,
        state.unusedIdSensor,
      );
      for (const d of sensors.filter(
        (d) => d.sensor.receiver.id === receiverId,
      )) {
        useGuiStateStore.getState().showSensor(d.sensor.id);
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
          .filter((d) => d.sensor.receiver.id === receiverId)
          .map((d) => d.sensor.id),
      );
      for (const sensorId of sensorIds) {
        useSimulationStore.getState().deleteSensor(sensorId);
      }

      const newTransmitterIds = structuredClone(state.pclTransmitterIds);
      newTransmitterIds.delete(receiverId);
      const newCriteria = structuredClone(state.pclTxCriteria);
      newCriteria.delete(receiverId);

      return {
        pclReceivers: state.pclReceivers.filter(
          (r) => r.receiver.id !== receiverId,
        ),
        pclSensors: state.pclSensors.filter(
          (d) => !sensorIds.has(d.sensor.id),
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
