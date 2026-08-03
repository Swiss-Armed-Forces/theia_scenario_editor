import { Button } from "@mui/material";
import { useScenarioStore } from "../context/ScenarioStore";
import { buildDefaultPclReceiver } from "../types/types";
import { useGuiStateStore } from "../context/GuiStateStore";

import type { LatLng } from "leaflet";
import { elevationAt } from "../backend/backend";
import PclReceiverListItem from "./PclReceiverListItem";

export default function PclSensorList() {
  const receivers = useScenarioStore((state) => state.pclReceivers);

  const highlightedReceiverId = useGuiStateStore(
    (state) => state.selectedReceiverId,
  );

  const addPclReceiver = useScenarioStore((state) => state.addPclReceiver);
  const unusedIdReceiver = useScenarioStore((state) => state.unusedIdReceiver);
  const unusedTargetId = useScenarioStore((state) => state.unusedTargetId);
  const setMapClickListener = useGuiStateStore(
    (state) => state.setMapClickListener,
  );
  const selectReceiver = useGuiStateStore((state) => state.selectReceiver);
  const setPclSelectionReceiverId = useGuiStateStore(
    (state) => state.setPclSelectionReceiverId,
  );

  return (
    <fieldset className="SensorList">
      <legend>Sensor List</legend>
      {receivers.map((detectableReceiver) => (
        <PclReceiverListItem
          key={detectableReceiver.receiver.id}
          receiver={detectableReceiver.receiver}
          isHighlighted={
            detectableReceiver.receiver.id == highlightedReceiverId
          }
        />
      ))}
      <Button
        variant="contained"
        onClick={() => {
          // We need the "() => " because otherwise, the return value would be
          // considered an updater function.
          // However, we want the function itself to be the values, so we define
          // a trivial updater function that simply returns our callback.
          setMapClickListener((p: LatLng) => {
            // Add the radar.
            // TODO: Select blue or red!
            elevationAt(p.lat, p.lng).then((alt) => {
              const point = {
                lat: p.lat,
                lon: p.lng,
                alt: alt,
              };

              const [newRadar, minPower, maxDistance] = buildDefaultPclReceiver(
                point,
                unusedIdReceiver,
                unusedTargetId,
              );
              addPclReceiver(newRadar, {
                min_power: minPower,
                max_dist: maxDistance,
              }).then(() => {
                // Drop straight into transmitter selection mode so the user
                // can immediately fine-tune the just-created receiver.
                selectReceiver(newRadar.receiver.id);
                setPclSelectionReceiverId(newRadar.receiver.id);
              });

              // Deactivate the listener.
              setMapClickListener(null);
            });
          });
        }}
      >
        +
      </Button>
    </fieldset>
  );
}
