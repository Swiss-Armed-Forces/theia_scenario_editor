import { useScenarioStore } from "../context/ScenarioStore";
import { useGuiStateStore } from "../context/GuiStateStore";
import EffectorListItem from "./EffectorListItem";

export default function EffectorList() {
  const effectors = useScenarioStore((state) => state.effectors);

  const selectedEffectorId = useGuiStateStore(
    (state) => state.selectedEffectorId,
  );

  return (
    <>
      {effectors.map((detectableEffector) => (
        <EffectorListItem
          key={detectableEffector.effector.id}
          effector={detectableEffector.effector}
          isHighlighted={detectableEffector.effector.id === selectedEffectorId}
        />
      ))}
    </>
  );
}
