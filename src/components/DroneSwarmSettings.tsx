import { useMemo } from "react";
import { useGuiStateStore } from "../context/GuiStateStore";
import { useScenarioStore } from "../context/ScenarioStore";
import { buildSwarmTrajectory } from "../util/swarmTrajectory";
import { resizeWaypoints } from "../util/waypoints";
import { fromDatetimeLocalValue, toDatetimeLocalValue } from "../util/datetime";

const MIN_WAYPOINTS = 2;

export default function DroneSwarmSettings() {
  const selectedDroneSwarmTargetId = useGuiStateStore(
    (state) => state.selectedDroneSwarmTargetId,
  );
  const droneSwarm = useScenarioStore((state) => state.droneSwarms).find(
    (d) => d.target_id === selectedDroneSwarmTargetId,
  );
  const terrainModels = useGuiStateStore((state) => state.terrainModels);

  const updateDroneSwarm = useScenarioStore((state) => state.updateDroneSwarm);

  const trajectory = useMemo(() => {
    if (!droneSwarm) {
      return null;
    }
    return buildSwarmTrajectory(
      droneSwarm.waypoints,
      droneSwarm.velocity,
      droneSwarm.cruiseAltitude,
      droneSwarm.t_start,
      droneSwarm.target_id,
      droneSwarm.rcs,
    );
  }, [droneSwarm]);

  let content = <></>;
  if (droneSwarm) {
    const durationSeconds =
      trajectory && trajectory.times.length > 0
        ? (new Date(trajectory.times[trajectory.times.length - 1]).getTime() -
            new Date(trajectory.times[0]).getTime()) /
          1000
        : 0;

    content = (
      <>
        <label># Waypoints</label>
        <input
          type="number"
          min={MIN_WAYPOINTS}
          value={droneSwarm.waypoints.length}
          onChange={(event) => {
            const count = Math.max(
              MIN_WAYPOINTS,
              parseInt(event.target.value) || MIN_WAYPOINTS,
            );
            const newDroneSwarm = structuredClone(droneSwarm);
            newDroneSwarm.waypoints = resizeWaypoints(
              droneSwarm.waypoints,
              count,
            );
            updateDroneSwarm(newDroneSwarm);
          }}
        />
        <label>Velocity [m/s]</label>
        <input
          type="number"
          value={droneSwarm.velocity}
          onChange={(event) => {
            const newDroneSwarm = structuredClone(droneSwarm);
            newDroneSwarm.velocity = parseFloat(event.target.value);
            updateDroneSwarm(newDroneSwarm);
          }}
        />
        <label>Cruise altitude [MASL]</label>
        <input
          type="number"
          value={droneSwarm.cruiseAltitude}
          onChange={(event) => {
            const newDroneSwarm = structuredClone(droneSwarm);
            newDroneSwarm.cruiseAltitude = parseFloat(event.target.value);
            updateDroneSwarm(newDroneSwarm);
          }}
        />
        <label>Start time</label>
        <input
          type="datetime-local"
          value={toDatetimeLocalValue(droneSwarm.t_start)}
          onChange={(event) => {
            if (!event.target.value) {
              return;
            }
            const newDroneSwarm = structuredClone(droneSwarm);
            newDroneSwarm.t_start = fromDatetimeLocalValue(event.target.value);
            updateDroneSwarm(newDroneSwarm);
          }}
        />
        <label>Duration</label>
        <span>{durationSeconds.toFixed(0)} s</span>
        <label>RCS [m²]</label>
        <input
          type="number"
          value={droneSwarm.rcs}
          onChange={(event) => {
            const newDroneSwarm = structuredClone(droneSwarm);
            newDroneSwarm.rcs = parseFloat(event.target.value);
            updateDroneSwarm(newDroneSwarm);
          }}
        />
        <label># Drones</label>
        <input
          type="number"
          min={1}
          value={droneSwarm.n_drones}
          onChange={(event) => {
            const newDroneSwarm = structuredClone(droneSwarm);
            newDroneSwarm.n_drones = Math.max(
              1,
              parseInt(event.target.value) || 1,
            );
            updateDroneSwarm(newDroneSwarm);
          }}
        />
        <label>Lateral max deviation [m]</label>
        <input
          type="number"
          value={droneSwarm.lateral_max_deviation}
          onChange={(event) => {
            const newDroneSwarm = structuredClone(droneSwarm);
            newDroneSwarm.lateral_max_deviation = parseFloat(
              event.target.value,
            );
            updateDroneSwarm(newDroneSwarm);
          }}
        />
        <label>Up max deviation [m]</label>
        <input
          type="number"
          value={droneSwarm.up_max_deviation}
          onChange={(event) => {
            const newDroneSwarm = structuredClone(droneSwarm);
            newDroneSwarm.up_max_deviation = parseFloat(event.target.value);
            updateDroneSwarm(newDroneSwarm);
          }}
        />
        <label>Effector range [m]</label>
        <input
          type="number"
          value={droneSwarm.effectorRange}
          onChange={(event) => {
            const newDroneSwarm = structuredClone(droneSwarm);
            newDroneSwarm.effectorRange = parseFloat(event.target.value);
            updateDroneSwarm(newDroneSwarm);
          }}
        />
        <label>Terrain</label>
        <select
          value={droneSwarm.terrain.terrain_name}
          onChange={(event) => {
            const newDroneSwarm = structuredClone(droneSwarm);
            newDroneSwarm.terrain = { terrain_name: event.target.value };
            updateDroneSwarm(newDroneSwarm);
          }}
        >
          {!terrainModels.includes(droneSwarm.terrain.terrain_name) && (
            <option value={droneSwarm.terrain.terrain_name}>
              {droneSwarm.terrain.terrain_name}
            </option>
          )}
          {terrainModels.map((terrain) => (
            <option key={terrain} value={terrain}>
              {terrain}
            </option>
          ))}
        </select>
      </>
    );
  }

  return (
    <fieldset
      className="SensorSettingsContainer"
      style={{ maxHeight: "30%", overflow: "scroll" }}
    >
      <legend>Drone Swarm Settings</legend>
      {content}
    </fieldset>
  );
}
