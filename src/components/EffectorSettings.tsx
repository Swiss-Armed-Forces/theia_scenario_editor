import { useGuiStateStore } from "../context/GuiStateStore";
import { useScenarioStore } from "../context/ScenarioStore";
import { EFFECTOR_ALTITUDE_OFFSET, type Point } from "../types/types";
import PositionSelector from "./PositionSelector";

export default function EffectorSettings() {
  const selectedEffectorId = useGuiStateStore(
    (state) => state.selectedEffectorId,
  );
  const detectableEffector = useScenarioStore((state) => state.effectors).find(
    (d) => d.effector.id === selectedEffectorId,
  );

  const updateEffector = useScenarioStore((state) => state.updateEffector);

  let content = <></>;
  if (detectableEffector) {
    const effector = detectableEffector.effector;
    content = (
      <>
        <label>Name</label>
        <input
          type="text"
          value={effector.name}
          onChange={(event) => {
            const newDetectableEffector = structuredClone(detectableEffector);
            newDetectableEffector.effector.name = event.target.value;
            updateEffector(newDetectableEffector);
          }}
        />
        <label>Position</label>
        <PositionSelector
          point={effector.point}
          setPoint={(p: Point) => {
            const newDetectableEffector = structuredClone(detectableEffector);
            newDetectableEffector.effector.point = p;
            // Avoid problems during LOS check when
            // an effector lies exactly on the earth's surface.
            newDetectableEffector.effector.point.alt += EFFECTOR_ALTITUDE_OFFSET;
            updateEffector(newDetectableEffector);
          }}
        />
        <label>RCS [m²]</label>
        <input
          type="number"
          value={detectableEffector.rcs}
          onChange={(event) => {
            const value = parseFloat(event.target.value);
            const newDetectableEffector = structuredClone(detectableEffector);
            newDetectableEffector.rcs = value;
            updateEffector(newDetectableEffector);
          }}
        />
        <label>Combat range [m]</label>
        <input
          type="number"
          value={effector.combat_range}
          onChange={(event) => {
            const value = parseFloat(event.target.value);
            const newDetectableEffector = structuredClone(detectableEffector);
            newDetectableEffector.effector.combat_range = value;
            updateEffector(newDetectableEffector);
          }}
        />
        <label>N attacks left</label>
        <input
          type="number"
          value={effector.n_attacks_left}
          onChange={(event) => {
            const value = parseInt(event.target.value);
            const newDetectableEffector = structuredClone(detectableEffector);
            newDetectableEffector.effector.n_attacks_left = value;
            updateEffector(newDetectableEffector);
          }}
        />
        <label>Cadence [shots/s]</label>
        <input
          type="number"
          value={effector.cadence}
          onChange={(event) => {
            const value = parseFloat(event.target.value);
            const newDetectableEffector = structuredClone(detectableEffector);
            newDetectableEffector.effector.cadence = value;
            updateEffector(newDetectableEffector);
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
