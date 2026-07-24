import { Button } from "@mui/material";
import { downloadJSON } from "../util/export";
import { serializeScenarioState, useScenarioStore } from "../context/ScenarioStore";
import ImportButton from "./ImportButton";

export default function Headerbar() {
  return (
    <div className="headerBar">
      <Button
        variant="contained"
        onClick={() =>
          downloadJSON(
            serializeScenarioState(useScenarioStore.getState()),
            "scenario.json",
          )
        }
      >
        Save
      </Button>
      <ImportButton />
      <div>Theia Scenario Editor</div>
    </div>
  );
}
