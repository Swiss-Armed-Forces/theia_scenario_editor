import { useScenarioStore } from "../context/ScenarioStore";
import { useGuiStateStore } from "../context/GuiStateStore";
import SensorListItem from "./SensorListItem";

export default function MonostaticSensorList() {
  const sensors = useScenarioStore((state) => state.monostaticSensors);

  const highlightedReceiverId = useGuiStateStore(
    (state) => state.selectedReceiverId,
  );

  return (
    <>
      {sensors.map((sensor, i) => (
        <SensorListItem
          key={i}
          sensor={sensor.sensor}
          isHighlighted={sensor.sensor.receiver.id == highlightedReceiverId}
        />
      ))}
    </>
  );
}
