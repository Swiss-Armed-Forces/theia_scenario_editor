import { useScenarioStore } from "../context/ScenarioStore";
import { useGuiStateStore } from "../context/GuiStateStore";
import CriticalInfrastructureListItem from "./CriticalInfrastructureListItem";

export default function CriticalInfrastructureList() {
  const criticalInfrastructure = useScenarioStore(
    (state) => state.criticalInfrastructure,
  );

  const selectedCriticalInfrastructureTargetId = useGuiStateStore(
    (state) => state.selectedCriticalInfrastructureTargetId,
  );

  return (
    <>
      {criticalInfrastructure.map((infra) => (
        <CriticalInfrastructureListItem
          key={infra.target_id}
          infra={infra}
          isHighlighted={infra.target_id === selectedCriticalInfrastructureTargetId}
        />
      ))}
    </>
  );
}
