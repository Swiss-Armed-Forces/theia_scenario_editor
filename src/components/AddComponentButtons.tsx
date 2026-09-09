import { Button } from "@mui/material";
import type { LatLng } from "leaflet";
import { elevationAt } from "../backend/backend";
import { useGuiStateStore } from "../context/GuiStateStore";
import { useScenarioStore } from "../context/ScenarioStore";
import {
  buildDefaultCriticalInfrastructure,
  buildDefaultDroneSwarm,
  buildDefaultGbad,
  buildDefaultIndirectGbad,
  buildDefaultMissile,
  buildDefaultMonostaticSensor,
  buildDefaultPclReceiver,
} from "../types/types";
import { applyMonostaticSensorPreset } from "../util/monostaticSensorPresets";

function AddMonostaticSensorButton() {
  const addSensor = useScenarioStore((state) => state.addMonostaticSensor);
  const unusedIdMonostaticSensor = useScenarioStore(
    (state) => state.unusedIdSensor,
  );
  const unusedIdReceiver = useScenarioStore((state) => state.unusedIdReceiver);
  const unusedIdTransmitter = useScenarioStore(
    (state) => state.unusedIdTransmitter,
  );
  const unusedTargetId = useScenarioStore((state) => state.unusedTargetId);
  const setMapClickListener = useGuiStateStore(
    (state) => state.setMapClickListener,
  );
  const defaultConfigurations = useGuiStateStore(
    (state) => state.defaultMonostaticSensorConfigurations,
  );

  return (
    <Button
      variant="contained"
      onClick={() => {
        setMapClickListener((p: LatLng) => {
          elevationAt(p.lat, p.lng).then((alt) => {
            const point = { lat: p.lat, lon: p.lng, alt: alt };

            let newRadar = buildDefaultMonostaticSensor(
              point,
              unusedIdReceiver,
              unusedIdTransmitter,
              unusedIdMonostaticSensor,
              unusedTargetId,
            );
            // Seed newly placed sensors with the first backend-provided
            // preset rather than the hardcoded fallback defaults, if one is
            // available.
            if (defaultConfigurations.length > 0) {
              newRadar = applyMonostaticSensorPreset(
                newRadar,
                defaultConfigurations[0],
              );
            }
            addSensor(newRadar);

            setMapClickListener(null);
          });
        });
      }}
    >
      + Active Radar
    </Button>
  );
}

function AddPclSensorButton() {
  const addPclReceiver = useScenarioStore((state) => state.addPclReceiver);
  const unusedIdReceiver = useScenarioStore((state) => state.unusedIdReceiver);
  const unusedTargetId = useScenarioStore((state) => state.unusedTargetId);
  const setMapClickListener = useGuiStateStore(
    (state) => state.setMapClickListener,
  );
  const selectReceiver = useGuiStateStore((state) => state.selectReceiver);
  const setPclSelectionReceiverId = useGuiStateStore(
    (state) => state.setPclSelectionReceiverId,
  );

  return (
    <Button
      variant="contained"
      onClick={() => {
        setMapClickListener((p: LatLng) => {
          elevationAt(p.lat, p.lng).then((alt) => {
            const point = { lat: p.lat, lon: p.lng, alt: alt };

            const [newRadar, minPower, maxDistance] = buildDefaultPclReceiver(
              point,
              unusedIdReceiver,
              unusedTargetId,
            );
            addPclReceiver(newRadar, {
              min_power: minPower,
              max_dist: maxDistance,
            }).then(() => {
              // Drop straight into transmitter selection mode so the user
              // can immediately fine-tune the just-created receiver.
              selectReceiver(newRadar.receiver.id);
              setPclSelectionReceiverId(newRadar.receiver.id);
            });

            setMapClickListener(null);
          });
        });
      }}
    >
      + PCL Sensor
    </Button>
  );
}

function AddGbadButton() {
  const addGbad = useScenarioStore((state) => state.addGbad);
  const unusedIdEffector = useScenarioStore((state) => state.unusedIdEffector);
  const unusedTargetId = useScenarioStore((state) => state.unusedTargetId);
  const setMapClickListener = useGuiStateStore(
    (state) => state.setMapClickListener,
  );
  const selectGbad = useGuiStateStore((state) => state.selectGbad);

  return (
    <Button
      variant="contained"
      onClick={() => {
        setMapClickListener((p: LatLng) => {
          elevationAt(p.lat, p.lng).then((alt) => {
            const point = { lat: p.lat, lon: p.lng, alt: alt };

            const newGbad = buildDefaultGbad(
              point,
              unusedIdEffector,
              `Effector ${unusedIdEffector}`,
              unusedTargetId,
            );
            addGbad(newGbad);
            selectGbad(newGbad.gbad.id);

            setMapClickListener(null);
          });
        });
      }}
    >
      + GBAD Effector
    </Button>
  );
}

function AddIndirectGbadButton() {
  const addGbad = useScenarioStore((state) => state.addGbad);
  const unusedIdEffector = useScenarioStore((state) => state.unusedIdEffector);
  const unusedTargetId = useScenarioStore((state) => state.unusedTargetId);
  const setMapClickListener = useGuiStateStore(
    (state) => state.setMapClickListener,
  );
  const selectGbad = useGuiStateStore((state) => state.selectGbad);

  return (
    <Button
      variant="contained"
      onClick={() => {
        setMapClickListener((p: LatLng) => {
          elevationAt(p.lat, p.lng).then((alt) => {
            const point = { lat: p.lat, lon: p.lng, alt: alt };

            const newGbad = buildDefaultIndirectGbad(
              point,
              unusedIdEffector,
              `Effector ${unusedIdEffector}`,
              unusedTargetId,
            );
            addGbad(newGbad);
            selectGbad(newGbad.gbad.id);

            setMapClickListener(null);
          });
        });
      }}
    >
      + Indirect Fire GBAD
    </Button>
  );
}

function AddMissileButton() {
  const addMissile = useScenarioStore((state) => state.addMissile);
  const unusedTargetId = useScenarioStore((state) => state.unusedTargetId);
  const unusedIdEffector = useScenarioStore((state) => state.unusedIdEffector);
  const terrainModels = useGuiStateStore((state) => state.terrainModels);
  const setMapClickListener = useGuiStateStore(
    (state) => state.setMapClickListener,
  );
  const setPendingMissileStart = useGuiStateStore(
    (state) => state.setPendingMissileStart,
  );
  const selectMissile = useGuiStateStore((state) => state.selectMissile);

  return (
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
                  unusedTargetId,
                  unusedIdEffector,
                  { terrain_name: terrainModels[0] ?? "" },
                );
                addMissile(newMissile);
                selectMissile(newMissile.target_id);

                setPendingMissileStart(null);
                setMapClickListener(null);
              });
            });
          });
        });
      }}
    >
      + Missile
    </Button>
  );
}

function AddDroneSwarmButton() {
  const addDroneSwarm = useScenarioStore((state) => state.addDroneSwarm);
  const unusedTargetId = useScenarioStore((state) => state.unusedTargetId);
  const terrainModels = useGuiStateStore((state) => state.terrainModels);
  const setMapClickListener = useGuiStateStore(
    (state) => state.setMapClickListener,
  );
  const selectDroneSwarm = useGuiStateStore((state) => state.selectDroneSwarm);

  return (
    <Button
      variant="contained"
      onClick={() => {
        setMapClickListener((p: LatLng) => {
          elevationAt(p.lat, p.lng).then((alt) => {
            const point = { lat: p.lat, lon: p.lng, alt: alt };

            const newDroneSwarm = buildDefaultDroneSwarm(point, unusedTargetId, {
              terrain_name: terrainModels[0] ?? "",
            });
            addDroneSwarm(newDroneSwarm);
            selectDroneSwarm(newDroneSwarm.target_id);

            setMapClickListener(null);
          });
        });
      }}
    >
      + Drone Swarm
    </Button>
  );
}

function AddCriticalInfrastructureButton() {
  const addCriticalInfrastructure = useScenarioStore(
    (state) => state.addCriticalInfrastructure,
  );
  const unusedTargetId = useScenarioStore((state) => state.unusedTargetId);
  const setMapClickListener = useGuiStateStore(
    (state) => state.setMapClickListener,
  );
  const selectCriticalInfrastructure = useGuiStateStore(
    (state) => state.selectCriticalInfrastructure,
  );

  return (
    <Button
      variant="contained"
      onClick={() => {
        setMapClickListener((p: LatLng) => {
          elevationAt(p.lat, p.lng).then((alt) => {
            const point = { lat: p.lat, lon: p.lng, alt: alt };

            const newInfra = buildDefaultCriticalInfrastructure(
              point,
              unusedTargetId,
            );
            addCriticalInfrastructure(newInfra);
            selectCriticalInfrastructure(newInfra.target_id);

            setMapClickListener(null);
          });
        });
      }}
    >
      + Critical Infrastructure
    </Button>
  );
}

export default function AddComponentButtons() {
  return (
    <div className="addComponentButtons">
      <AddMonostaticSensorButton />
      <AddPclSensorButton />
      <AddGbadButton />
      <AddIndirectGbadButton />
      <AddMissileButton />
      <AddDroneSwarmButton />
      <AddCriticalInfrastructureButton />
    </div>
  );
}
