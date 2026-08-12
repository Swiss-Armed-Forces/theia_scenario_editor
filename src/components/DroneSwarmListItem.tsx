import { Box } from "@mui/material";
import { useGuiStateStore } from "../context/GuiStateStore";
import type { DroneSwarm } from "../types/types";

export default function DroneSwarmListItem({
  droneSwarm,
  isHighlighted,
}: {
  droneSwarm: DroneSwarm;
  isHighlighted: boolean;
}) {
  const selectDroneSwarm = useGuiStateStore((state) => state.selectDroneSwarm);

  return (
    <Box
      className="SensorListItem"
      style={{
        border: isHighlighted ? "solid red" : "none",
        cursor: "pointer",
      }}
      onClick={() =>
        selectDroneSwarm(isHighlighted ? null : droneSwarm.target_id)
      }
    >
      <span>Drone Swarm #{droneSwarm.target_id}</span>
    </Box>
  );
}
