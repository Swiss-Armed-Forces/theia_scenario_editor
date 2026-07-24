import ScenarioMap from "./ScenarioMap";
import SidePanel from "./SidePanel";

export default function ContentContainer() {
  // React to map clicks (i. e. fetch a coordinate).

  return (
    <div className="contentContainer">
      <SidePanel />
      <ScenarioMap />
    </div>
  );
}
