import { useState } from "react";
import ScenarioMap from "./ScenarioMap";
import SidePanel from "./SidePanel";
import { type MapClickListener } from "../types/types";

export default function ContentContainer() {
  // React to map clicks (i. e. fetch a coordinate).
  const [mapClickListener, setMapClickListener] =
    useState<MapClickListener | null>(null);

  return (
    <div className="contentContainer">
      <SidePanel setMapClickListener={setMapClickListener} />
      <ScenarioMap mapClickListener={mapClickListener} />
    </div>
  );
}
