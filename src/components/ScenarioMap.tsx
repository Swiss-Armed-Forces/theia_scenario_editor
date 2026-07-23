import {
  GeoJSON,
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
import type { MapClickListener, MonostaticSensor, Point } from "../types/types";
import ms from "milsymbol";
import L from "leaflet";
import { useScenarioStore } from "../context/ScenarioStore";
import { useGuiStateStore } from "../context/GuiStateStore";
import { useSimulationStore } from "../context/SimulationResultStore";
import { elevationAt } from "../backend/backend";

function ClickMarker({
  mapClickListener,
}: {
  mapClickListener: MapClickListener | null;
}) {
  const [pos, setPos] = useState<Point | null>(null);

  useMapEvents({
    click: (e) => {
      if (mapClickListener) {
        // Pass information to listener.
        mapClickListener(e.latlng);
      } else {
        // Display the (lat, lon) popup.
        elevationAt(e.latlng.lat, e.latlng.lng).then((alt) => {
          setPos({
            lat: e.latlng.lat,
            lon: e.latlng.lng,
            alt: alt,
          });
        });
      }
    },
  });

  return pos ? (
    <Popup position={{ lat: pos.lat, lng: pos.lon }}>
      {pos.lat.toFixed(4)}, {pos.lon.toFixed(4)}, {pos.alt.toFixed(0)}
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

const highlightedRadarIcon = L.divIcon({
  html: `<div style="border: 2px solid red; width: fit-content; height: fit-content">${friendlyRadarSymbol.asSVG()}</div>`,
  className: "", // remove default 'leaflet-div-icon' styles if needed
  iconSize: [24, 24],
  iconAnchor: [12, 12], // center the icon
});

function MonostaticRadarMarker({ radar }: { radar: MonostaticSensor }) {
  const selectedSensorId = useGuiStateStore((state) => state.selectedSensorId);
  const selectSensor = useGuiStateStore((state) => state.selectSensor);

  const isHighlighted = selectedSensorId === radar.id;
  return (
    <Marker
      position={[radar.receiver.point.lat, radar.receiver.point.lon]}
      icon={isHighlighted ? highlightedRadarIcon : radarIcon}
      eventHandlers={{
        click: () => {
          selectSensor(isHighlighted ? null : radar.id);
        },
      }}
    >
      <Tooltip>Monostatic Sensor #{radar.id}</Tooltip>
    </Marker>
  );
}

export default function ScenarioMap({
  mapClickListener,
}: {
  mapClickListener: MapClickListener | null;
}) {
  // TODO: RED
  const visibleSensorIds = useGuiStateStore((state) => state.visibleSensorIds);
  const blueMonostaticSensors = useScenarioStore(
    (state) => state.blueMonostaticSensors,
  ).filter((sensor) => visibleSensorIds.has(sensor.id));
  const blueMonostaticCoverages = useSimulationStore(
    (state) => state.monostaticCoverages,
  ).filter(([sensorId, _coverage]) => visibleSensorIds.has(sensorId));
  return (
    <MapContainer center={DEFAULT_MAP_CENTER} zoom={10}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ClickMarker mapClickListener={mapClickListener} />;
      <ScaleControl position="bottomleft" />
      {blueMonostaticSensors.map((sensor, i) => (
        <MonostaticRadarMarker key={i} radar={sensor}></MonostaticRadarMarker>
      ))}
      {blueMonostaticCoverages.map(([_sensorId, coverage]) => (
        <GeoJSON key={`Coverage ${_sensorId}`} data={coverage} />
      ))}
    </MapContainer>
  );
}
