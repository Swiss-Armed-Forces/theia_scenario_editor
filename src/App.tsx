import { useEffect } from "react";
import ContentContainer from "./components/ContentContainer";
import Headerbar from "./components/Headerbar";
import { useGuiStateStore } from "./context/GuiStateStore";
import { useScenarioStore } from "./context/ScenarioStore";

function App() {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key == "Delete") {
        const sensorId = useGuiStateStore.getState().selectedSensorId;
        if (sensorId !== null) {
          useScenarioStore.getState().deleteMonostaticSensor(sensorId, true);
        } 
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="rootContainer">
      <Headerbar />
      <ContentContainer />
    </div>
  );
}

export default App;
