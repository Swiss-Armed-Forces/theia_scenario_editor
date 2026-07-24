import { Button } from "@mui/material";
import {
  buildDefaultMonostaticSensor,
  type MapClickListener,
} from "../types/types";
import type { LatLng } from "leaflet";
import { useScenarioStore } from "../context/ScenarioStore";
import { elevationAt } from "../backend/backend";

export default function AddRadars({
  setMapClickListener,
}: {
  setMapClickListener: (listener: MapClickListener | null) => void;
}) {
  const addSensor = useScenarioStore((state) => state.addMonostaticSensor);
  const unusedIdMonostaticSensor = useScenarioStore(
    (state) => state.unusedIdSensor,
  );
  const unusedIdReceiver = useScenarioStore((state) => state.unusedIdReceiver);
  const unusedIdTransmitter = useScenarioStore(
    (state) => state.unusedIdTransmitter,
  );

  return (
    <fieldset className="addRadars">
      <legend>Add sensors</legend>
      <Button
        variant="contained"
        onClick={() => {
          // We need the "() => " because otherwise, the return value would be
          // considered an updater function.
          // However, we want the function itself to be the values, so we define
          // a trivial updater function that simply returns our callback.
          setMapClickListener(() => (p: LatLng) => {
            // Add the radar.
            // TODO: Select blue or red!
            elevationAt(p.lat, p.lng).then((alt) => {
              const newRadar = buildDefaultMonostaticSensor(
                {
                  lat: p.lat,
                  lon: p.lng,
                  alt: alt,
                },
                unusedIdReceiver,
                unusedIdTransmitter,
                unusedIdMonostaticSensor,
              );
              addSensor(newRadar, true);

              // Deactivate the listener.
              setMapClickListener(null);
            });
          });
        }}
      >
        Active radar
      </Button>
      <Button variant="contained">PCL</Button>
    </fieldset>
  );
}
