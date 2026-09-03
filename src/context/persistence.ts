import {
  deserializeScenarioState,
  serializeScenarioState,
  useScenarioStore,
  type ScenarioStore,
  type SerializedScenarioState,
} from "./ScenarioStore";
import {
  deserializeSimulationState,
  serializeSimulationState,
  useSimulationStore,
  type SerializedSimulationState,
  type SimulationStore,
} from "./SimulationResultStore";

// The save file combines the authored scenario (sensors, receivers,
// gbads, ...) with the computed coverage results, so a load can restore
// coverage exactly as it was calculated rather than requiring the user to
// recalculate it after every import. This mirrors orbat_file_schema.json's
// OrderOfBattle exactly: flat, with simulationResults at the top level.
export type SerializedFile = SerializedScenarioState & {
  simulationResults: SerializedSimulationState;
};

export function serializeFile(): SerializedFile {
  return {
    ...serializeScenarioState(useScenarioStore.getState()),
    simulationResults: serializeSimulationState(useSimulationStore.getState()),
  };
}

export function deserializeFile(data: SerializedFile): {
  scenario: Partial<ScenarioStore>;
  simulation: Partial<SimulationStore>;
} {
  return {
    scenario: deserializeScenarioState(data),
    simulation: deserializeSimulationState(data.simulationResults),
  };
}
