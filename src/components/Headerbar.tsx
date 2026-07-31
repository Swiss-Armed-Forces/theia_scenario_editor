import { Button } from "@mui/material";
import { downloadJSON } from "../util/export";
import { serializeFile } from "../context/persistence";
import ImportButton from "./ImportButton";

export default function Headerbar() {
  return (
    <div className="headerBar">
      <Button
        variant="contained"
        onClick={() => downloadJSON(serializeFile(), "scenario.json")}
      >
        Save
      </Button>
      <ImportButton />
      <div>Theia Scenario Editor</div>
    </div>
  );
}
