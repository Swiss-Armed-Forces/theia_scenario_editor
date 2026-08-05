import { useGuiStateStore } from "../context/GuiStateStore";
import { useScenarioStore } from "../context/ScenarioStore";
import type { Point } from "../types/types";
import PositionSelector from "./PositionSelector";

// <input type="datetime-local"> works in local time with no timezone
// suffix, while t_start is persisted as a UTC ISO string; these convert
// between the two without losing the user's intended wall-clock time.
function toDatetimeLocalValue(iso: string): string {
  const date = new Date(iso);
  const localTime = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localTime.toISOString().slice(0, 16);
}

function fromDatetimeLocalValue(value: string): string {
  return new Date(value).toISOString();
}

export default function MissileSettings() {
  const selectedMissileId = useGuiStateStore(
    (state) => state.selectedMissileId,
  );
  const missile = useScenarioStore((state) => state.ballisticMissiles).find(
    (m) => m.id === selectedMissileId,
  );
  const terrainModels = useGuiStateStore((state) => state.terrainModels);

  const updateMissile = useScenarioStore((state) => state.updateMissile);

  let content = <></>;
  if (missile) {
    content = (
      <>
        <label>Name</label>
        <input
          type="text"
          value={missile.name}
          onChange={(event) => {
            const newMissile = structuredClone(missile);
            newMissile.name = event.target.value;
            updateMissile(newMissile);
          }}
        />
        <label>Start position</label>
        <PositionSelector
          point={missile.p_start}
          setPoint={(p: Point) => {
            const newMissile = structuredClone(missile);
            newMissile.p_start = p;
            updateMissile(newMissile);
          }}
        />
        <label>Stop position</label>
        <PositionSelector
          point={missile.p_stop}
          setPoint={(p: Point) => {
            const newMissile = structuredClone(missile);
            newMissile.p_stop = p;
            updateMissile(newMissile);
          }}
        />
        <label>Launch time</label>
        <input
          type="datetime-local"
          value={toDatetimeLocalValue(missile.t_start)}
          onChange={(event) => {
            if (!event.target.value) {
              return;
            }
            const newMissile = structuredClone(missile);
            newMissile.t_start = fromDatetimeLocalValue(event.target.value);
            updateMissile(newMissile);
          }}
        />
        <label>Terrain</label>
        <select
          value={missile.terrain.terrain_name}
          onChange={(event) => {
            const newMissile = structuredClone(missile);
            newMissile.terrain = { terrain_name: event.target.value };
            updateMissile(newMissile);
          }}
        >
          {!terrainModels.includes(missile.terrain.terrain_name) && (
            <option value={missile.terrain.terrain_name}>
              {missile.terrain.terrain_name}
            </option>
          )}
          {terrainModels.map((terrain) => (
            <option key={terrain} value={terrain}>
              {terrain}
            </option>
          ))}
        </select>
        <label>RCS [m²]</label>
        <input
          type="number"
          value={missile.rcs}
          onChange={(event) => {
            const value = parseFloat(event.target.value);
            const newMissile = structuredClone(missile);
            newMissile.rcs = value;
            updateMissile(newMissile);
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
      <legend>Missile Settings</legend>
      {content}
    </fieldset>
  );
}
