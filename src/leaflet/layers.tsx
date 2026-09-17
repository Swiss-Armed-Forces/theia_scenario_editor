import { useEffect, useRef, type ReactNode } from "react";
import L from "leaflet";
import type { GeoJsonObject } from "geojson";
import { LeafletContext, useLeafletContext } from "./context";
import { omitUndefined } from "./internal";

// Shared mount/unmount lifecycle for anything addable to the map via
// map.addLayer/removeLayer. The layer instance itself is created once (via
// useRef in each component below) and never swapped, so this effect only
// ever needs to run again if `map` itself changes.
function useAddLayer(map: L.Map, layer: L.Layer) {
  useEffect(() => {
    map.addLayer(layer);
    return () => {
      map.removeLayer(layer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, layer]);
}

// Shared eventHandlers binding, rebound whenever the handlers object
// identity changes.
function useLayerEvents(layer: L.Layer, eventHandlers?: L.LeafletEventHandlerFnMap) {
  useEffect(() => {
    if (!eventHandlers) return;
    layer.on(eventHandlers);
    return () => {
      layer.off(eventHandlers);
    };
  }, [layer, eventHandlers]);
}

interface WithOverlayChildrenProps {
  map: L.Map;
  instance: L.Layer;
  children?: ReactNode;
}

// Marker/Polyline/Polygon/Rectangle all render their children (if any)
// through a nested context whose `overlayContainer` points at the specific
// layer instance, so a nested <Tooltip> can bind to that instance rather
// than to the map itself.
function OverlayChildren({ map, instance, children }: WithOverlayChildrenProps) {
  if (!children) return null;
  return (
    <LeafletContext.Provider value={{ map, overlayContainer: instance }}>
      {children}
    </LeafletContext.Provider>
  );
}

export interface MarkerProps {
  position: L.LatLngExpression;
  icon?: L.Icon | L.DivIcon;
  draggable?: boolean;
  eventHandlers?: L.LeafletEventHandlerFnMap;
  children?: ReactNode;
}

export function Marker({ position, icon, draggable, eventHandlers, children }: MarkerProps) {
  const { map } = useLeafletContext();
  const instanceRef = useRef<L.Marker | null>(null);
  if (!instanceRef.current) {
    instanceRef.current = L.marker(position, omitUndefined({ icon, draggable }));
  }
  const instance = instanceRef.current;

  useAddLayer(map, instance);
  useLayerEvents(instance, eventHandlers);

  useEffect(() => {
    instance.setLatLng(position);
  }, [instance, position]);

  useEffect(() => {
    if (icon) instance.setIcon(icon);
  }, [instance, icon]);

  useEffect(() => {
    if (draggable) {
      instance.dragging?.enable();
    } else {
      instance.dragging?.disable();
    }
  }, [instance, draggable]);

  return <OverlayChildren map={map} instance={instance}>{children}</OverlayChildren>;
}

export interface PathEventProps {
  pathOptions?: L.PathOptions;
  eventHandlers?: L.LeafletEventHandlerFnMap;
  children?: ReactNode;
}

export interface PolylineProps extends PathEventProps {
  positions: L.LatLngExpression[] | L.LatLngExpression[][];
}

export function Polyline({ positions, pathOptions, eventHandlers, children }: PolylineProps) {
  const { map } = useLeafletContext();
  const instanceRef = useRef<L.Polyline | null>(null);
  if (!instanceRef.current) {
    instanceRef.current = L.polyline(positions, pathOptions);
  }
  const instance = instanceRef.current;

  useAddLayer(map, instance);
  useLayerEvents(instance, eventHandlers);

  useEffect(() => {
    instance.setLatLngs(positions);
  }, [instance, positions]);

  useEffect(() => {
    if (pathOptions) instance.setStyle(pathOptions);
  }, [instance, pathOptions]);

  return <OverlayChildren map={map} instance={instance}>{children}</OverlayChildren>;
}

export interface PolygonProps extends PathEventProps {
  positions: L.LatLngExpression[] | L.LatLngExpression[][];
}

export function Polygon({ positions, pathOptions, eventHandlers, children }: PolygonProps) {
  const { map } = useLeafletContext();
  const instanceRef = useRef<L.Polygon | null>(null);
  if (!instanceRef.current) {
    instanceRef.current = L.polygon(positions, pathOptions);
  }
  const instance = instanceRef.current;

  useAddLayer(map, instance);
  useLayerEvents(instance, eventHandlers);

  useEffect(() => {
    instance.setLatLngs(positions);
  }, [instance, positions]);

  useEffect(() => {
    if (pathOptions) instance.setStyle(pathOptions);
  }, [instance, pathOptions]);

  return <OverlayChildren map={map} instance={instance}>{children}</OverlayChildren>;
}

export interface RectangleProps extends PathEventProps {
  bounds: L.LatLngBoundsExpression;
}

export function Rectangle({ bounds, pathOptions, eventHandlers, children }: RectangleProps) {
  const { map } = useLeafletContext();
  const instanceRef = useRef<L.Rectangle | null>(null);
  if (!instanceRef.current) {
    instanceRef.current = L.rectangle(bounds, pathOptions);
  }
  const instance = instanceRef.current;

  useAddLayer(map, instance);
  useLayerEvents(instance, eventHandlers);

  useEffect(() => {
    instance.setBounds(bounds);
  }, [instance, bounds]);

  useEffect(() => {
    if (pathOptions) instance.setStyle(pathOptions);
  }, [instance, pathOptions]);

  return <OverlayChildren map={map} instance={instance}>{children}</OverlayChildren>;
}

export interface CircleProps {
  center: L.LatLngExpression;
  radius: number;
  pathOptions?: L.PathOptions;
  eventHandlers?: L.LeafletEventHandlerFnMap;
}

export function Circle({ center, radius, pathOptions, eventHandlers }: CircleProps) {
  const { map } = useLeafletContext();
  const instanceRef = useRef<L.Circle | null>(null);
  if (!instanceRef.current) {
    instanceRef.current = L.circle(center, { radius, ...pathOptions });
  }
  const instance = instanceRef.current;

  useAddLayer(map, instance);
  useLayerEvents(instance, eventHandlers);

  useEffect(() => {
    instance.setLatLng(center);
  }, [instance, center]);

  useEffect(() => {
    instance.setRadius(radius);
  }, [instance, radius]);

  useEffect(() => {
    if (pathOptions) instance.setStyle(pathOptions);
  }, [instance, pathOptions]);

  return null;
}

export interface GeoJSONProps {
  data: GeoJsonObject | GeoJsonObject[];
}

// Current usage always mounts a fresh <GeoJSON> with a fresh React `key` per
// item (see ScenarioMap.tsx), so remount-on-key-change already gives us
// create-on-mount/remove-on-unmount semantics for free; no live
// geometry-update effect is implemented since nothing needs it.
export function GeoJSON({ data }: GeoJSONProps) {
  const { map } = useLeafletContext();
  const instanceRef = useRef<L.GeoJSON | null>(null);
  if (!instanceRef.current) {
    instanceRef.current = L.geoJSON(data);
  }
  useAddLayer(map, instanceRef.current);
  return null;
}

export interface TileLayerProps {
  url: string;
  attribution?: string;
  /** Name of the Leaflet pane to render tiles into. See BlurredTileLayer.tsx. */
  pane?: string;
}

export function TileLayer({ url, attribution, pane }: TileLayerProps) {
  const { map } = useLeafletContext();
  const instanceRef = useRef<L.TileLayer | null>(null);
  if (!instanceRef.current) {
    instanceRef.current = L.tileLayer(url, omitUndefined({ attribution, pane }));
  }
  const instance = instanceRef.current;

  useAddLayer(map, instance);

  useEffect(() => {
    instance.setUrl(url);
  }, [instance, url]);

  return null;
}

export interface ScaleControlProps {
  position?: L.ControlPosition;
}

export function ScaleControl({ position }: ScaleControlProps) {
  const { map } = useLeafletContext();
  // A Leaflet *control*, not a layer: added/removed via L.control.scale(...)
  // .addTo(map)/.remove(), not map.addLayer/removeLayer.
  const instanceRef = useRef<L.Control.Scale | null>(null);
  if (!instanceRef.current) {
    instanceRef.current = L.control.scale(omitUndefined({ position }));
  }

  useEffect(() => {
    const instance = instanceRef.current;
    if (!instance) return;
    instance.addTo(map);
    return () => {
      instance.remove();
    };
  }, [map]);

  return null;
}
