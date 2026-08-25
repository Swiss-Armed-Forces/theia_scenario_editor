import { useScenarioStore } from "../context/ScenarioStore";
import { useGuiStateStore } from "../context/GuiStateStore";
import MissileListItem from "./MissileListItem";

export default function MissileList() {
  const ballisticMissiles = useScenarioStore(
    (state) => state.ballisticMissiles,
  );

  const selectedMissileTargetId = useGuiStateStore(
    (state) => state.selectedMissileTargetId,
  );

  return (
    <>
      {ballisticMissiles.map((missile) => (
        <MissileListItem
          key={missile.target_id}
          missile={missile}
          isHighlighted={missile.target_id === selectedMissileTargetId}
        />
      ))}
    </>
  );
}
