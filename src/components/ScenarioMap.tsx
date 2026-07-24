import {
  GeoJSON,
  MapContainer,
  Marker,
  Popup,
  Rectangle,
  ScaleControl,
  TileLayer,
  Tooltip,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { DEFAULT_MAP_CENTER } from "../util/constants";
import { useState } from "react";
import type {
  LatLonHeightGrid,
  MonostaticSensor,
  PclSensor,
  Point,
  Receiver,
  Transmitter,
} from "../types/types";
import ms from "milsymbol";
import L from "leaflet";
import { useScenarioStore } from "../context/ScenarioStore";
import { useGuiStateStore } from "../context/GuiStateStore";
import { useSimulationStore } from "../context/SimulationResultStore";
import { elevationAt } from "../backend/backend";

function PclGridMarker({ grid }: { grid: LatLonHeightGrid }) {
  return (
    <Rectangle
      bounds={[
        [grid.lat_start, grid.lon_start],
        [grid.lat_stop, grid.lon_stop],
      ]}
      pathOptions={{ fill: false, color: "black", dashArray: "5, 5" }}
    >
      <Tooltip>PCL coverage calculation grid</Tooltip>
      </Rectangle>
  );
}

function ClickMarker() {
  const [pos, setPos] = useState<Point | null>(null);

  const mapClickListener = useGuiStateStore((state) => state.mapClickListener);

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
const friendlyReceiverSymbol = new ms.Symbol("10231500002203000000", {
  size: 24,
  additionalInformation: "Receiver",
});
const neutralTransmitterSymbol = new ms.Symbol("10042000001212010000", {
  size: 24,
});
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

const receiverIcon = L.divIcon({
  html: friendlyReceiverSymbol.asSVG(),
  className: "", // remove default 'leaflet-div-icon' styles if needed
  iconSize: [24, 24],
  iconAnchor: [12, 12], // center the icon
});

const highlightedReceiverIcon = L.divIcon({
  html: `<div style="border: 2px solid red; width: fit-content; height: fit-content">${friendlyReceiverSymbol.asSVG()}</div>`,
  className: "", // remove default 'leaflet-div-icon' styles if needed
  iconSize: [24, 24],
  iconAnchor: [12, 12], // center the icon
});

const fmTransmitterIcon = L.divIcon({
  html: neutralTransmitterSymbol.asSVG(),
  className: "", // remove default 'leaflet-div-icon' styles if needed
  iconSize: [24, 24],
  iconAnchor: [12, 12], // center the icon
});
const highlightedFmTransmitterIcon = L.divIcon({
  html: `<div style="border: 2px solid red; width: fit-content; height: fit-content">${neutralTransmitterSymbol.asSVG()}</div>`,
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
  const selectedReceiverId = useGuiStateStore(
    (state) => state.selectedReceiverId,
  );
  const selectReceiver = useGuiStateStore((state) => state.selectReceiver);

  const isHighlighted = selectedReceiverId === radar.receiver.id;
  return (
    <Marker
      position={[radar.receiver.point.lat, radar.receiver.point.lon]}
      icon={isHighlighted ? highlightedRadarIcon : radarIcon}
      eventHandlers={{
        click: () => {
          selectReceiver(isHighlighted ? null : radar.receiver.id);
        },
      }}
    >
      <Tooltip>Monostatic Sensor #{radar.id}</Tooltip>
    </Marker>
  );
}

function FmTransmitterMarker({
  transmitter,
  isHighlighted,
}: {
  transmitter: Transmitter;
  isHighlighted: boolean;
}) {
  return (
    <Marker
      position={[transmitter.point.lat, transmitter.point.lon]}
      icon={isHighlighted ? highlightedFmTransmitterIcon : fmTransmitterIcon}
    >
      <Tooltip>
        FM Transmitter #{transmitter.id}
        <br />
        Power = {transmitter.power.toFixed(0)}W
      </Tooltip>
    </Marker>
  );
}

function ReceiverMarker({
  receiver,
  isHighlighted,
}: {
  receiver: Receiver;
  isHighlighted: boolean;
}) {
  const selectReceiver = useGuiStateStore((state) => state.selectReceiver);
  return (
    <Marker
      position={[receiver.point.lat, receiver.point.lon]}
      icon={isHighlighted ? highlightedReceiverIcon : receiverIcon}
      eventHandlers={{
        click: () => {
          selectReceiver(isHighlighted ? null : receiver.id);
        },
      }}
    >
      <Tooltip>Receiver #{receiver.id}</Tooltip>
    </Marker>
  );
}

function PclSensorMarker({ sensor }: { sensor: PclSensor }) {
  const selectedReceiverId = useGuiStateStore(
    (state) => state.selectedReceiverId,
  );

  const isHighlighted = selectedReceiverId === sensor.receiver.id;

  return (
    <>
      <FmTransmitterMarker
        transmitter={sensor.transmitter}
        isHighlighted={isHighlighted}
      />
      <ReceiverMarker
        receiver={sensor.receiver}
        isHighlighted={isHighlighted}
      />
    </>
  );
}

export default function ScenarioMap() {
  // TODO: RED
  const visibleSensorIds = useGuiStateStore((state) => state.visibleSensorIds);
  const blueMonostaticSensors = useScenarioStore(
    (state) => state.blueMonostaticSensors,
  ).filter((sensor) => visibleSensorIds.has(sensor.id));
  const pclSensors = useScenarioStore((state) => state.pclSensors).filter(
    (sensor) => visibleSensorIds.has(sensor.id),
  );
  const blueMonostaticCoverages = useSimulationStore(
    (state) => state.monostaticCoverages,
  ).filter(([sensorId, _coverage, _date]) => visibleSensorIds.has(sensorId));

  const pclCalcGrid = useGuiStateStore(
    (state) => state.pclCoverageCalcConf.grid,
  );

  return (
    <MapContainer center={DEFAULT_MAP_CENTER} zoom={10}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ClickMarker />;
      <ScaleControl position="bottomleft" />
      {blueMonostaticSensors.map((sensor, i) => (
        <MonostaticRadarMarker key={i} radar={sensor}></MonostaticRadarMarker>
      ))}
      {pclSensors.map((sensor, i) => (
        <PclSensorMarker key={i} sensor={sensor} />
      ))}
      {blueMonostaticCoverages.map(([_sensorId, coverage, date]) => (
        <GeoJSON key={`Coverage ${_sensorId}_${date}`} data={coverage} />
      ))}
      <PclGridMarker grid={pclCalcGrid} />
    </MapContainer>
  );
}
