import type { LatLng } from "leaflet";
import {
  MapContainer,
  Popup,
  ScaleControl,
  TileLayer,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { DEFAULT_MAP_CENTER } from "../util/constants";
import { useState } from "react";

function ClickMarker() {
  const [pos, setPos] = useState<LatLng | null>(null);

  useMapEvents({
    click: (e) => setPos(e.latlng),
  });

  return pos ? (
    <Popup position={pos}>
      {pos.lat.toFixed(4)}, {pos.lng.toFixed(4)}
    </Popup>
  ) : null;
}

export default function ScenarioMap() {
  return (
    <MapContainer center={DEFAULT_MAP_CENTER} zoom={10}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ClickMarker />;
      <ScaleControl position="bottomleft" />
    </MapContainer>
  );
}
