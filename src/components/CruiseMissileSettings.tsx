import { useState } from "react";
import { useGuiStateStore } from "../context/GuiStateStore";
import { useScenarioStore } from "../context/ScenarioStore";
import type { CruiseMissile, Point } from "../types/types";
import { cruiseMissileError, defaultMinClearance } from "../types/types";
import PositionSelector from "./PositionSelector";
import { fromDatetimeLocalValue, toDatetimeLocalValue } from "../util/datetime";

type NumericField =
  | "rcs"
  | "speed"
  | "cruise_magl"
  | "min_flight_path_angle"
  | "max_flight_path_angle"
  | "terminal_dive_angle"
  | "sample_spacing";

const NUMERIC_FIELDS: { field: NumericField; label: string }[] = [
  { field: "speed", label: "Speed [m/s]" },
  { field: "cruise_magl", label: "Cruise altitude [m AGL]" },
  { field: "min_flight_path_angle", label: "Min. flight-path angle [°]" },
  { field: "max_flight_path_angle", label: "Max. flight-path angle [°]" },
  { field: "terminal_dive_angle", label: "Terminal dive angle [°]" },
  { field: "sample_spacing", label: "Sample spacing [m]" },
  { field: "rcs", label: "RCS [m²]" },
];

function toInputValue(value: number | null): number | string {
  return value === null || Number.isNaN(value) ? "" : value;
}

export default function CruiseMissileSettings() {
  const selectedTargetId = useGuiStateStore(
    (state) => state.selectedCruiseMissileTargetId,
  );
  const missile = useScenarioStore((state) => state.cruiseMissiles).find(
    (m) => m.target_id === selectedTargetId,
  );

  if (!missile) {
    return null;
  }

  // Remount per missile so the draft below never leaks between missiles.
  return <CruiseMissileForm key={missile.target_id} missile={missile} />;
}

function CruiseMissileForm({ missile }: { missile: CruiseMissile }) {
  const terrainModels = useGuiStateStore((state) => state.terrainModels);
  const updateCruiseMissile = useScenarioStore(
    (state) => state.updateCruiseMissile,
  );

  // Edits go to a local draft. Only valid drafts reach the store, so an
  // invalid edit can't break an otherwise valid cruise missile.
  const [draft, setDraft] = useState<CruiseMissile>(missile);
  const error = cruiseMissileError(draft);

  function update(changes: Partial<CruiseMissile>) {
    const newDraft = { ...structuredClone(draft), ...changes };
    setDraft(newDraft);
    if (cruiseMissileError(newDraft) === null) {
      updateCruiseMissile(newDraft);
    }
  }

  return (
    <fieldset className="SensorSettingsContainer">
      <legend>Cruise Missile Settings</legend>
      <>
        <label>Start position</label>
        <PositionSelector
          point={draft.p_start}
          setPoint={(p: Point) => update({ p_start: p })}
        />
        <label>Target position</label>
        <PositionSelector
          point={draft.p_stop}
          setPoint={(p: Point) => update({ p_stop: p })}
        />
        <label>Launch time</label>
        <input
          type="datetime-local"
          value={toDatetimeLocalValue(draft.t_start)}
          onChange={(event) => {
            if (!event.target.value) {
              return;
            }
            update({ t_start: fromDatetimeLocalValue(event.target.value) });
          }}
        />
        <label>Terrain</label>
        <select
          value={draft.terrain.terrain_name}
          onChange={(event) =>
            update({ terrain: { terrain_name: event.target.value } })
          }
        >
          {!terrainModels.includes(draft.terrain.terrain_name) && (
            <option value={draft.terrain.terrain_name}>
              {draft.terrain.terrain_name}
            </option>
          )}
          {terrainModels.map((terrain) => (
            <option key={terrain} value={terrain}>
              {terrain}
            </option>
          ))}
        </select>
        {NUMERIC_FIELDS.map(({ field, label }) => (
          <NumericInput
            key={field}
            label={label}
            value={draft[field]}
            onChange={(value) => update({ [field]: value })}
          />
        ))}
        <label>Min. clearance [m]</label>
        <input
          type="number"
          value={toInputValue(draft.min_clearance)}
          placeholder={`auto (${defaultMinClearance(draft.cruise_magl)})`}
          onChange={(event) =>
            update({
              min_clearance:
                event.target.value === ""
                  ? null
                  : parseFloat(event.target.value),
            })
          }
        />
        {error !== null && (
          <span
            className="cruiseMissileError"
            role="alert"
            style={{ gridColumn: "1 / -1", color: "red" }}
          >
            {error} Changes are not applied until this is fixed.
          </span>
        )}
      </>
    </fieldset>
  );
}

function NumericInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <>
      <label>{label}</label>
      <input
        type="number"
        value={toInputValue(value)}
        onChange={(event) => onChange(parseFloat(event.target.value))}
      />
    </>
  );
}
