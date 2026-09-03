import { Box } from "@mui/material";
import { useGuiStateStore } from "../context/GuiStateStore";
import type { Effector } from "../types/types";

export default function GbadListItem({
  effector,
  isHighlighted,
}: {
  effector: Effector;
  isHighlighted: boolean;
}) {
  const selectGbad = useGuiStateStore((state) => state.selectGbad);

  return (
    <Box
      className="SensorListItem"
      style={{
        border: isHighlighted ? "solid red" : "none",
        cursor: "pointer",
      }}
      onClick={() => selectGbad(isHighlighted ? null : effector.id)}
    >
      <span>
        {effector.name} #{effector.id}
      </span>
    </Box>
  );
}
