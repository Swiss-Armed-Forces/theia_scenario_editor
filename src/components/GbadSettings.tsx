import { useGuiStateStore } from "../context/GuiStateStore";
import { useScenarioStore } from "../context/ScenarioStore";
import { EFFECTOR_ALTITUDE_OFFSET, type Point } from "../types/types";
import PositionSelector from "./PositionSelector";

export default function GbadSettings() {
  const selectedGbadId = useGuiStateStore((state) => state.selectedGbadId);
  const gbad = useScenarioStore((state) => state.gbads).find(
    (g) => g.gbad.id === selectedGbadId,
  );

  const updateGbad = useScenarioStore((state) => state.updateGbad);

  if (!gbad) {
    return null;
  }

  const effector = gbad.gbad;
  return (
    <fieldset className="SensorSettingsContainer">
      <legend>Effector Settings</legend>
      <>
        <label>Name</label>
        <input
          type="text"
          value={effector.name}
          onChange={(event) => {
            const newGbad = structuredClone(gbad);
            newGbad.gbad.name = event.target.value;
            updateGbad(newGbad);
          }}
        />
        <label>Position</label>
        <PositionSelector
          point={effector.point}
          setPoint={(p: Point) => {
            const newGbad = structuredClone(gbad);
            newGbad.gbad.point = p;
            // Avoid problems during LOS check when
            // an effector lies exactly on the earth's surface.
            newGbad.gbad.point.alt += EFFECTOR_ALTITUDE_OFFSET;
            updateGbad(newGbad);
          }}
        />
        <label>RCS [m²]</label>
        <input
          type="number"
          value={gbad.rcs}
          onChange={(event) => {
            const value = parseFloat(event.target.value);
            const newGbad = structuredClone(gbad);
            newGbad.rcs = value;
            updateGbad(newGbad);
          }}
        />
        <label>Combat range [m]</label>
        <input
          type="number"
          value={effector.combat_range}
          onChange={(event) => {
            const value = parseFloat(event.target.value);
            const newGbad = structuredClone(gbad);
            newGbad.gbad.combat_range = value;
            updateGbad(newGbad);
          }}
        />
        <label>N attacks left</label>
        <input
          type="number"
          value={effector.n_attacks_left}
          onChange={(event) => {
            const value = parseInt(event.target.value);
            const newGbad = structuredClone(gbad);
            newGbad.gbad.n_attacks_left = value;
            updateGbad(newGbad);
          }}
        />
        <label>Cadence [shots/s]</label>
        <input
          type="number"
          value={effector.cadence}
          onChange={(event) => {
            const value = parseFloat(event.target.value);
            const newGbad = structuredClone(gbad);
            newGbad.gbad.cadence = value;
            updateGbad(newGbad);
          }}
        />
      </>
    </fieldset>
  );
}
