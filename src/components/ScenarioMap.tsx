import type { LatLng } from "leaflet";
import {
  MapContainer,
  Marker,
  Popup,
  ScaleControl,
  TileLayer,
  Tooltip,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { DEFAULT_MAP_CENTER } from "../util/constants";
import { useState } from "react";
import type {
  MapClickListener,
  MonostaticSensor,
  SensorPortfolio,
} from "../types/types";
import ms from "milsymbol";
import L from "leaflet";

function ClickMarker({
  mapClickListener,
}: {
  mapClickListener: MapClickListener | null;
}) {
  const [pos, setPos] = useState<LatLng | null>(null);

  useMapEvents({
    click: (e) => {
      if (mapClickListener) {
        // Pass information to listener.
      mapClickListener(e.latlng);
      } else {
        // Display the (lat, lon) popup.
      setPos(e.latlng);
      }
    },
  });

  return pos ? (
    <Popup position={pos}>
      {pos.lat.toFixed(4)}, {pos.lng.toFixed(4)}
    </Popup>
  ) : null;
}

const friendlyRadarSymbol = new ms.Symbol("10231500002203000000", { size: 24 });
// const friendlyReceiverSymbol = new ms.Symbol("10231500002203000000", {
//   size: 24,
//   additionalInformation: "Receiver",
// });
// const civilTransmitterSymbol = new ms.Symbol("10242000001212010000", {
//   size: 24,
// });

const radarIcon = L.divIcon({
  html: friendlyRadarSymbol.asSVG(),
  className: "", // remove default 'leaflet-div-icon' styles if needed
  iconSize: [24, 24],
  iconAnchor: [12, 12], // center the icon
});

function MonostaticRadarMarker({
  radar,
  onClick,
}: {
  radar: MonostaticSensor;
  onClick: () => void;
}) {
  return (
    <Marker
      position={[radar.receiver.point.lat, radar.receiver.point.lon]}
      icon={radarIcon}
      eventHandlers={{
        click: onClick,
      }}
    >
      <Tooltip>Monostatic Sensor #{radar.id}</Tooltip>
    </Marker>
  );
}

export default function ScenarioMap({
  mapClickListener,
  sensorPortfolio,
}: {
  mapClickListener: MapClickListener | null;
  sensorPortfolio: SensorPortfolio;
}) {
  return (
    <MapContainer center={DEFAULT_MAP_CENTER} zoom={10}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ClickMarker mapClickListener={mapClickListener} />;
      <ScaleControl position="bottomleft" />
      {sensorPortfolio.blueMonostaticSensors.map((sensor, i) => (
        <MonostaticRadarMarker
          key={i}
          radar={sensor}
          onClick={() => {}}
        ></MonostaticRadarMarker>
      ))}
    </MapContainer>
  );
}
