import { Box, Button, IconButton } from "@mui/material";
import { useScenarioStore } from "../context/ScenarioStore";
import {
  buildDefaultMonostaticSensor,
  type MonostaticSensor,
} from "../types/types";
import { useGuiStateStore } from "../context/GuiStateStore";
import iconVisible from "../assets/eye-regular.png";
import iconHidden from "../assets/eye-slash-regular.png";
import type { LatLng } from "leaflet";
import { elevationAt } from "../backend/backend";

function SensorListItem({
  sensor,
  isHighlighted,
}: {
  sensor: MonostaticSensor;
  isHighlighted: boolean;
}) {
  const visibleIds = useGuiStateStore((state) => state.visibleSensorIds);
  const showSensor = useGuiStateStore((state) => state.showSensor);
  const hideSensor = useGuiStateStore((state) => state.hideSensor);
  const isVisible = visibleIds.has(sensor.id);
  return (
    <Box
      className="SensorListItem"
      style={{
        border: isHighlighted ? "solid red" : "none",
        display: "flex",
        flexDirection: "row",
        gap: "10px",
      }}
    >
      <IconButton
        style={{ padding: 0, height: "1em", verticalAlign: "-0.25em" }}
        onClick={(_event) => {
          if (isVisible) {
            hideSensor(sensor.id);
          } else {
            showSensor(sensor.id);
          }
        }}
      >
        <img
          src={isVisible ? iconVisible : iconHidden}
          style={{
            filter: "invert(1) hue-rotate(180deg)",
            height: "1em",
          }}
        />
      </IconButton>
      <span>Sensor #{sensor.id}</span>
    </Box>
  );
}

export default function SensorList() {
  // TODO: Allow to switch to RED.
  const monostaticSensors = useScenarioStore(
    (state) => state.blueMonostaticSensors,
  );

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
      {monostaticSensors.map((sensor, i) => (
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
              const newRadar = buildDefaultMonostaticSensor(
                {
                  lat: p.lat,
                  lon: p.lng,
                  alt: alt,
                },
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
