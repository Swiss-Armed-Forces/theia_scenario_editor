import { Button } from "@mui/material";
import { useScenarioStore } from "../context/ScenarioStore";
import { buildDefaultDroneSwarm } from "../types/types";
import { useGuiStateStore } from "../context/GuiStateStore";

import type { LatLng } from "leaflet";
import { elevationAt } from "../backend/backend";
import DroneSwarmListItem from "./DroneSwarmListItem";

export default function DroneSwarmList() {
  const droneSwarms = useScenarioStore((state) => state.droneSwarms);

  const selectedDroneSwarmTargetId = useGuiStateStore(
    (state) => state.selectedDroneSwarmTargetId,
  );
  const selectDroneSwarm = useGuiStateStore((state) => state.selectDroneSwarm);

  const addDroneSwarm = useScenarioStore((state) => state.addDroneSwarm);
  const unusedTargetId = useScenarioStore((state) => state.unusedTargetId);
  const terrainModels = useGuiStateStore((state) => state.terrainModels);
  const setMapClickListener = useGuiStateStore(
    (state) => state.setMapClickListener,
  );

  return (
    <fieldset className="SensorList">
      <legend>Drone Swarm List</legend>
      {droneSwarms.map((droneSwarm) => (
        <DroneSwarmListItem
          key={droneSwarm.target_id}
          droneSwarm={droneSwarm}
          isHighlighted={droneSwarm.target_id === selectedDroneSwarmTargetId}
        />
      ))}
      <Button
        variant="contained"
        onClick={() => {
          setMapClickListener((p: LatLng) => {
            elevationAt(p.lat, p.lng).then((alt) => {
              const point = {
                lat: p.lat,
                lon: p.lng,
                alt: alt,
              };

              const newDroneSwarm = buildDefaultDroneSwarm(
                point,
                unusedTargetId,
                { terrain_name: terrainModels[0] ?? "" },
              );
              addDroneSwarm(newDroneSwarm);
              selectDroneSwarm(newDroneSwarm.target_id);

              setMapClickListener(null);
            });
          });
        }}
      >
        +
      </Button>
    </fieldset>
  );
}
