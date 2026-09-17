import { createContext, useContext, useEffect } from "react";
import type L from "leaflet";

// Minimal stand-in for @react-leaflet/core's LeafletContext: just enough for
// a component tree to reach the shared `L.Map` instance, and for an overlay
// component (e.g. Tooltip) nested inside a layer component (e.g. Marker) to
// reach that specific layer instance it should attach itself to.
export interface LeafletContextValue {
  map: L.Map;
  overlayContainer?: L.Layer;
}

export const LeafletContext = createContext<LeafletContextValue | null>(null);

export function useLeafletContext(): LeafletContextValue {
  const context = useContext(LeafletContext);
  if (context === null) {
    throw new Error(
      "No LeafletContext available - this component must be rendered inside a <MapContainer>",
    );
  }
  return context;
}

export function useMap(): L.Map {
  return useLeafletContext().map;
}

export function useMapEvents(handlers: L.LeafletEventHandlerFnMap): L.Map {
  const map = useMap();

  useEffect(() => {
    map.on(handlers);
    return () => {
      map.off(handlers);
    };
  }, [map, handlers]);

  return map;
}
