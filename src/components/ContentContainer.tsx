import { useState } from "react";
import ScenarioMap from "./ScenarioMap";
import SidePanel from "./SidePanel";
import { type MapClickListener, type SensorPortfolio } from "../types/types";

export default function ContentContainer() {
  // Data.
  const [sensorPortfolio, setSensorPortfolio] = useState<SensorPortfolio>({
    blueMonostaticSensors: [],
    redMonostaticSensors: [],
  });

  // React to map clicks (i. e. fetch a coordinate).
  const [mapClickListener, setMapClickListener] =
    useState<MapClickListener | null>(null);

  return (
    <div className="contentContainer">
      <SidePanel
        setMapClickListener={setMapClickListener}
        sensorPortfolio={sensorPortfolio}
        setSensorPortfolio={setSensorPortfolio}
      />
      <ScenarioMap
        mapClickListener={mapClickListener}
        sensorPortfolio={sensorPortfolio}
      />
    </div>
  );
}
