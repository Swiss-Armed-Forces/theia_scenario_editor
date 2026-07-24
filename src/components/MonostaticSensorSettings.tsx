import { useGuiStateStore } from "../context/GuiStateStore";
import { useScenarioStore } from "../context/ScenarioStore";
import type { Point } from "../types/types";
import PositionSelector from "./PositionSelector";

export default function MonostaticSensorSettings() {
  const selectedReceiverId = useGuiStateStore(
    (state) => state.selectedReceiverId,
  );
  const sensor = useScenarioStore((state) => state.blueMonostaticSensors).find(
    (sensor) => sensor.receiver.id === selectedReceiverId,
  );

  const updateMonostaticSensor = useScenarioStore(
    (state) => state.updateMonostaticSensor,
  );

  let content = <></>;
  if (sensor) {
    content = (
      <>
        <label>Position</label>
        <PositionSelector
          point={sensor.receiver.point}
          setPoint={(p: Point) => {
            const newSensor = structuredClone(sensor);
            newSensor.receiver.point = p;
            newSensor.transmitter.point = p;
            updateMonostaticSensor(newSensor, true);
          }}
        />
        <label>Antenna height</label>
        <input
          type="number"
          maxLength={3}
          value={sensor.receiver.antenna_height}
          onChange={(event) => {
            const value = parseFloat(event.target.value);
            const newSensor = structuredClone(sensor);
            newSensor.receiver.antenna_height = value;
            newSensor.transmitter.antenna_height = value;
            updateMonostaticSensor(newSensor, true);
          }}
        />
        <label>Antenna diameter</label>
        <input
          type="number"
          maxLength={3}
          value={sensor.receiver.diameter}
          onChange={(event) => {
            const value = parseFloat(event.target.value);
            const newSensor = structuredClone(sensor);
            newSensor.receiver.diameter = value;
            newSensor.transmitter.antenna_diameter = value;
            updateMonostaticSensor(newSensor, true);
          }}
        />
        <label>Antenna efficiency value</label>
        <input
          type="number"
          maxLength={3}
          value={sensor.receiver.antenna_efficiency_value}
          onChange={(event) => {
            const value = parseFloat(event.target.value);
            const newSensor = structuredClone(sensor);
            newSensor.receiver.antenna_efficiency_value = value;
            newSensor.transmitter.antenna_efficiency_value = value;
            updateMonostaticSensor(newSensor, true);
          }}
        />
        <label>Receiver gain [dB]</label>
        <input
          type="number"
          value={sensor.receiver.gain}
          onChange={(event) => {
            const value = parseFloat(event.target.value);
            const newSensor = structuredClone(sensor);
            newSensor.receiver.gain = value;
            updateMonostaticSensor(newSensor, true);
          }}
        />
        <label>Receiver losses [dB]</label>
        <input
          type="number"
          value={sensor.receiver.losses}
          onChange={(event) => {
            const value = parseFloat(event.target.value);
            const newSensor = structuredClone(sensor);
            newSensor.receiver.losses = value;
            updateMonostaticSensor(newSensor, true);
          }}
        />
        <label>Receiver noise temperature [K]</label>
        <input
          type="number"
          value={sensor.receiver.noise_temperature}
          onChange={(event) => {
            const value = parseFloat(event.target.value);
            const newSensor = structuredClone(sensor);
            newSensor.receiver.noise_temperature = value;
            updateMonostaticSensor(newSensor, true);
          }}
        />
        <label>N coherently integrated pulses</label>
        <input
          type="number"
          value={sensor.receiver.cpi_pulses}
          onChange={(event) => {
            const value = parseInt(event.target.value);
            const newSensor = structuredClone(sensor);
            newSensor.receiver.cpi_pulses = value;
            updateMonostaticSensor(newSensor, true);
          }}
        />
        <label>Coherent integration time [s]</label>
        <input
          type="number"
          value={sensor.transmitter.max_coherent_integration_time}
          onChange={(event) => {
            const value = parseInt(event.target.value);
            const newSensor = structuredClone(sensor);
            newSensor.transmitter.max_coherent_integration_time = value;
            updateMonostaticSensor(newSensor, true);
          }}
        />
        <label>T rotation [s]</label>
        <input
          type="number"
          value={sensor.receiver.rotation_time}
          onChange={(event) => {
            const value = parseInt(event.target.value);
            const newSensor = structuredClone(sensor);
            newSensor.receiver.rotation_time = value;
            updateMonostaticSensor(newSensor, true);
          }}
        />
        <label>Probability of false alarm</label>
        <input
          type="number"
          value={sensor.receiver.pfa}
          onChange={(event) => {
            const value = parseFloat(event.target.value);
            const newSensor = structuredClone(sensor);
            newSensor.receiver.pfa = value;
            updateMonostaticSensor(newSensor, true);
          }}
        />
        <label>Noise Bandwidth [MHz]</label>
        <input
          type="number"
          value={sensor.receiver.bandwidth}
          onChange={(event) => {
            const value = parseInt(event.target.value);
            const newSensor = structuredClone(sensor);
            newSensor.receiver.bandwidth = value;
            newSensor.transmitter.bandwidth = value;
            updateMonostaticSensor(newSensor, true);
          }}
        />
        <label>Power [W]</label>
        <input
          type="number"
          value={sensor.transmitter.power}
          onChange={(event) => {
            const value = parseInt(event.target.value);
            const newSensor = structuredClone(sensor);
            newSensor.transmitter.power = value;
            updateMonostaticSensor(newSensor, true);
          }}
        />
        <label>ERP [W]</label>
        <input
          type="number"
          value={sensor.transmitter.erp}
          onChange={(event) => {
            const value = parseInt(event.target.value);
            const newSensor = structuredClone(sensor);
            newSensor.transmitter.erp = value;
            updateMonostaticSensor(newSensor, true);
          }}
        />
        <label>Frequency [MHz]</label>
        <input
          type="number"
          value={sensor.transmitter.frequency}
          onChange={(event) => {
            const value = parseInt(event.target.value);
            const newSensor = structuredClone(sensor);
            newSensor.transmitter.frequency = value;
            updateMonostaticSensor(newSensor, true);
          }}
        />
        <label>Pulse width [us]</label>
        <input
          type="number"
          value={sensor.transmitter.pulse_width}
          onChange={(event) => {
            const value = parseInt(event.target.value);
            const newSensor = structuredClone(sensor);
            newSensor.transmitter.pulse_width = value;
            updateMonostaticSensor(newSensor, true);
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
