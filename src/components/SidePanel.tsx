import type { MapClickListener, SensorPortfolio } from "../types/types";
import AddRadars from "./AddRadars";

export default function SidePanel({
  setMapClickListener,
  sensorPortfolio,
  setSensorPortfolio,
}: {
  setMapClickListener: (listener: MapClickListener | null) => void;
  sensorPortfolio: SensorPortfolio;
  setSensorPortfolio: (portfolio: SensorPortfolio) => void;
}) {
  return (
    <div className="sidePanel">
      <AddRadars
        setMapClickListener={setMapClickListener}
        sensorPortfolio={sensorPortfolio}
        setSensorPortfolio={setSensorPortfolio}
      />
    </div>
  );
}
