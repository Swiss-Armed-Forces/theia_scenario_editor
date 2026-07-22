import type { MapClickListener } from "../types/types";
import AddRadars from "./AddRadars";

export default function SidePanel({
  setMapClickListener,
}: {
  setMapClickListener: (listener: MapClickListener | null) => void;
}) {
  return (
    <div className="sidePanel">
      <AddRadars setMapClickListener={setMapClickListener} />
    </div>
  );
}
