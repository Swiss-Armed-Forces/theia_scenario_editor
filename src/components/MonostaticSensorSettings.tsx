import { useEffect } from "react";
import { Switch } from "@mui/material";
import { useGuiStateStore } from "../context/GuiStateStore";
import { useScenarioStore } from "../context/ScenarioStore";
import type { Point } from "../types/types";
import PositionSelector from "./PositionSelector";
import InfoButton from "./InfoButton";
import {
  applyMonostaticSensorPreset,
  findMatchingMonostaticSensorPreset,
} from "../util/monostaticSensorPresets";

export default function MonostaticSensorSettings() {
  const selectedReceiverId = useGuiStateStore(
    (state) => state.selectedReceiverId,
  );
  const detectableSensor = useScenarioStore(
    (state) => state.monostaticSensors,
  ).find((d) => d.sensor.receiver.id === selectedReceiverId);

  const updateMonostaticSensor = useScenarioStore(
    (state) => state.updateMonostaticSensor,
  );

  const presets = useGuiStateStore(
    (state) => state.defaultMonostaticSensorConfigurations,
  );
  const expertMode = useGuiStateStore((state) => state.monostaticExpertMode);
  const setExpertMode = useGuiStateStore(
    (state) => state.setMonostaticExpertMode,
  );

  // Whenever a different sensor becomes selected (or the preset list
  // finishes loading), decide the *initial* editing mode: if the sensor's
  // current settings match a known preset there's a meaningful simple view
  // to show, otherwise jump straight to expert mode. Deliberately excludes
  // the sensor's own field values from the dependency array — this should
  // only run on selection change, not on every keystroke while hand-editing
  // fields. Whether the *current* settings still match a preset is instead
  // a plain derived value below, recomputed every render, so it stays live
  // while the user edits expert fields.
  useEffect(() => {
    if (!detectableSensor) {
      return;
    }
    const matched = findMatchingMonostaticSensorPreset(
      detectableSensor.sensor,
      presets,
    );
    setExpertMode(matched === null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedReceiverId, presets]);

  if (!detectableSensor) {
    return null;
  }

  const sensor = detectableSensor.sensor;
  const matchedPreset = findMatchingMonostaticSensorPreset(sensor, presets);
  // Fields have been hand-edited away from every known preset: nothing
  // meaningful to select in the dropdown, and switching back to simple
  // mode would have nothing to show either, so freeze the toggle in
  // expert mode until the settings match a preset again.
  const isCustom = presets.length > 0 && matchedPreset === null;
  const dropdownValue = matchedPreset?.name ?? "";

  function applyPreset(name: string) {
    const preset = presets.find((p) => p.name === name);
    if (!preset || !detectableSensor) {
      return;
    }
    updateMonostaticSensor(
      applyMonostaticSensorPreset(detectableSensor, preset),
    );
  }

  return (
    <fieldset className="SensorSettingsContainer">
      <legend>Sensor Settings</legend>
      <>
        <label>Preset</label>
        <div className="presetRow">
          <select
            value={dropdownValue}
            onChange={(event) => applyPreset(event.target.value)}
            title={dropdownValue || undefined}
          >
            <option value="" disabled>
              {isCustom ? "Custom" : "No presets available"}
            </option>
            {presets.map((preset) => (
              <option key={preset.name} value={preset.name}>
                {preset.name}
              </option>
            ))}
          </select>
          <InfoButton text={matchedPreset?.description ?? null} />
        </div>

        <label>Position</label>
        <PositionSelector
          point={sensor.receiver.point}
          setPoint={(p: Point) => {
            const newDetectableSensor = structuredClone(detectableSensor);
            newDetectableSensor.sensor.receiver.point = p;
            newDetectableSensor.sensor.transmitter.point = p;
            updateMonostaticSensor(newDetectableSensor);
          }}
        />
        <label>RCS [m²]</label>
        <input
          type="number"
          value={detectableSensor.rcs}
          onChange={(event) => {
            const value = parseFloat(event.target.value);
            const newDetectableSensor = structuredClone(detectableSensor);
            newDetectableSensor.rcs = value;
            updateMonostaticSensor(newDetectableSensor);
          }}
        />

        <label>Expert mode</label>
        <Switch
          checked={expertMode}
          disabled={isCustom}
          onChange={(event) => setExpertMode(event.target.checked)}
          size="small"
          title={
            isCustom
              ? "Settings don't match a preset; apply one to leave expert mode"
              : undefined
          }
        />

        {expertMode && (
          <>
            <label>Antenna height</label>
            <input
              type="number"
              maxLength={3}
              value={sensor.receiver.antenna_height}
              onChange={(event) => {
                const value = parseFloat(event.target.value);
                const newDetectableSensor = structuredClone(detectableSensor);
                newDetectableSensor.sensor.receiver.antenna_height = value;
                newDetectableSensor.sensor.transmitter.antenna_height = value;
                updateMonostaticSensor(newDetectableSensor);
              }}
            />
            <label>Antenna diameter</label>
            <input
              type="number"
              maxLength={3}
              value={sensor.receiver.diameter}
              onChange={(event) => {
                const value = parseFloat(event.target.value);
                const newDetectableSensor = structuredClone(detectableSensor);
                newDetectableSensor.sensor.receiver.diameter = value;
                newDetectableSensor.sensor.transmitter.antenna_diameter =
                  value;
                updateMonostaticSensor(newDetectableSensor);
              }}
            />
            <label>Antenna efficiency value</label>
            <input
              type="number"
              maxLength={3}
              value={sensor.receiver.antenna_efficiency_value}
              onChange={(event) => {
                const value = parseFloat(event.target.value);
                const newDetectableSensor = structuredClone(detectableSensor);
                newDetectableSensor.sensor.receiver.antenna_efficiency_value =
                  value;
                newDetectableSensor.sensor.transmitter.antenna_efficiency_value =
                  value;
                updateMonostaticSensor(newDetectableSensor);
              }}
            />
            <label>Receiver gain [dB]</label>
            <input
              type="number"
              value={sensor.receiver.gain}
              onChange={(event) => {
                const value = parseFloat(event.target.value);
                const newDetectableSensor = structuredClone(detectableSensor);
                newDetectableSensor.sensor.receiver.gain = value;
                updateMonostaticSensor(newDetectableSensor);
              }}
            />
            <label>Receiver losses [dB]</label>
            <input
              type="number"
              value={sensor.receiver.losses}
              onChange={(event) => {
                const value = parseFloat(event.target.value);
                const newDetectableSensor = structuredClone(detectableSensor);
                newDetectableSensor.sensor.receiver.losses = value;
                updateMonostaticSensor(newDetectableSensor);
              }}
            />
            <label>Receiver noise temperature [K]</label>
            <input
              type="number"
              value={sensor.receiver.noise_temperature}
              onChange={(event) => {
                const value = parseFloat(event.target.value);
                const newDetectableSensor = structuredClone(detectableSensor);
                newDetectableSensor.sensor.receiver.noise_temperature = value;
                updateMonostaticSensor(newDetectableSensor);
              }}
            />
            <label>N coherently integrated pulses</label>
            <input
              type="number"
              value={sensor.receiver.cpi_pulses}
              onChange={(event) => {
                const value = parseInt(event.target.value);
                const newDetectableSensor = structuredClone(detectableSensor);
                newDetectableSensor.sensor.receiver.cpi_pulses = value;
                updateMonostaticSensor(newDetectableSensor);
              }}
            />
            <label>Coherent integration time [s]</label>
            <input
              type="number"
              value={sensor.transmitter.max_coherent_integration_time}
              onChange={(event) => {
                const value = parseFloat(event.target.value);
                const newDetectableSensor = structuredClone(detectableSensor);
                newDetectableSensor.sensor.transmitter.max_coherent_integration_time =
                  value;
                updateMonostaticSensor(newDetectableSensor);
              }}
            />
            <label>T rotation [s]</label>
            <input
              type="number"
              value={sensor.receiver.rotation_time}
              onChange={(event) => {
                const value = parseFloat(event.target.value);
                const newDetectableSensor = structuredClone(detectableSensor);
                newDetectableSensor.sensor.receiver.rotation_time = value;
                updateMonostaticSensor(newDetectableSensor);
              }}
            />
            <label>Probability of false alarm</label>
            <input
              type="number"
              value={sensor.receiver.pfa}
              onChange={(event) => {
                const value = parseFloat(event.target.value);
                const newDetectableSensor = structuredClone(detectableSensor);
                newDetectableSensor.sensor.receiver.pfa = value;
                updateMonostaticSensor(newDetectableSensor);
              }}
            />
            <label>Noise Bandwidth [MHz]</label>
            <input
              type="number"
              value={sensor.receiver.bandwidth}
              onChange={(event) => {
                const value = parseInt(event.target.value);
                const newDetectableSensor = structuredClone(detectableSensor);
                newDetectableSensor.sensor.receiver.bandwidth = value;
                newDetectableSensor.sensor.transmitter.bandwidth = value;
                updateMonostaticSensor(newDetectableSensor);
              }}
            />
            <label>Power [W]</label>
            <input
              type="number"
              value={sensor.transmitter.power}
              onChange={(event) => {
                const value = parseInt(event.target.value);
                const newDetectableSensor = structuredClone(detectableSensor);
                newDetectableSensor.sensor.transmitter.power = value;
                updateMonostaticSensor(newDetectableSensor);
              }}
            />
            <label>ERP [W]</label>
            <input
              type="number"
              value={sensor.transmitter.erp}
              onChange={(event) => {
                const value = parseInt(event.target.value);
                const newDetectableSensor = structuredClone(detectableSensor);
                newDetectableSensor.sensor.transmitter.erp = value;
                updateMonostaticSensor(newDetectableSensor);
              }}
            />
            <label>Frequency [MHz]</label>
            <input
              type="number"
              value={sensor.transmitter.frequency}
              onChange={(event) => {
                const value = parseInt(event.target.value);
                const newDetectableSensor = structuredClone(detectableSensor);
                newDetectableSensor.sensor.transmitter.frequency = value;
                updateMonostaticSensor(newDetectableSensor);
              }}
            />
            <label>Pulse width [us]</label>
            <input
              type="number"
              value={sensor.transmitter.pulse_width}
              onChange={(event) => {
                const value = parseFloat(event.target.value);
                const newDetectableSensor = structuredClone(detectableSensor);
                newDetectableSensor.sensor.transmitter.pulse_width = value;
                updateMonostaticSensor(newDetectableSensor);
              }}
            />
          </>
        )}
      </>
    </fieldset>
  );
}
