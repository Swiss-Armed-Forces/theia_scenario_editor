import { Box, IconButton } from "@mui/material";
import { useGuiStateStore } from "../context/GuiStateStore";
import type { PclSensor } from "../types/types";
import iconVisible from "../assets/eye-regular.png";
import iconHidden from "../assets/eye-slash-regular.png";

export default function PclTransmitterListItem({
  sensor,
}: {
  sensor: PclSensor;
}) {
  const visibleIds = useGuiStateStore((state) => state.visibleSensorIds);
  const showSensor = useGuiStateStore((state) => state.showSensor);
  const hideSensor = useGuiStateStore((state) => state.hideSensor);
  const isVisible = visibleIds.has(sensor.id);

  return (
    <Box
      className="SensorListItem"
      style={{
        display: "flex",
        flexDirection: "row",
        gap: "10px",
        paddingLeft: "1.5em",
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
      <span>Tx #{sensor.transmitter.id}</span>
    </Box>
  );
}
