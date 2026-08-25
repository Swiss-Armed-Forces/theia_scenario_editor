import { Button } from "@mui/material";
import { useGuiStateStore } from "../context/GuiStateStore";
import { useScenarioStore } from "../context/ScenarioStore";
import type { Point } from "../types/types";
import PositionSelector from "./PositionSelector";

export default function PclSensorSettings() {
  const selectedReceiverId = useGuiStateStore(
    (state) => state.selectedReceiverId,
  );
  const detectableReceiver = useScenarioStore(
    (state) => state.pclReceivers,
  ).find((d) => d.receiver.id === selectedReceiverId);

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
    detectableReceiver?.receiver.id ?? -1,
  );
  const selectedCount = useScenarioStore(
    (state) =>
      state.pclTransmitterIds.get(detectableReceiver?.receiver.id ?? -1)
        ?.size ?? 0,
  );

  const pclSelectionReceiverId = useGuiStateStore(
    (state) => state.pclSelectionReceiverId,
  );
  const setPclSelectionReceiverId = useGuiStateStore(
    (state) => state.setPclSelectionReceiverId,
  );
  const isSelecting =
    detectableReceiver !== undefined &&
    pclSelectionReceiverId === detectableReceiver.receiver.id;

  if (!detectableReceiver || !criteria) {
    return null;
  }

  const receiver = detectableReceiver.receiver;
  const newDetectableReceiver = structuredClone(detectableReceiver);
  return (
    <fieldset className="SensorSettingsContainer">
      <legend>Sensor Settings</legend>
      <>
        <label>Position</label>
        <PositionSelector
          point={receiver.point}
          setPoint={(p: Point) => {
            newDetectableReceiver.receiver.point = p;
            updatePclReceiverSettings(newDetectableReceiver);
          }}
        />
        <label>RCS [m²]</label>
        <input
          type="number"
          value={detectableReceiver.rcs}
          onChange={(event) => {
            const value = parseFloat(event.target.value);
            newDetectableReceiver.rcs = value;
            updatePclReceiverSettings(newDetectableReceiver);
          }}
        />
        <label>Antenna height</label>
        <input
          type="number"
          maxLength={3}
          value={receiver.antenna_height}
          onChange={(event) => {
            const value = parseFloat(event.target.value);
            newDetectableReceiver.receiver.antenna_height = value;
            updatePclReceiverSettings(newDetectableReceiver);
          }}
        />
        <label>Antenna diameter</label>
        <input
          type="number"
          maxLength={3}
          value={receiver.diameter}
          onChange={(event) => {
            const value = parseFloat(event.target.value);
            newDetectableReceiver.receiver.diameter = value;
            updatePclReceiverSettings(newDetectableReceiver);
          }}
        />
        <label>Antenna efficiency value</label>
        <input
          type="number"
          maxLength={3}
          value={receiver.antenna_efficiency_value}
          onChange={(event) => {
            const value = parseFloat(event.target.value);
            newDetectableReceiver.receiver.antenna_efficiency_value = value;
            updatePclReceiverSettings(newDetectableReceiver);
          }}
        />
        <label>Receiver gain [dB]</label>
        <input
          type="number"
          value={receiver.gain}
          onChange={(event) => {
            const value = parseFloat(event.target.value);
            newDetectableReceiver.receiver.gain = value;
            updatePclReceiverSettings(newDetectableReceiver);
          }}
        />
        <label>Receiver losses [dB]</label>
        <input
          type="number"
          value={receiver.losses}
          onChange={(event) => {
            const value = parseFloat(event.target.value);
            newDetectableReceiver.receiver.losses = value;
            updatePclReceiverSettings(newDetectableReceiver);
          }}
        />
        <label>Receiver noise temperature [K]</label>
        <input
          type="number"
          value={receiver.noise_temperature}
          onChange={(event) => {
            const value = parseFloat(event.target.value);
            newDetectableReceiver.receiver.noise_temperature = value;
            updatePclReceiverSettings(newDetectableReceiver);
          }}
        />
        <label>T rotation [s]</label>
        <input
          type="number"
          value={receiver.rotation_time}
          onChange={(event) => {
            const value = parseInt(event.target.value);
            newDetectableReceiver.receiver.rotation_time = value;
            updatePclReceiverSettings(newDetectableReceiver);
          }}
        />
        <label>Noise Bandwidth [MHz]</label>
        <input
          type="number"
          value={receiver.bandwidth}
          onChange={(event) => {
            const value = parseFloat(event.target.value);
            newDetectableReceiver.receiver.bandwidth = value;
            updatePclReceiverSettings(newDetectableReceiver);
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
    </fieldset>
  );
}
