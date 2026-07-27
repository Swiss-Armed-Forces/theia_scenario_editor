import { useGuiStateStore } from "../context/GuiStateStore";
import { useScenarioStore } from "../context/ScenarioStore";
import type { Point } from "../types/types";
import PositionSelector from "./PositionSelector";

export default function EffectorSettings() {
  const selectedEffectorId = useGuiStateStore(
    (state) => state.selectedEffectorId,
  );
  const effector = useScenarioStore((state) => state.effectors).find(
    (effector) => effector.id === selectedEffectorId,
  );

  const updateEffector = useScenarioStore((state) => state.updateEffector);

  let content = <></>;
  if (effector) {
    content = (
      <>
        <label>Name</label>
        <input
          type="text"
          value={effector.name}
          onChange={(event) => {
            const newEffector = structuredClone(effector);
            newEffector.name = event.target.value;
            updateEffector(newEffector);
          }}
        />
        <label>Position</label>
        <PositionSelector
          point={effector.point}
          setPoint={(p: Point) => {
            const newEffector = structuredClone(effector);
            newEffector.point = p;
            updateEffector(newEffector);
          }}
        />
        <label>Combat range [m]</label>
        <input
          type="number"
          value={effector.combat_range}
          onChange={(event) => {
            const value = parseFloat(event.target.value);
            const newEffector = structuredClone(effector);
            newEffector.combat_range = value;
            updateEffector(newEffector);
          }}
        />
        <label>N attacks left</label>
        <input
          type="number"
          value={effector.n_attacks_left}
          onChange={(event) => {
            const value = parseInt(event.target.value);
            const newEffector = structuredClone(effector);
            newEffector.n_attacks_left = value;
            updateEffector(newEffector);
          }}
        />
      </>
    );
  }

  return (
    <fieldset
      className="SensorSettingsContainer"
      style={{ maxHeight: "30%", overflow: "scroll" }}
    >
      <legend>Effector Settings</legend>
      {content}
    </fieldset>
  );
}
