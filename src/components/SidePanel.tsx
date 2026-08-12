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
import EffectorList from "./EffectorList";
import EffectorSettings from "./EffectorSettings";
import MissileList from "./MissileList";
import MissileSettings from "./MissileSettings";
import DroneSwarmList from "./DroneSwarmList";
import DroneSwarmSettings from "./DroneSwarmSettings";

export default function SidePanel() {
  const [activeTab, setActiveTab] = useState(0);

  const visibleSensorIds = useGuiStateStore((state) => state.visibleSensorIds);
  const monostaticCalcConf = useGuiStateStore(
    (state) => state.monostaticCoverageCalcConf,
  );
  const pclCalcConf = useGuiStateStore((state) => state.pclCoverageCalcConf);
  const monostaticSensors = useScenarioStore(
    (state) => state.monostaticSensors,
  );
  const visibleMonostaticSensors = monostaticSensors
    .filter((sensor) => visibleSensorIds.has(sensor.sensor.id))
    .map((sensor) => sensor.sensor);
  const pclSensors = useScenarioStore((state) => state.pclSensors);
  const visiblePclSensors = pclSensors
    .filter((sensor) => visibleSensorIds.has(sensor.sensor.id))
    .map((sensor) => sensor.sensor);
  const updateMonostaticCoverage = useSimulationStore(
    (state) => state.updateMonostaticCoverages,
  );
  const updateMinDetectableRcsGrids = useSimulationStore(
    (state) => state.updateMinDetectableRcsGrids,
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
        <Tab label="GBAD" />
        <Tab label="Missiles" />
        <Tab label="Drones" />
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
            <Button
              variant="contained"
              onClick={(_event) => {
                updateMinDetectableRcsGrids(visiblePclSensors, pclCalcConf);
              }}
            >
              Calculate min. det. RCS
            </Button>
          </div>
        )}
        {activeTab === 2 && (
          <div className="sidePanelSection">
            <EffectorSettings />
            <EffectorList />
          </div>
        )}
        {activeTab === 3 && (
          <div className="sidePanelSection">
            <MissileSettings />
            <MissileList />
          </div>
        )}
        {activeTab === 4 && (
          <div className="sidePanelSection">
            <DroneSwarmSettings />
            <DroneSwarmList />
          </div>
        )}
      </Box>
    </div>
  );
}
