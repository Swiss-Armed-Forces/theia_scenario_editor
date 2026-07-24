import { useGuiStateStore } from "../context/GuiStateStore";
import { useScenarioStore } from "../context/ScenarioStore";
import type { Point } from "../types/types";
import PositionSelector from "./PositionSelector";

export default function PclSensorSettings() {
  const selectedReceiverId = useGuiStateStore(
    (state) => state.selectedReceiverId,
  );
  const receiver = useScenarioStore((state) => state.pclSensors).find(
    (sensor) => sensor.receiver.id === selectedReceiverId,
  )?.receiver;

  const updatePclReceiver = useScenarioStore(
    (state) => state.updatePclReceiver,
  );

  const criteria = useScenarioStore((state) => state.pclTxCriteria).get(
    receiver?.id ?? -1,
  );
  if (receiver && !criteria) {
    throw new Error("Criteria must be defined. Unexpected behaviour.");
  }

  let content = <></>;
  if (receiver && criteria) {
    const newReceiver = structuredClone(receiver);
    content = (
      <>
        <label>Position</label>
        <PositionSelector
          point={receiver.point}
          setPoint={(p: Point) => {
            newReceiver.point = p;
            updatePclReceiver(newReceiver, criteria);
          }}
        />
        <label>Antenna height</label>
        <input
          type="number"
          maxLength={3}
          value={receiver.antenna_height}
          onChange={(event) => {
            const value = parseFloat(event.target.value);
            newReceiver.antenna_height = value;
            updatePclReceiver(newReceiver, criteria);
          }}
        />
        <label>Antenna diameter</label>
        <input
          type="number"
          maxLength={3}
          value={receiver.diameter}
          onChange={(event) => {
            const value = parseFloat(event.target.value);
            newReceiver.diameter = value;
            updatePclReceiver(newReceiver, criteria);
          }}
        />
        <label>Antenna efficiency value</label>
        <input
          type="number"
          maxLength={3}
          value={receiver.antenna_efficiency_value}
          onChange={(event) => {
            const value = parseFloat(event.target.value);
            newReceiver.antenna_efficiency_value = value;
            updatePclReceiver(newReceiver, criteria);
          }}
        />
        <label>Receiver gain [dB]</label>
        <input
          type="number"
          value={receiver.gain}
          onChange={(event) => {
            const value = parseFloat(event.target.value);
            newReceiver.gain = value;
            updatePclReceiver(newReceiver, criteria);
          }}
        />
        <label>Receiver losses [dB]</label>
        <input
          type="number"
          value={receiver.losses}
          onChange={(event) => {
            const value = parseFloat(event.target.value);
            newReceiver.losses = value;
            updatePclReceiver(newReceiver, criteria);
          }}
        />
        <label>Receiver noise temperature [K]</label>
        <input
          type="number"
          value={receiver.noise_temperature}
          onChange={(event) => {
            const value = parseFloat(event.target.value);
            newReceiver.noise_temperature = value;
            updatePclReceiver(newReceiver, criteria);
          }}
        />
        <label>T rotation [s]</label>
        <input
          type="number"
          value={receiver.rotation_time}
          onChange={(event) => {
            const value = parseInt(event.target.value);
            newReceiver.rotation_time = value;
            updatePclReceiver(newReceiver, criteria);
          }}
        />
        <label>Noise Bandwidth [MHz]</label>
        <input
          type="number"
          value={receiver.bandwidth}
          onChange={(event) => {
            const value = parseInt(event.target.value);
            newReceiver.bandwidth = value;
            updatePclReceiver(newReceiver, criteria);
          }}
        />
        <label>Select Tx with P [W] &gt;= </label>
        <input
          type="number"
          value={criteria.min_power}
          onChange={(event) => {
            const value = parseInt(event.target.value);
            const newCriteria = structuredClone(criteria)
            newCriteria.min_power = value;
            updatePclReceiver(newReceiver, newCriteria);
          }}
        />
        <label>Select Tx with d [m] &lt;= </label>
        <input
          type="number"
          value={criteria.max_dist}
          onChange={(event) => {
            const value = parseInt(event.target.value);
            const newCriteria = structuredClone(criteria)
            newCriteria.max_dist = value;
            updatePclReceiver(newReceiver, newCriteria);
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
