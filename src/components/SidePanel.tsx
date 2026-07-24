import { useState } from "react";
import { Box, Button, Tab, Tabs } from "@mui/material";
import MonostaticSensorList from "./MonostaticSensorList";
import { useSimulationStore } from "../context/SimulationResultStore";
import { useGuiStateStore } from "../context/GuiStateStore";
import { useScenarioStore } from "../context/ScenarioStore";
import MonostaticCoverageCalcSettings from "./MonostaticCoverageCalcSettings";
import MonostaticSensorSettings from "./MonostaticSensorSettings";
import PclSensorList from "./PclSensorList";
import PclSensorSettings from "./PclSensorSettings";
import PclCoverageCalcSettings from "./PclCoverageCalcSettings";

export default function SidePanel() {
  const [activeTab, setActiveTab] = useState(0);

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
      <Tabs
        className="sidePanelTabs"
        value={activeTab}
        onChange={(_event, value: number) => setActiveTab(value)}
        variant="fullWidth"
      >
        <Tab label="Active Radar" />
        <Tab label="PCL" />
      </Tabs>
      <Box className="sidePanelTabContent">
        {activeTab === 0 && (
          <div className="sidePanelSection">
            <MonostaticSensorSettings />
            <MonostaticSensorList />
            <MonostaticCoverageCalcSettings />
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
        )}
        {activeTab === 1 && (
          <div className="sidePanelSection">
            <PclSensorSettings />
            <PclSensorList />
            <PclCoverageCalcSettings />
            <Button variant="contained" onClick={(_event) => {}}>
              Calculate min. det. RCS
            </Button>
          </div>
        )}
      </Box>
    </div>
  );
}
