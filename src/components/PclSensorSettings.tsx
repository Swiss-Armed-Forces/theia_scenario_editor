import { Button } from "@mui/material";
import { useGuiStateStore } from "../context/GuiStateStore";
import { useScenarioStore } from "../context/ScenarioStore";
import type { Point } from "../types/types";
import PositionSelector from "./PositionSelector";

export default function PclSensorSettings() {
  const selectedReceiverId = useGuiStateStore(
    (state) => state.selectedReceiverId,
  );
  const receiver = useScenarioStore((state) => state.pclReceivers).find(
    (r) => r.id === selectedReceiverId,
  );

  const updatePclReceiverSettings = useScenarioStore(
    (state) => state.updatePclReceiverSettings,
  );
  const updatePclTxCriteria = useScenarioStore(
    (state) => state.updatePclTxCriteria,
  );
  const selectAllMatchingCriteria = useScenarioStore(
    (state) => state.selectAllMatchingCriteria,
  );

  const criteria = useScenarioStore((state) => state.pclTxCriteria).get(
    receiver?.id ?? -1,
  );
  const selectedCount = useScenarioStore(
    (state) => state.pclTransmitterIds.get(receiver?.id ?? -1)?.size ?? 0,
  );

  const pclSelectionReceiverId = useGuiStateStore(
    (state) => state.pclSelectionReceiverId,
  );
  const setPclSelectionReceiverId = useGuiStateStore(
    (state) => state.setPclSelectionReceiverId,
  );
  const isSelecting =
    receiver !== undefined && pclSelectionReceiverId === receiver.id;

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
            updatePclReceiverSettings(newReceiver);
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
            updatePclReceiverSettings(newReceiver);
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
            updatePclReceiverSettings(newReceiver);
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
            updatePclReceiverSettings(newReceiver);
          }}
        />
        <label>Receiver gain [dB]</label>
        <input
          type="number"
          value={receiver.gain}
          onChange={(event) => {
            const value = parseFloat(event.target.value);
            newReceiver.gain = value;
            updatePclReceiverSettings(newReceiver);
          }}
        />
        <label>Receiver losses [dB]</label>
        <input
          type="number"
          value={receiver.losses}
          onChange={(event) => {
            const value = parseFloat(event.target.value);
            newReceiver.losses = value;
            updatePclReceiverSettings(newReceiver);
          }}
        />
        <label>Receiver noise temperature [K]</label>
        <input
          type="number"
          value={receiver.noise_temperature}
          onChange={(event) => {
            const value = parseFloat(event.target.value);
            newReceiver.noise_temperature = value;
            updatePclReceiverSettings(newReceiver);
          }}
        />
        <label>T rotation [s]</label>
        <input
          type="number"
          value={receiver.rotation_time}
          onChange={(event) => {
            const value = parseInt(event.target.value);
            newReceiver.rotation_time = value;
            updatePclReceiverSettings(newReceiver);
          }}
        />
        <label>Noise Bandwidth [MHz]</label>
        <input
          type="number"
          value={receiver.bandwidth}
          onChange={(event) => {
            const value = parseInt(event.target.value);
            newReceiver.bandwidth = value;
            updatePclReceiverSettings(newReceiver);
          }}
        />
        <label>Highlight Tx with P [W] &gt;= </label>
        <input
          type="number"
          value={criteria.min_power}
          onChange={(event) => {
            const value = parseInt(event.target.value);
            const newCriteria = structuredClone(criteria);
            newCriteria.min_power = value;
            updatePclTxCriteria(receiver.id, newCriteria);
          }}
        />
        <label>Highlight Tx with d [m] &lt;= </label>
        <input
          type="number"
          value={criteria.max_dist}
          onChange={(event) => {
            const value = parseInt(event.target.value);
            const newCriteria = structuredClone(criteria);
            newCriteria.max_dist = value;
            updatePclTxCriteria(receiver.id, newCriteria);
          }}
        />
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <span>{selectedCount} transmitter(s) selected</span>
          {isSelecting ? (
            <>
              <Button
                variant="contained"
                onClick={() => selectAllMatchingCriteria(receiver.id)}
              >
                Select all matching filter
              </Button>
              <Button
                variant="outlined"
                onClick={() => setPclSelectionReceiverId(null)}
              >
                Done
              </Button>
            </>
          ) : (
            <Button
              variant="contained"
              onClick={() => setPclSelectionReceiverId(receiver.id)}
            >
              Select transmitters&hellip;
            </Button>
          )}
        </div>
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
