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
// effectors, ...) with the computed coverage results, so a load can restore
// coverage exactly as it was calculated rather than requiring the user to
// recalculate it after every import. The coverage results live inside
// static_dispositive since they're derived from the stationary sensors.
export type SerializedFile = Omit<SerializedScenarioState, "static_dispositive"> & {
  static_dispositive: SerializedScenarioState["static_dispositive"] & {
    simulationResults?: SerializedSimulationState;
  };
};

export function serializeFile(): SerializedFile {
  const scenario = serializeScenarioState(useScenarioStore.getState());
  return {
    ...scenario,
    static_dispositive: {
      ...scenario.static_dispositive,
      simulationResults: serializeSimulationState(
        useSimulationStore.getState(),
      ),
    },
  };
}

export function deserializeFile(data: SerializedFile): {
  scenario: Partial<ScenarioStore>;
  simulation: Partial<SimulationStore>;
} {
  return {
    scenario: deserializeScenarioState(data),
    simulation: deserializeSimulationState(
      data.static_dispositive?.simulationResults,
    ),
  };
}
