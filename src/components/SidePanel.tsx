import { Button } from "@mui/material";
import type { MapClickListener } from "../types/types";
import AddRadars from "./AddRadars";
import SensorList from "./SensorList";
import { useSimulationStore } from "../context/SimulationResultStore";
import { useGuiStateStore } from "../context/GuiStateStore";
import { useScenarioStore } from "../context/ScenarioStore";
import CoverageCalcSettings from "./CoverageCalcSettings";

export default function SidePanel({
  setMapClickListener,
}: {
  setMapClickListener: (listener: MapClickListener | null) => void;
}) {
  const visibleSensorIds = useGuiStateStore((state) => state.visibleSensorIds);
  const monostaticCalcConf = useGuiStateStore(
    (state) => state.monostaticCoverageCalcConf,
  );
  // TODO: RED
  const monostaticSensors = useScenarioStore(
    (state) => state.blueMonostaticSensors,
  );
  const visibleMonostaticSensors = monostaticSensors.filter((sensor) =>
    visibleSensorIds.has(sensor.id),
  );
  const updateMonostaticCoverage = useSimulationStore(
    (state) => state.updateMonostaticCoverages,
  );
  return (
    <div className="sidePanel">
      <AddRadars setMapClickListener={setMapClickListener} />
      <fieldset>
        <legend>Sensor List</legend>
        <SensorList />
      </fieldset>
      <CoverageCalcSettings />
      <Button
      variant="contained"
        onClick={(_event) => {
          updateMonostaticCoverage(
            visibleMonostaticSensors,
            monostaticCalcConf,
          );
        }}
      >
        Calculate monostatic coverage
      </Button>
    </div>
  );
}
