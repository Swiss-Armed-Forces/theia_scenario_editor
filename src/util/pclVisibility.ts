import type { PclSensor, Receiver } from "../types/types";

// A PCL receiver counts as visible if at least one of its transmitter
// pairings is visible (or it has none yet); it's only considered hidden once
// every one of its transmitters has been hidden.
export function isPclReceiverVisible(
  receiver: Receiver,
  pclSensors: PclSensor[],
  visibleSensorIds: Set<number>,
): boolean {
  const sensorIds = pclSensors
    .filter((sensor) => sensor.receiver.id === receiver.id)
    .map((sensor) => sensor.id);
  return (
    sensorIds.length === 0 || sensorIds.some((id) => visibleSensorIds.has(id))
  );
}
