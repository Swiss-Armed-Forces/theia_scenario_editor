import { Button } from "@mui/material";
import {
  buildDefaultMonostaticSensor,
  type MapClickListener,
  type SensorPortfolio,
} from "../types/types";
import type { LatLng } from "leaflet";

export default function AddRadars({
  setMapClickListener,
  sensorPortfolio,
  setSensorPortfolio,
}: {
  setMapClickListener: (listener: MapClickListener | null) => void;
  sensorPortfolio: SensorPortfolio;
  setSensorPortfolio: (portfolio: SensorPortfolio) => void;
}) {
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
            // TODO: Use correct altitude!
            // TODO: Use correct IDs!
            // TODO: Select blue or red!
            const newRadar = buildDefaultMonostaticSensor({
              lat: p.lat,
              lon: p.lng,
              alt: 0.0, 
            },
            
            0,
            0,
            0,
          );
            const newPortfolio = structuredClone(sensorPortfolio);
            newPortfolio.blueMonostaticSensors.push(newRadar);
            setSensorPortfolio(newPortfolio);
            console.log(`Add radar at position ${p}`);

            // Deactivate the listener.
            setMapClickListener(null);
          });
        }}
      >
        Active radar
      </Button>
      <Button variant="contained">PCL</Button>
    </fieldset>
  );
}
