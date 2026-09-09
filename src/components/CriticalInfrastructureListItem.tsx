import { Box } from "@mui/material";
import { useGuiStateStore } from "../context/GuiStateStore";
import type { CriticalInfrastructure } from "../types/types";

export default function CriticalInfrastructureListItem({
  infra,
  isHighlighted,
}: {
  infra: CriticalInfrastructure;
  isHighlighted: boolean;
}) {
  const selectCriticalInfrastructure = useGuiStateStore(
    (state) => state.selectCriticalInfrastructure,
  );

  return (
    <Box
      className="SensorListItem"
      style={{
        border: isHighlighted ? "solid red" : "none",
        cursor: "pointer",
      }}
      onClick={() =>
        selectCriticalInfrastructure(isHighlighted ? null : infra.target_id)
      }
    >
      <span>
        {infra.name} #{infra.target_id}
      </span>
    </Box>
  );
}
