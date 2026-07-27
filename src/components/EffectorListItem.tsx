import { Box } from "@mui/material";
import { useGuiStateStore } from "../context/GuiStateStore";
import type { Effector } from "../types/types";

export default function EffectorListItem({
  effector,
  isHighlighted,
}: {
  effector: Effector;
  isHighlighted: boolean;
}) {
  const selectEffector = useGuiStateStore((state) => state.selectEffector);

  return (
    <Box
      className="SensorListItem"
      style={{
        border: isHighlighted ? "solid red" : "none",
        cursor: "pointer",
      }}
      onClick={() => selectEffector(isHighlighted ? null : effector.id)}
    >
      <span>
        {effector.name} #{effector.id}
      </span>
    </Box>
  );
}
