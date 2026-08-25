import { Box, IconButton } from "@mui/material";
import { useGuiStateStore } from "../context/GuiStateStore";
import type { Sensor } from "../types/types";
import iconVisible from "../assets/eye-regular.png";
import iconHidden from "../assets/eye-slash-regular.png";

export default function SensorListItem({
  sensor,
  isHighlighted,
}: {
  sensor: Sensor;
  isHighlighted: boolean;
}) {
  const visibleIds = useGuiStateStore((state) => state.visibleSensorIds);
  const showSensor = useGuiStateStore((state) => state.showSensor);
  const hideSensor = useGuiStateStore((state) => state.hideSensor);
  const selectReceiver = useGuiStateStore((state) => state.selectReceiver);
  const isVisible = visibleIds.has(sensor.id);
  return (
    <Box
      className="SensorListItem"
      style={{
        border: isHighlighted ? "solid red" : "none",
        display: "flex",
        flexDirection: "row",
        gap: "10px",
        cursor: "pointer",
      }}
      onClick={() =>
        selectReceiver(isHighlighted ? null : sensor.receiver.id)
      }
    >
      <IconButton
        style={{ padding: 0, height: "1em", verticalAlign: "-0.25em" }}
        onClick={(event) => {
          event.stopPropagation();
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
