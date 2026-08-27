import type {
  DefaultMonostaticSensorConfiguration,
  DetectableMonostaticSensor,
  MonostaticSensor,
  Receiver,
  Transmitter,
} from "../types/types";

// A preset only describes a sensor's technical characteristics. Its id and
// point fields are placeholders (id: -1, a template location), so applying
// or matching a preset must always ignore them and keep the sensor's own
// identity and placement.
function withoutIdentity<T extends Transmitter | Receiver>(
  x: T,
): Omit<T, "id" | "point"> {
  const { id: _id, point: _point, ...rest } = x;
  return rest;
}

// JSON.stringify is key-order-dependent, and the placed sensor's fields
// were assembled independently from the preset's (parsed off the wire), so
// a plain stringify comparison isn't reliable. Sorting keys recursively
// first gives a structural, order-independent fingerprint.
function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }
  const entries = Object.entries(value as Record<string, unknown>).sort(
    ([a], [b]) => (a < b ? -1 : a > b ? 1 : 0),
  );
  return `{${entries
    .map(([k, v]) => `${JSON.stringify(k)}:${stableStringify(v)}`)
    .join(",")}}`;
}

function fingerprint(sensor: MonostaticSensor): string {
  return stableStringify({
    transmitter: withoutIdentity(sensor.transmitter),
    receiver: withoutIdentity(sensor.receiver),
    error_model: sensor.error_model,
  });
}

export function applyMonostaticSensorPreset(
  detectableSensor: DetectableMonostaticSensor,
  preset: DefaultMonostaticSensorConfiguration,
): DetectableMonostaticSensor {
  const next = structuredClone(detectableSensor);
  next.sensor.transmitter = {
    ...preset.sensor.transmitter,
    id: next.sensor.transmitter.id,
    point: next.sensor.transmitter.point,
  };
  next.sensor.receiver = {
    ...preset.sensor.receiver,
    id: next.sensor.receiver.id,
    point: next.sensor.receiver.point,
  };
  next.sensor.error_model = preset.sensor.error_model;
  return next;
}

export function findMatchingMonostaticSensorPreset(
  sensor: MonostaticSensor,
  presets: DefaultMonostaticSensorConfiguration[],
): DefaultMonostaticSensorConfiguration | null {
  const target = fingerprint(sensor);
  return (
    presets.find((preset) => fingerprint(preset.sensor) === target) ?? null
  );
}
