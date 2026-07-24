import { Button } from "@mui/material";
import { useRef } from "react";
import {
  deserializeScenarioState,
  useScenarioStore,
  type SerializedScenarioState,
} from "../context/ScenarioStore";
import { useGuiStateStore } from "../context/GuiStateStore";

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
            .then((text) => JSON.parse(text) as SerializedScenarioState)
            .then((data) => {
              useScenarioStore.setState(deserializeScenarioState(data));
              const scenarioState = useScenarioStore.getState();
              for (const sensor of scenarioState.blueMonostaticSensors) {
                showSensor(sensor.id);
              }
              for (const sensor of scenarioState.redMonostaticSensors) {
                showSensor(sensor.id);
              }
              for (const sensor of scenarioState.pclSensors) {
                showSensor(sensor.id);
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
