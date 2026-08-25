import { useScenarioStore } from "../context/ScenarioStore";
import { useGuiStateStore } from "../context/GuiStateStore";
import PclReceiverListItem from "./PclReceiverListItem";

export default function PclSensorList() {
  const receivers = useScenarioStore((state) => state.pclReceivers);

  const highlightedReceiverId = useGuiStateStore(
    (state) => state.selectedReceiverId,
  );

  return (
    <>
      {receivers.map((detectableReceiver) => (
        <PclReceiverListItem
          key={detectableReceiver.receiver.id}
          receiver={detectableReceiver.receiver}
          isHighlighted={
            detectableReceiver.receiver.id == highlightedReceiverId
          }
        />
      ))}
    </>
  );
}
