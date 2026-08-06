import { useGuiStateStore } from "../context/GuiStateStore";
import { useScenarioStore } from "../context/ScenarioStore";
import type { Point } from "../types/types";
import PositionSelector from "./PositionSelector";

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

  let content = <></>;
  if (detectableSensor) {
    const sensor = detectableSensor.sensor;
    content = (
      <>
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
            newDetectableSensor.sensor.transmitter.antenna_diameter = value;
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
            const value = parseInt(event.target.value);
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
            const value = parseInt(event.target.value);
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
            const value = parseInt(event.target.value);
            const newDetectableSensor = structuredClone(detectableSensor);
            newDetectableSensor.sensor.transmitter.pulse_width = value;
            updateMonostaticSensor(newDetectableSensor);
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
      <legend>Sensor Settings</legend>
      {content}
    </fieldset>
  );
}
