import { Button } from "@mui/material";
import { useScenarioStore } from "../context/ScenarioStore";
import { buildDefaultMonostaticSensor } from "../types/types";
import { useGuiStateStore } from "../context/GuiStateStore";

import type { LatLng } from "leaflet";
import { elevationAt } from "../backend/backend";
import SensorListItem from "./SensorListItem";

export default function SensorList() {
  // TODO: Allow to switch to RED.
  const sensors = useScenarioStore((state) => state.blueMonostaticSensors);

  const highlightedReceiverId = useGuiStateStore(
    (state) => state.selectedReceiverId,
  );

  const addSensor = useScenarioStore((state) => state.addMonostaticSensor);
  const unusedIdMonostaticSensor = useScenarioStore(
    (state) => state.unusedIdSensor,
  );
  const unusedIdReceiver = useScenarioStore((state) => state.unusedIdReceiver);
  const unusedIdTransmitter = useScenarioStore(
    (state) => state.unusedIdTransmitter,
  );
  const setMapClickListener = useGuiStateStore(
    (state) => state.setMapClickListener,
  );

  return (
    <fieldset className="SensorList">
      <legend>Sensor List</legend>
      {sensors.map((sensor, i) => (
        <SensorListItem
          key={i}
          sensor={sensor}
          isHighlighted={sensor.receiver.id == highlightedReceiverId}
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

              const newRadar = buildDefaultMonostaticSensor(
                point,
                unusedIdReceiver,
                unusedIdTransmitter,
                unusedIdMonostaticSensor,
              );
              addSensor(newRadar, true);

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
