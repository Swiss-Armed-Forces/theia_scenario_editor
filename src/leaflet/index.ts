// Local, minimal react-leaflet-compatible shim built directly against
// plain `leaflet` (BSD-2-Clause). Implements only the subset of
// react-leaflet's public API actually used by ScenarioMap.tsx and
// BlurredTileLayer.tsx, under the same component/prop names, so those two
// files only need their import's module specifier changed.
//
// Deliberately NOT a copy of react-leaflet/@react-leaflet-core (both
// Hippocratic License 2.1) - original code written against leaflet's public
// API using common, well-known patterns.

export { useMap, useMapEvents } from "./context";
export { MapContainer } from "./MapContainer";
export type { MapContainerProps } from "./MapContainer";
export {
  Marker,
  Polyline,
  Polygon,
  Rectangle,
  Circle,
  GeoJSON,
  TileLayer,
  ScaleControl,
} from "./layers";
export type {
  MarkerProps,
  PolylineProps,
  PolygonProps,
  RectangleProps,
  CircleProps,
  GeoJSONProps,
  TileLayerProps,
  ScaleControlProps,
} from "./layers";
export { Tooltip, Popup } from "./overlays";
export type { TooltipProps, PopupProps } from "./overlays";
