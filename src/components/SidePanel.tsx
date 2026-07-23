import type { MapClickListener } from "../types/types";
import AddRadars from "./AddRadars";
import SensorList from "./SensorList";

export default function SidePanel({
  setMapClickListener,
}: {
  setMapClickListener: (listener: MapClickListener | null) => void;
}) {
  return (
    <div className="sidePanel">
      <AddRadars setMapClickListener={setMapClickListener} />
      <fieldset>
        <legend>Sensor List</legend>
        <SensorList />
      </fieldset>
    </div>
  );
}
