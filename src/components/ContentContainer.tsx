import ScenarioMap from "./ScenarioMap";
import SidePanel from "./SidePanel";

export default function ContentContainer() {
  return (
    <div className="contentContainer">
      <SidePanel />
      <ScenarioMap />
    </div>
  );
}
