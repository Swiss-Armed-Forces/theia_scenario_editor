import { useGuiStateStore } from "../context/GuiStateStore";
import { useScenarioStore } from "../context/ScenarioStore";
import type { MissileCategory, Point } from "../types/types";
import { MISSILE_CATEGORIES, MISSILE_CATEGORY_LABELS } from "../types/types";
import PositionSelector from "./PositionSelector";
import { fromDatetimeLocalValue, toDatetimeLocalValue } from "../util/datetime";

export default function MissileSettings() {
  const selectedMissileTargetId = useGuiStateStore(
    (state) => state.selectedMissileTargetId,
  );
  const missile = useScenarioStore((state) => state.ballisticMissiles).find(
    (m) => m.target_id === selectedMissileTargetId,
  );
  const terrainModels = useGuiStateStore((state) => state.terrainModels);

  const updateMissile = useScenarioStore((state) => state.updateMissile);

  if (!missile) {
    return null;
  }

  return (
    <fieldset className="SensorSettingsContainer">
      <legend>Ballistic Missile Settings</legend>
      <>
        <label>Category</label>
        <select
          value={missile.category}
          onChange={(event) => {
            const newMissile = structuredClone(missile);
            newMissile.category = event.target.value as MissileCategory;
            updateMissile(newMissile);
          }}
        >
          {!(MISSILE_CATEGORIES as readonly string[]).includes(
            missile.category,
          ) && (
            <option value={missile.category}>
              {MISSILE_CATEGORY_LABELS[missile.category]}
            </option>
          )}
          {MISSILE_CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {MISSILE_CATEGORY_LABELS[category]}
            </option>
          ))}
        </select>
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
    </fieldset>
  );
}
