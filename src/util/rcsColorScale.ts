// Hardcoded (not data-dependent) color scale for minimum detectable RCS
// (m^2). Lower values mean the sensor can detect smaller/stealthier
// targets there, i.e. better sensor performance, so low values are green
// and high values are red.
function createColorBins(
  nBins: number,
  minValue: number,
  maxValue: number
): { max: number; color: string }[] {
  // Control points, same palette as RCS_COLOR_STOPS (green -> yellow-green -> yellow -> orange -> red)
  const colorStops = [
    "#1a9850",
    "#66bd63",
    "#a6d96a",
    "#fee08b",
    "#fdae61",
    "#d73027",
  ];

  const hexToRgb = (hex: string): [number, number, number] => {
    const clean = hex.replace("#", "");
    return [
      parseInt(clean.substring(0, 2), 16),
      parseInt(clean.substring(2, 4), 16),
      parseInt(clean.substring(4, 6), 16),
    ];
  };

  const rgbToHex = (r: number, g: number, b: number): string => {
    const toHex = (v: number) =>
      Math.round(Math.min(255, Math.max(0, v)))
        .toString(16)
        .padStart(2, "0");
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  };

  const rgbStops = colorStops.map(hexToRgb);

  // Sample a single flat color from the gradient at position t in [0, 1]
  // (equivalent to matplotlib's cmap(t) on a LinearSegmentedColormap)
  const sampleColor = (t: number): string => {
    const clampedT = Math.min(1, Math.max(0, t));
    const segments = rgbStops.length - 1;
    const scaledT = clampedT * segments;
    const segIndex = Math.min(Math.floor(scaledT), segments - 1);
    const localT = scaledT - segIndex;

    const [r1, g1, b1] = rgbStops[segIndex];
    const [r2, g2, b2] = rgbStops[segIndex + 1];

    const r = r1 + (r2 - r1) * localT;
    const g = g1 + (g2 - g1) * localT;
    const b = b1 + (b2 - b1) * localT;

    return rgbToHex(r, g, b);
  };

  const range = maxValue - minValue;
  const step = range / nBins;

  const bins: { max: number; color: string }[] = [];

  for (let i = 0; i < nBins; i++) {
    const isLast = i === nBins - 1;
    // Sample at the bin's midpoint fraction, like matplotlib centers discrete
    // colors within BoundaryNorm bins rather than at bin edges
    const t = (i + 0.5) / nBins;
    const max = isLast ? Infinity : minValue + step * (i + 1);

    bins.push({
      max,
      color: sampleColor(t),
    });
  }

  return bins;
}

const RCS_COLOR_STOPS: { max: number; color: string }[] = createColorBins(
  10,
  0.1,
  100,
);

export function minDetectableRcsColor(value: number): string {
  return RCS_COLOR_STOPS.find((stop) => value <= stop.max)!.color;
}
