import { Button } from "@mui/material";
import { useRef } from "react";
import { useScenarioStore } from "../context/ScenarioStore";
import { useSimulationStore } from "../context/SimulationResultStore";
import { useGuiStateStore } from "../context/GuiStateStore";
import { deserializeFile, type SerializedFile } from "../context/persistence";

export default function ImportButton() {
  const inputRef = useRef<HTMLInputElement>(null);
  const showSensor = useGuiStateStore((state) => state.showSensor);

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".json"
        onChange={async (event) => {
          const files = event.target.files;
          if (!files || files.length != 1) {
            throw new Error("Import exactly one file!");
          }
          const file = files[0];
          file
            .text()
            .then((text) => JSON.parse(text) as SerializedFile)
            .then((data) => {
              const { scenario, simulation } = deserializeFile(data);
              useScenarioStore.setState(scenario);
              useSimulationStore.setState(simulation);
              const scenarioState = useScenarioStore.getState();
              for (const sensor of scenarioState.monostaticSensors) {
                showSensor(sensor.sensor.id);
              }
              for (const sensor of scenarioState.pclSensors) {
                showSensor(sensor.sensor.id);
              }
            });
        }}
        style={{ display: "none" }}
      />
      <Button variant={"contained"} onClick={() => inputRef.current?.click()}>
        Load File
      </Button>
    </>
  );
}
