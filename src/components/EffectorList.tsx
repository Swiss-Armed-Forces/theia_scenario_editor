import { Button } from "@mui/material";
import { useScenarioStore } from "../context/ScenarioStore";
import { buildDefaultEffector } from "../types/types";
import { useGuiStateStore } from "../context/GuiStateStore";

import type { LatLng } from "leaflet";
import { elevationAt } from "../backend/backend";
import EffectorListItem from "./EffectorListItem";

export default function EffectorList() {
  const effectors = useScenarioStore((state) => state.effectors);

  const selectedEffectorId = useGuiStateStore(
    (state) => state.selectedEffectorId,
  );
  const selectEffector = useGuiStateStore((state) => state.selectEffector);

  const addEffector = useScenarioStore((state) => state.addEffector);
  const unusedIdEffector = useScenarioStore((state) => state.unusedIdEffector);
  const setMapClickListener = useGuiStateStore(
    (state) => state.setMapClickListener,
  );

  return (
    <fieldset className="SensorList">
      <legend>Effector List</legend>
      {effectors.map((effector) => (
        <EffectorListItem
          key={effector.id}
          effector={effector}
          isHighlighted={effector.id === selectedEffectorId}
        />
      ))}
      <Button
        variant="contained"
        onClick={() => {
          // We need the "() => " because otherwise, the return value would be
          // considered an updater function.
          // However, we want the function itself to be the values, so we define
          // a trivial updater function that simply returns our callback.
          setMapClickListener((p: LatLng) => {
            elevationAt(p.lat, p.lng).then((alt) => {
              const point = {
                lat: p.lat,
                lon: p.lng,
                alt: alt,
              };

              const newEffector = buildDefaultEffector(
                point,
                unusedIdEffector,
                `Effector ${unusedIdEffector}`,
              );
              addEffector(newEffector);
              selectEffector(newEffector.id);

              // Deactivate the listener.
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
