import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import L from "leaflet";
import { LeafletContext } from "./context";

export interface MapContainerProps {
  center: L.LatLngExpression;
  zoom: number;
  maxZoom?: number;
  doubleClickZoom?: boolean;
  style?: CSSProperties;
  children?: ReactNode;
}

// Note: `center`, `zoom`, `maxZoom` and `doubleClickZoom` are read only once,
// at map-creation time, as constructor options - exactly like react-leaflet's
// own MapContainer. None of these props are reactive here; a later change to
// any of them will NOT update the already-created map. (Something else, e.g.
// MaxZoomUpdater in ScenarioMap.tsx, is responsible for pushing later changes
// into the map imperatively via useMap().)
export function MapContainer({
  center,
  zoom,
  maxZoom,
  doubleClickZoom,
  style,
  children,
}: MapContainerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  // Guards against React 19 StrictMode's dev-mode double-invocation of
  // effects (mount -> cleanup -> mount): without this guard, the second
  // mount would call L.map() on a container Leaflet already initialized,
  // which throws "Map container is already initialized."
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [map, setMap] = useState<L.Map | null>(null);

  useEffect(() => {
    if (containerRef.current && !mapInstanceRef.current) {
      const instance = L.map(containerRef.current, {
        center,
        zoom,
        maxZoom,
        doubleClickZoom,
      });
      mapInstanceRef.current = instance;
      setMap(instance);
    }

    return () => {
      const instance = mapInstanceRef.current;
      if (instance) {
        instance.remove();
        mapInstanceRef.current = null;
        setMap(null);
      }
    };
    // Mount-only: see the constructor-options note above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div ref={containerRef} style={style}>
      {map && (
        <LeafletContext.Provider value={{ map }}>
          {children}
        </LeafletContext.Provider>
      )}
    </div>
  );
}
