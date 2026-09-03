import { useScenarioStore } from "../context/ScenarioStore";
import { useGuiStateStore } from "../context/GuiStateStore";
import GbadListItem from "./GbadListItem";

export default function GbadList() {
  const gbads = useScenarioStore((state) => state.gbads);

  const selectedGbadId = useGuiStateStore((state) => state.selectedGbadId);

  return (
    <>
      {gbads.map((gbad) => (
        <GbadListItem
          key={gbad.gbad.id}
          effector={gbad.gbad}
          isHighlighted={gbad.gbad.id === selectedGbadId}
        />
      ))}
    </>
  );
}
