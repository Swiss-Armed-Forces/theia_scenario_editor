import { useState } from "react";
import { Box, Button, Tab, Tabs } from "@mui/material";
import SensorList from "./SensorList";
import { useSimulationStore } from "../context/SimulationResultStore";
import { useGuiStateStore } from "../context/GuiStateStore";
import { useScenarioStore } from "../context/ScenarioStore";
import CoverageCalcSettings from "./CoverageCalcSettings";
import MonostaticSensorSettings from "./MonostaticSensorSettings";

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
            <SensorList />
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
        )}
        {activeTab === 1 && (
          <div className="sidePanelSection sidePanelPlaceholder">
            PCL settings coming soon.
          </div>
        )}
      </Box>
    </div>
  );
}
