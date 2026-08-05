import { Box } from "@mui/material";
import { useGuiStateStore } from "../context/GuiStateStore";
import type { Missile } from "../types/types";

export default function MissileListItem({
  missile,
  isHighlighted,
}: {
  missile: Missile;
  isHighlighted: boolean;
}) {
  const selectMissile = useGuiStateStore((state) => state.selectMissile);

  return (
    <Box
      className="SensorListItem"
      style={{
        border: isHighlighted ? "solid red" : "none",
        cursor: "pointer",
      }}
      onClick={() => selectMissile(isHighlighted ? null : missile.id)}
    >
      <span>
        {missile.name} #{missile.id}
      </span>
    </Box>
  );
}
