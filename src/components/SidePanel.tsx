import { useState } from "react";
import { Button } from "@mui/material";
import MonostaticSensorList from "./MonostaticSensorList";
import { useSimulationStore } from "../context/SimulationResultStore";
import { useGuiStateStore } from "../context/GuiStateStore";
import { useScenarioStore } from "../context/ScenarioStore";
import MonostaticCoverageCalcSettings from "./MonostaticCoverageCalcSettings";
import MonostaticSensorSettings from "./MonostaticSensorSettings";
import PclSensorList from "./PclSensorList";
import PclSensorSettings from "./PclSensorSettings";
import PclCoverageCalcSettings from "./PclCoverageCalcSettings";
import GbadList from "./GbadList";
import GbadSettings from "./GbadSettings";
import MissileList from "./MissileList";
import MissileSettings from "./MissileSettings";
import DroneSwarmList from "./DroneSwarmList";
import DroneSwarmSettings from "./DroneSwarmSettings";
import CriticalInfrastructureList from "./CriticalInfrastructureList";
import CriticalInfrastructureSettings from "./CriticalInfrastructureSettings";
import TreeCategory from "./TreeCategory";
import AddComponentButtons from "./AddComponentButtons";

export default function SidePanel() {
  const [expandedCategories, setExpandedCategories] = useState({
    monostatic: true,
    pcl: true,
    gbad: true,
    missiles: true,
    drones: true,
    criticalInfrastructure: true,
  });

  function toggleExpanded(key: keyof typeof expandedCategories) {
    setExpandedCategories((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  const calcSettingsView = useGuiStateStore(
    (state) => state.activeCalcSettingsView,
  );
  const setActiveCalcSettingsView = useGuiStateStore(
    (state) => state.setActiveCalcSettingsView,
  );

  const selectedReceiverId = useGuiStateStore(
    (state) => state.selectedReceiverId,
  );
  const selectedGbadId = useGuiStateStore((state) => state.selectedGbadId);
  const selectedMissileTargetId = useGuiStateStore(
    (state) => state.selectedMissileTargetId,
  );
  const selectedDroneSwarmTargetId = useGuiStateStore(
    (state) => state.selectedDroneSwarmTargetId,
  );
  const selectedCriticalInfrastructureTargetId = useGuiStateStore(
    (state) => state.selectedCriticalInfrastructureTargetId,
  );
  const hasItemSelected =
    selectedReceiverId !== null ||
    selectedGbadId !== null ||
    selectedMissileTargetId !== null ||
    selectedDroneSwarmTargetId !== null ||
    selectedCriticalInfrastructureTargetId !== null;

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

  const pclReceivers = useScenarioStore((state) => state.pclReceivers);
  const gbads = useScenarioStore((state) => state.gbads);
  const ballisticMissiles = useScenarioStore((state) => state.ballisticMissiles);
  const droneSwarms = useScenarioStore((state) => state.droneSwarms);
  const criticalInfrastructure = useScenarioStore(
    (state) => state.criticalInfrastructure,
  );

  return (
    <div className="sidePanel">
      <div className="componentTree">
        <TreeCategory
          title="Active Radar"
          count={monostaticSensors.length}
          expanded={expandedCategories.monostatic}
          onToggleExpand={() => toggleExpanded("monostatic")}
          hasSettings
          isSettingsActive={calcSettingsView === "monostatic"}
          onToggleSettings={() =>
            setActiveCalcSettingsView(
              calcSettingsView === "monostatic" ? null : "monostatic",
            )
          }
        >
          <MonostaticSensorList />
        </TreeCategory>
        <TreeCategory
          title="PCL"
          count={pclReceivers.length}
          expanded={expandedCategories.pcl}
          onToggleExpand={() => toggleExpanded("pcl")}
          hasSettings
          isSettingsActive={calcSettingsView === "pcl"}
          onToggleSettings={() =>
            setActiveCalcSettingsView(calcSettingsView === "pcl" ? null : "pcl")
          }
        >
          <PclSensorList />
        </TreeCategory>
        <TreeCategory
          title="GBAD"
          count={gbads.length}
          expanded={expandedCategories.gbad}
          onToggleExpand={() => toggleExpanded("gbad")}
        >
          <GbadList />
        </TreeCategory>
        <TreeCategory
          title="Missiles"
          count={ballisticMissiles.length}
          expanded={expandedCategories.missiles}
          onToggleExpand={() => toggleExpanded("missiles")}
        >
          <MissileList />
        </TreeCategory>
        <TreeCategory
          title="Drones"
          count={droneSwarms.length}
          expanded={expandedCategories.drones}
          onToggleExpand={() => toggleExpanded("drones")}
        >
          <DroneSwarmList />
        </TreeCategory>
        <TreeCategory
          title="Critical Infrastructure"
          count={criticalInfrastructure.length}
          expanded={expandedCategories.criticalInfrastructure}
          onToggleExpand={() => toggleExpanded("criticalInfrastructure")}
        >
          <CriticalInfrastructureList />
        </TreeCategory>
      </div>

      <div className="settingsPanel">
        {calcSettingsView === "monostatic" && (
          <div className="settingsPanelSection">
            <MonostaticCoverageCalcSettings />
            <Button
              variant="contained"
              onClick={() => {
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
        {calcSettingsView === "pcl" && (
          <div className="settingsPanelSection">
            <PclCoverageCalcSettings />
            <Button
              variant="contained"
              onClick={() => {
                updateMinDetectableRcsGrids(visiblePclSensors, pclCalcConf);
              }}
            >
              Calculate min. det. RCS
            </Button>
          </div>
        )}
        {calcSettingsView === null && (
          <>
            <MonostaticSensorSettings />
            <PclSensorSettings />
            <GbadSettings />
            <MissileSettings />
            <DroneSwarmSettings />
            <CriticalInfrastructureSettings />
            {!hasItemSelected && (
              <div className="sidePanelPlaceholder settingsPanelPlaceholder">
                Select a component to edit its settings, or click a
                category&rsquo;s gear icon for coverage calculation settings.
              </div>
            )}
          </>
        )}
      </div>

      <AddComponentButtons />
    </div>
  );
}
