import { useGuiStateStore } from "../context/GuiStateStore";
import { useScenarioStore } from "../context/ScenarioStore";
import type { Point } from "../types/types";
import PositionSelector from "./PositionSelector";

export default function CriticalInfrastructureSettings() {
  const selectedTargetId = useGuiStateStore(
    (state) => state.selectedCriticalInfrastructureTargetId,
  );
  const infra = useScenarioStore((state) => state.criticalInfrastructure).find(
    (c) => c.target_id === selectedTargetId,
  );

  const updateCriticalInfrastructure = useScenarioStore(
    (state) => state.updateCriticalInfrastructure,
  );

  if (!infra) {
    return null;
  }

  return (
    <fieldset className="SensorSettingsContainer">
      <legend>Critical Infrastructure Settings</legend>
      <>
        <label>Name</label>
        <input
          type="text"
          value={infra.name}
          onChange={(event) => {
            const newInfra = structuredClone(infra);
            newInfra.name = event.target.value;
            updateCriticalInfrastructure(newInfra);
          }}
        />
        <label>Position</label>
        <PositionSelector
          point={infra.point}
          setPoint={(p: Point) => {
            const newInfra = structuredClone(infra);
            newInfra.point = p;
            updateCriticalInfrastructure(newInfra);
          }}
        />
      </>
    </fieldset>
  );
}
