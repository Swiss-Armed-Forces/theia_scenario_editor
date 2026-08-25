import { useScenarioStore } from "../context/ScenarioStore";
import { useGuiStateStore } from "../context/GuiStateStore";
import DroneSwarmListItem from "./DroneSwarmListItem";

export default function DroneSwarmList() {
  const droneSwarms = useScenarioStore((state) => state.droneSwarms);

  const selectedDroneSwarmTargetId = useGuiStateStore(
    (state) => state.selectedDroneSwarmTargetId,
  );

  return (
    <>
      {droneSwarms.map((droneSwarm) => (
        <DroneSwarmListItem
          key={droneSwarm.target_id}
          droneSwarm={droneSwarm}
          isHighlighted={droneSwarm.target_id === selectedDroneSwarmTargetId}
        />
      ))}
    </>
  );
}
