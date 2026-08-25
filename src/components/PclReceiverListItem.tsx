import { Box, IconButton } from "@mui/material";
import { useGuiStateStore } from "../context/GuiStateStore";
import { useScenarioStore } from "../context/ScenarioStore";
import type { Receiver } from "../types/types";
import iconVisible from "../assets/eye-regular.png";
import iconHidden from "../assets/eye-slash-regular.png";
import PclTransmitterListItem from "./PclTransmitterListItem";
import { isPclReceiverVisible } from "../util/pclVisibility";

export default function PclReceiverListItem({
  receiver,
  isHighlighted,
}: {
  receiver: Receiver;
  isHighlighted: boolean;
}) {
  const visibleIds = useGuiStateStore((state) => state.visibleSensorIds);
  const showSensor = useGuiStateStore((state) => state.showSensor);
  const hideSensor = useGuiStateStore((state) => state.hideSensor);
  const selectReceiver = useGuiStateStore((state) => state.selectReceiver);
  const pclSensors = useScenarioStore((state) => state.pclSensors).filter(
    (d) => d.sensor.receiver.id === receiver.id,
  );
  const sensorIds = pclSensors.map((d) => d.sensor.id);
  const transmitterCount = useScenarioStore(
    (state) => state.pclTransmitterIds.get(receiver.id)?.size ?? 0,
  );

  const isVisible = isPclReceiverVisible(receiver, pclSensors, visibleIds);

  return (
    <Box style={{ display: "flex", flexDirection: "column" }}>
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
          selectReceiver(isHighlighted ? null : receiver.id)
        }
      >
        <IconButton
          style={{ padding: 0, height: "1em", verticalAlign: "-0.25em" }}
          onClick={(event) => {
            event.stopPropagation();
            for (const id of sensorIds) {
              if (isVisible) {
                hideSensor(id);
              } else {
                showSensor(id);
              }
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
        <span>
          Receiver #{receiver.id} ({transmitterCount} Tx)
        </span>
      </Box>
      {pclSensors.map((d) => (
        <PclTransmitterListItem key={d.sensor.id} sensor={d.sensor} />
      ))}
    </Box>
  );
}
