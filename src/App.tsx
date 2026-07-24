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
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key == "Delete") {
        const receiverId = useGuiStateStore.getState().selectedReceiverId;
        if (receiverId !== null) {
          useScenarioStore.getState().deleteReceiver(receiverId, true);
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
