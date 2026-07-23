import { elevationAt } from "../backend/backend";
import type { Point } from "../types/types";

export default function PositionSelector({
  point,
  setPoint,
}: {
  point: Point;
  setPoint: (p: Point) => void;
}) {
  return (
    <div className="PointSelector">
      <label>Lat °</label>
      <input
        type="number"
        step={0.01}
        value={point.lat}
        onChange={(event) => {
          const lat = parseFloat(event.target.value);
          elevationAt(lat, point.lon)
            .then((alt) => {
              return {
                lat: lat,
                lon: point.lon,
                alt: alt,
              };
            })
            .then((point: Point) => {
              setPoint(point);
            });
        }}
      />
      <label>Lon °</label>
      <input
        type="number"
        step={0.01}
        value={point.lon}
        onChange={(event) => {
          const lon = parseFloat(event.target.value);
          elevationAt(point.lat, lon)
            .then((alt) => {
              return {
                lat: point.lat,
                lon: lon,
                alt: alt,
              };
            })
            .then((point: Point) => {
              setPoint(point);
            });
        }}
      />
      <label>Alt [MASL]</label>
      <input
        type="number"
        value={point.alt}
        disabled={true}
        onChange={(_event) => {}}
      />
    </div>
  );
}
