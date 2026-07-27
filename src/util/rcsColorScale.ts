// Hardcoded (not data-dependent) color scale for minimum detectable RCS
// (m^2). Lower values mean the sensor can detect smaller/stealthier
// targets there, i.e. better sensor performance, so low values are green
// and high values are red.
const RCS_COLOR_STOPS: { max: number; color: string }[] = [
  { max: 0.1, color: "#1a9850" },
  { max: 0.3, color: "#66bd63" },
  { max: 1, color: "#a6d96a" },
  { max: 3, color: "#fee08b" },
  { max: 10, color: "#fdae61" },
  { max: Infinity, color: "#d73027" },
];

export function minDetectableRcsColor(value: number): string {
  return RCS_COLOR_STOPS.find((stop) => value <= stop.max)!.color;
}
