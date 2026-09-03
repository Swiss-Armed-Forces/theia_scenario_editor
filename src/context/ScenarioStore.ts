import { create } from "zustand";
import type {
  DetectableMonostaticSensor,
  DetectablePclReceiver,
  DetectablePclSensor,
  DroneSwarm,
  DroneSwarmFactory,
  Gbad,
  Missile,
  Receiver,
  Transmitter,
} from "../types/types";
import { DEFAULT_RCS } from "../types/types";
import { useGuiStateStore } from "./GuiStateStore";
import { useSimulationStore } from "./SimulationResultStore";
import { lineOfSightDistance } from "../backend/backend";
import {
  buildDroneSwarmFactory,
  droneSwarmFromFactory,
} from "../util/swarmTrajectory";

export type PclTxSelectionCriteria = { min_power: number; max_dist: number };

export interface ScenarioStore {
  monostaticSensors: DetectableMonostaticSensor[];
  pclSensors: DetectablePclSensor[];
  pclReceivers: DetectablePclReceiver[];
  pclTransmitterIds: Map<number, Set<number>>;
  pclTxCriteria: Map<number, PclTxSelectionCriteria>;
  gbads: Gbad[];
  ballisticMissiles: Missile[];
  droneSwarms: DroneSwarm[];
  unusedIdSensor: number;
  unusedIdReceiver: number;
  unusedIdTransmitter: number;
  unusedIdEffector: number;
  unusedTargetId: number;
  addMonostaticSensor: (sensor: DetectableMonostaticSensor) => void;
  addPclReceiver: (
    rx: DetectablePclReceiver,
    criteria: PclTxSelectionCriteria,
  ) => Promise<void>;
  addGbad: (gbad: Gbad) => void;
  updateGbad: (gbad: Gbad) => void;
  deleteGbad: (gbadId: number) => void;
  addMissile: (missile: Missile) => void;
  updateMissile: (missile: Missile) => void;
  deleteMissile: (targetId: number) => void;
  addDroneSwarm: (droneSwarm: DroneSwarm) => void;
  updateDroneSwarm: (droneSwarm: DroneSwarm) => void;
  deleteDroneSwarm: (targetId: number) => void;
  updatePclReceiverSettings: (rx: DetectablePclReceiver) => void;
  updatePclTxCriteria: (
    receiverId: number,
    criteria: PclTxSelectionCriteria,
  ) => void;
  togglePclTransmitter: (receiverId: number, transmitterId: number) => void;
  selectAllMatchingCriteria: (receiverId: number) => Promise<void>;
  deletePclReceiver: (receiverId: number) => void;
  deleteReceiver: (receiverId: number) => void;
  updateMonostaticSensor: (sensor: DetectableMonostaticSensor) => void;
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
//
// This mirrors src/types/orbat_file_schema.json's OrderOfBattle exactly: a
// flat object, no pcl_receivers/pcl_transmitter_ids/pcl_tx_criteria (those
// are derived from pcl_sensors on load instead - see deserializeScenarioState),
// and no separate missile id/name (missiles are identified by target_id alone).
export type SerializedScenarioState = {
  monostatic_sensors: DetectableMonostaticSensor[];
  pcl_sensors: DetectablePclSensor[];
  gbads: Gbad[];
  oneway_drones: unknown[];
  ballistic_missiles: Missile[];
  drone_swarms: DroneSwarmFactory[];
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
    monostatic_sensors: state.monostaticSensors,
    pcl_sensors: state.pclSensors,
    gbads: state.gbads,
    oneway_drones: [],
    ballistic_missiles: state.ballisticMissiles,
    drone_swarms: state.droneSwarms.map(buildDroneSwarmFactory),
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
  // these arrays instead of the Detectable* wrapper. That mismatch is
  // only visible at runtime (the file is loaded via an unchecked JSON.parse
  // cast in ImportButton.tsx), so this backfills target_id/rcs for any item
  // that doesn't already have them, minting target_ids from a single counter
  // shared across all lists in a fixed order: monostatic sensors, then PCL
  // sensors (one per not-yet-seen receiver), then gbads.
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

  // Legacy pre-target_id PCL sensor entries have no separate receiver list to
  // borrow a target_id from anymore (pcl_receivers isn't persisted), so a
  // fresh target_id is minted per not-yet-seen receiver id here instead.
  const legacyTargetIdByReceiverId = new Map<number, number>();
  const pclSensors = (data.pcl_sensors ?? []).map(
    (item): DetectablePclSensor => {
      if (hasTargetId(item)) {
        return item;
      }
      const sensor = item as unknown as DetectablePclSensor["sensor"];
      const receiverId = sensor.receiver.id;
      let target_id = legacyTargetIdByReceiverId.get(receiverId);
      if (target_id === undefined) {
        target_id = nextTargetId++;
        legacyTargetIdByReceiverId.set(receiverId, target_id);
      }
      return { target_id, rcs: DEFAULT_RCS, sensor };
    },
  );

  const gbads = (data.gbads ?? []).map(
    (item): Gbad =>
      hasTargetId(item)
        ? item
        : {
            target_id: nextTargetId++,
            rcs: DEFAULT_RCS,
            gbad: item as unknown as Gbad["gbad"],
          },
  );

  // ballistic_missiles already carry target_id/effector_id/rcs directly -
  // no Detectable*-style wrapper or legacy backfill applies to missiles.
  const ballisticMissiles = data.ballistic_missiles ?? [];

  const droneSwarms = (data.drone_swarms ?? []).map(droneSwarmFromFactory);

  // pcl_receivers/pcl_transmitter_ids aren't persisted (each PclSensorFactory
  // entry already carries the full receiver plus its target_id/rcs, which
  // are identical across every entry for the same receiver - see
  // rebuildPclSensorsFor), so both are reconstructed here instead of parsed.
  const pclReceiverByReceiverId = new Map<number, DetectablePclReceiver>();
  const transmitterIdsByReceiverId = new Map<number, Set<number>>();
  for (const { target_id, rcs, sensor } of pclSensors) {
    const receiverId = sensor.receiver.id;
    if (!pclReceiverByReceiverId.has(receiverId)) {
      pclReceiverByReceiverId.set(receiverId, {
        target_id,
        rcs,
        receiver: sensor.receiver,
      });
    }
    const ids = transmitterIdsByReceiverId.get(receiverId) ?? new Set<number>();
    ids.add(sensor.transmitter.id);
    transmitterIdsByReceiverId.set(receiverId, ids);
  }

  return {
    monostaticSensors,
    pclSensors,
    pclReceivers: Array.from(pclReceiverByReceiverId.values()),
    pclTransmitterIds: transmitterIdsByReceiverId,
    // Auto-selection criteria aren't persisted - not needed to reload the
    // sensors, so this always comes back empty.
    pclTxCriteria: new Map(),
    gbads,
    ballisticMissiles,
    droneSwarms,
    unusedIdSensor: data.unused_id_sensor,
    unusedIdReceiver: data.unused_id_receiver,
    unusedIdTransmitter: data.unused_id_transmitter,
    unusedIdEffector: data.unused_id_effector ?? 0,
    unusedTargetId: nextTargetId,
  };
}

export const useScenarioStore = create<ScenarioStore>((set, get) => ({
  monostaticSensors: [],
  pclSensors: [],
  pclReceivers: [],
  pclTransmitterIds: new Map<number, Set<number>>(),
  pclTxCriteria: new Map<number, PclTxSelectionCriteria>(),
  gbads: [],
  ballisticMissiles: [],
  droneSwarms: [],
  unusedIdSensor: 0,
  unusedIdReceiver: 0,
  unusedIdTransmitter: 0,
  unusedIdEffector: 0,
  unusedTargetId: 0,

  addMonostaticSensor: (detectableSensor) =>
    set((state) => {
      const sensor = detectableSensor.sensor;
      useGuiStateStore.getState().showSensor(sensor.id);

      // TODO: Backend has inconsistency between antenna gain of Rx and Tx.
      // Fix it when the backend fixed it. Until then, hardcode the rule.
      sensor.transmitter.antenna_gain = calculateAntennaGain(
        sensor.receiver.diameter,
        sensor.transmitter.frequency,
        sensor.transmitter.antenna_efficiency_value,
      );

      return {
        monostaticSensors: [...state.monostaticSensors, detectableSensor],
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
    }),
  addGbad: (gbad) =>
    set((state) => {
      return {
        gbads: [...state.gbads, gbad],
        unusedIdEffector: Math.max(state.unusedIdEffector, gbad.gbad.id + 1),
        unusedTargetId: Math.max(state.unusedTargetId, gbad.target_id + 1),
      };
    }),
  updateGbad: (gbad) =>
    set((state) => {
      const i = state.gbads.findIndex((g) => g.gbad.id === gbad.gbad.id);
      const newGbads = structuredClone(state.gbads);
      newGbads[i] = gbad;
      return {
        gbads: newGbads,
      };
    }),
  deleteGbad: (gbadId) =>
    set((state) => {
      const newGbads = state.gbads.filter((g) => g.gbad.id !== gbadId);
      return { gbads: newGbads };
    }),
  addMissile: (missile) =>
    set((state) => {
      return {
        ballisticMissiles: [...state.ballisticMissiles, missile],
        unusedTargetId: Math.max(state.unusedTargetId, missile.target_id + 1),
        unusedIdEffector: Math.max(
          state.unusedIdEffector,
          missile.effector_id + 1,
        ),
      };
    }),
  updateMissile: (missile) =>
    set((state) => {
      const i = state.ballisticMissiles.findIndex(
        (m) => m.target_id === missile.target_id,
      );
      const newMissiles = structuredClone(state.ballisticMissiles);
      newMissiles[i] = missile;
      return {
        ballisticMissiles: newMissiles,
      };
    }),
  deleteMissile: (targetId) =>
    set((state) => {
      const newMissiles = state.ballisticMissiles.filter(
        (m) => m.target_id !== targetId,
      );
      return { ballisticMissiles: newMissiles };
    }),
  addDroneSwarm: (droneSwarm) =>
    set((state) => {
      return {
        droneSwarms: [...state.droneSwarms, droneSwarm],
        unusedTargetId: Math.max(
          state.unusedTargetId,
          droneSwarm.target_id + 1,
        ),
      };
    }),
  updateDroneSwarm: (droneSwarm) =>
    set((state) => {
      const i = state.droneSwarms.findIndex(
        (d) => d.target_id === droneSwarm.target_id,
      );
      const newDroneSwarms = structuredClone(state.droneSwarms);
      newDroneSwarms[i] = droneSwarm;
      return { droneSwarms: newDroneSwarms };
    }),
  deleteDroneSwarm: (targetId) =>
    set((state) => {
      const newDroneSwarms = state.droneSwarms.filter(
        (d) => d.target_id !== targetId,
      );
      return { droneSwarms: newDroneSwarms };
    }),
  deleteReceiver: (receiverId: number) =>
    set((state) => {
      // Monostatic sensors: Delete coverage results and the sensor itself.
      const sensorIds = new Set(
        state.monostaticSensors
          .filter((sensor) => sensor.sensor.receiver.id === receiverId)
          .map((sensor) => sensor.sensor.id),
      );
      for (const sensorId of sensorIds) {
        useSimulationStore.getState().deleteSensor(sensorId);
      }
      return {
        monostaticSensors: state.monostaticSensors.filter(
          (sensor) => !sensorIds.has(sensor.sensor.id),
        ),
      };
    }),
  updateMonostaticSensor: (detectableSensor) =>
    set((state) => {
      const index = state.monostaticSensors.findIndex(
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

      const newSensors = structuredClone(state.monostaticSensors);
      newSensors[index] = detectableSensor;
      return { monostaticSensors: newSensors };
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
