import { Box, IconButton } from "@mui/material";
import { useScenarioStore } from "../context/ScenarioStore";
import type { MonostaticSensor } from "../types/types";
import { useGuiStateStore } from "../context/GuiStateStore";
import iconVisible from "../assets/eye-regular.png";
import iconHidden from "../assets/eye-slash-regular.png";

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

  const highlightedSensorId = useGuiStateStore(
    (state) => state.selectedSensorId,
  );

  return (
    <fieldset className="SensorList">
      <legend>Sensor List</legend>
      {monostaticSensors.map((sensor, i) => (
        <SensorListItem
          key={i}
          sensor={sensor}
          isHighlighted={sensor.id == highlightedSensorId}
        />
      ))}
    </fieldset>
  );
}
