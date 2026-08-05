import { Button } from "@mui/material";
import { useScenarioStore } from "../context/ScenarioStore";
import { buildDefaultMissile } from "../types/types";
import { useGuiStateStore } from "../context/GuiStateStore";

import type { LatLng } from "leaflet";
import { elevationAt } from "../backend/backend";
import MissileListItem from "./MissileListItem";

export default function MissileList() {
  const ballisticMissiles = useScenarioStore(
    (state) => state.ballisticMissiles,
  );

  const selectedMissileId = useGuiStateStore((state) => state.selectedMissileId);
  const selectMissile = useGuiStateStore((state) => state.selectMissile);

  const addMissile = useScenarioStore((state) => state.addMissile);
  const unusedIdMissile = useScenarioStore((state) => state.unusedIdMissile);
  const unusedTargetId = useScenarioStore((state) => state.unusedTargetId);
  const terrainModels = useGuiStateStore((state) => state.terrainModels);
  const setMapClickListener = useGuiStateStore(
    (state) => state.setMapClickListener,
  );
  const setPendingMissileStart = useGuiStateStore(
    (state) => state.setPendingMissileStart,
  );

  return (
    <fieldset className="SensorList">
      <legend>Missile List</legend>
      {ballisticMissiles.map((missile) => (
        <MissileListItem
          key={missile.id}
          missile={missile}
          isHighlighted={missile.id === selectedMissileId}
        />
      ))}
      <Button
        variant="contained"
        onClick={() => {
          // Arm the click listener for the start point first; once that
          // click lands, re-arm it for the stop point before building the
          // missile, mirroring the single-click "place a new X" pattern
          // used by every other entity but chained twice.
          setMapClickListener((pStart: LatLng) => {
            elevationAt(pStart.lat, pStart.lng).then((altStart) => {
              const p_start = {
                lat: pStart.lat,
                lon: pStart.lng,
                alt: altStart,
              };
              setPendingMissileStart(p_start);

              setMapClickListener((pStop: LatLng) => {
                elevationAt(pStop.lat, pStop.lng).then((altStop) => {
                  const p_stop = {
                    lat: pStop.lat,
                    lon: pStop.lng,
                    alt: altStop,
                  };

                  const newMissile = buildDefaultMissile(
                    p_start,
                    p_stop,
                    unusedIdMissile,
                    `Missile ${unusedIdMissile}`,
                    unusedTargetId,
                    { terrain_name: terrainModels[0] ?? "" },
                  );
                  addMissile(newMissile);
                  selectMissile(newMissile.id);

                  setPendingMissileStart(null);
                  setMapClickListener(null);
                });
              });
            });
          });
        }}
      >
        +
      </Button>
    </fieldset>
  );
}
