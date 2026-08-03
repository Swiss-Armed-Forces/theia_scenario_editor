import { useEffect } from "react";
import ContentContainer from "./components/ContentContainer";
import Headerbar from "./components/Headerbar";
import { useGuiStateStore } from "./context/GuiStateStore";
import { useScenarioStore } from "./context/ScenarioStore";

function App() {
  const fetchFmTransmitters = useGuiStateStore(
    (state) => state.fetchFmTransmitters,
  );

  useEffect(() => {
    useGuiStateStore.getState().initTileUrl();
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key == "Delete") {
        const guiState = useGuiStateStore.getState();
        const scenarioStore = useScenarioStore.getState();

        if (guiState.selectedEffectorId !== null) {
          scenarioStore.deleteEffector(guiState.selectedEffectorId);
          return;
        }

        const receiverId = guiState.selectedReceiverId;
        if (receiverId === null) {
          return;
        }
        if (
          scenarioStore.blueMonostaticSensors.some(
            (sensor) => sensor.sensor.receiver.id === receiverId,
          )
        ) {
          scenarioStore.deleteReceiver(receiverId, true);
        } else if (
          scenarioStore.redMonostaticSensors.some(
            (sensor) => sensor.sensor.receiver.id === receiverId,
          )
        ) {
          scenarioStore.deleteReceiver(receiverId, false);
        } else if (
          scenarioStore.pclReceivers.some((r) => r.receiver.id === receiverId)
        ) {
          scenarioStore.deletePclReceiver(receiverId);
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Call at initialization.
  useEffect(() => {
    fetchFmTransmitters();
  }, []);

  return (
    <div className="rootContainer">
      <Headerbar />
      <ContentContainer />
    </div>
  );
}

export default App;
