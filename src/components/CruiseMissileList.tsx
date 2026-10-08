import { useScenarioStore } from "../context/ScenarioStore";
import { useGuiStateStore } from "../context/GuiStateStore";
import CruiseMissileListItem from "./CruiseMissileListItem";

export default function CruiseMissileList() {
  const cruiseMissiles = useScenarioStore((state) => state.cruiseMissiles);

  const selectedCruiseMissileTargetId = useGuiStateStore(
    (state) => state.selectedCruiseMissileTargetId,
  );

  return (
    <>
      {cruiseMissiles.map((missile) => (
        <CruiseMissileListItem
          key={missile.target_id}
          missile={missile}
          isHighlighted={missile.target_id === selectedCruiseMissileTargetId}
        />
      ))}
    </>
  );
}
