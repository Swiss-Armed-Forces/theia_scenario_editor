import { Box } from "@mui/material";
import { useGuiStateStore } from "../context/GuiStateStore";
import type { CruiseMissile } from "../types/types";

export default function CruiseMissileListItem({
  missile,
  isHighlighted,
}: {
  missile: CruiseMissile;
  isHighlighted: boolean;
}) {
  const selectCruiseMissile = useGuiStateStore(
    (state) => state.selectCruiseMissile,
  );

  return (
    <Box
      className="SensorListItem"
      style={{
        border: isHighlighted ? "solid red" : "none",
        cursor: "pointer",
      }}
      onClick={() =>
        selectCruiseMissile(isHighlighted ? null : missile.target_id)
      }
    >
      <span>Cruise missile #{missile.target_id}</span>
    </Box>
  );
}
