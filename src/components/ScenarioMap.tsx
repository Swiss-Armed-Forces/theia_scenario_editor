import {
  Circle,
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
import { haversineDistance } from "../util/geo";
import { minDetectableRcsColor } from "../util/rcsColorScale";

function MinDetectableRcsOverlay({
  grid,
  geometry,
}: {
  grid: number[][][];
  geometry: LatLonHeightGrid;
}) {
  const cells = [];
  for (let i = 0; i < grid.length; i++) {
    for (let j = 0; j < grid[i].length; j++) {
      const value = grid[i][j][0];
      if (value === -1) {
        // No detection possible in this cell: leave it fully transparent
        // instead of forcing it onto the hardcoded value scale.
        continue;
      }
      const latLo = geometry.lat_start + (i - 0.5) * geometry.lat_res;
      const lonLo = geometry.lon_start + (j - 0.5) * geometry.lon_res;
      const color = minDetectableRcsColor(value);
      cells.push(
        <Rectangle
          key={`${i}_${j}`}
          bounds={[
            [latLo, lonLo],
            [latLo + geometry.lat_res, lonLo + geometry.lon_res],
          ]}
          pathOptions={{
            stroke: true,
            color: "black",
            weight: 0.1,
            fillColor: color,
            fillOpacity: 0.6,
          }}
        >
          <Tooltip>{value.toFixed(1)} m²</Tooltip>
        </Rectangle>,
      );
    }
  }
  return <>{cells}</>;
}

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
const fadedFmTransmitterIcon = L.divIcon({
  html: `<div style="opacity: 0.35">${neutralTransmitterSymbol.asSVG()}</div>`,
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
        <table className="fmTransmitterTooltipTable">
          <tr><td>Power</td><td>{transmitter.power.toFixed(1)}</td><td>W</td></tr>
          <tr><td>Frequency</td><td>{transmitter.frequency.toFixed(1)}</td><td>MHz</td></tr>
          <tr><td>Bandwidth</td><td>{transmitter.bandwidth.toFixed(1)}</td><td>MHz</td></tr>
        </table>
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

// Renders every known FM transmitter around a receiver that's currently in
// "select transmitters" mode, so the user can click markers directly on the
// map to toggle their association. Distance-based highlighting here uses a
// fast client-side straight-line estimate rather than the backend's
// terrain-aware line-of-sight check, so it can update live as the user drags
// the distance filter without a network round trip per keystroke.
// Stable empty-set singleton: a fallback of `new Set()` inside a Zustand
// selector would return a fresh reference on every call and trigger an
// infinite render loop via useSyncExternalStore's snapshot comparison.
const EMPTY_TRANSMITTER_IDS = new Set<number>();

function PclTransmitterSelectionLayer({ receiverId }: { receiverId: number }) {
  const receiver = useScenarioStore((state) =>
    state.pclReceivers.find((r) => r.id === receiverId),
  );
  const criteria = useScenarioStore((state) =>
    state.pclTxCriteria.get(receiverId),
  );
  const selectedIds =
    useScenarioStore((state) => state.pclTransmitterIds.get(receiverId)) ??
    EMPTY_TRANSMITTER_IDS;
  const togglePclTransmitter = useScenarioStore(
    (state) => state.togglePclTransmitter,
  );
  const fmTransmitters = useGuiStateStore((state) => state.fmTransmitters);

  if (!receiver || !criteria) {
    return null;
  }

  return (
    <>
      <Circle
        center={[receiver.point.lat, receiver.point.lon]}
        radius={criteria.max_dist}
        pathOptions={{ fill: false, color: "blue", dashArray: "4, 4" }}
      />
      {fmTransmitters.map((tx) => {
        const isSelected = selectedIds.has(tx.id);
        const isCandidate =
          !isSelected &&
          tx.power >= criteria.min_power &&
          haversineDistance(tx.point, receiver.point) <= criteria.max_dist;
        const icon = isSelected
          ? highlightedFmTransmitterIcon
          : isCandidate
            ? fmTransmitterIcon
            : fadedFmTransmitterIcon;
        return (
          <Marker
            key={tx.id}
            position={[tx.point.lat, tx.point.lon]}
            icon={icon}
            eventHandlers={{
              click: () => togglePclTransmitter(receiverId, tx.id),
            }}
          >
            <Tooltip>
              FM Transmitter #{tx.id}
              <br />
              Power = {tx.power.toFixed(0)}W
              <br />
              {isSelected ? "Selected (click to remove)" : "Click to select"}
            </Tooltip>
          </Marker>
        );
      })}
    </>
  );
}

export default function ScenarioMap() {
  // TODO: RED
  const visibleSensorIds = useGuiStateStore((state) => state.visibleSensorIds);
  const blueMonostaticSensors = useScenarioStore(
    (state) => state.blueMonostaticSensors,
  ).filter((sensor) => visibleSensorIds.has(sensor.id));
  const pclReceivers = useScenarioStore((state) => state.pclReceivers);
  const pclSensors = useScenarioStore((state) => state.pclSensors).filter(
    (sensor) => visibleSensorIds.has(sensor.id),
  );
  const blueMonostaticCoverages = useSimulationStore(
    (state) => state.monostaticCoverages,
  ).filter(([sensorId, _coverage, _date]) => visibleSensorIds.has(sensorId));
  const minDetectableRcsGrids = useSimulationStore(
    (state) => state.minDetectableRcsGrids,
  ).filter(([sensorId, _grid, _date]) => visibleSensorIds.has(sensorId));

  const pclCalcGrid = useGuiStateStore(
    (state) => state.pclCoverageCalcConf.grid,
  );
  const selectedReceiverId = useGuiStateStore(
    (state) => state.selectedReceiverId,
  );
  const pclSelectionReceiverId = useGuiStateStore(
    (state) => state.pclSelectionReceiverId,
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
      {pclReceivers.map((receiver) => (
        <ReceiverMarker
          key={receiver.id}
          receiver={receiver}
          isHighlighted={selectedReceiverId === receiver.id}
        />
      ))}
      {pclSensors
        .filter((sensor) => sensor.receiver.id !== pclSelectionReceiverId)
        .map((sensor) => (
          <FmTransmitterMarker
            key={sensor.id}
            transmitter={sensor.transmitter}
            isHighlighted={selectedReceiverId === sensor.receiver.id}
          />
        ))}
      {pclSelectionReceiverId !== null && (
        <PclTransmitterSelectionLayer receiverId={pclSelectionReceiverId} />
      )}
      {blueMonostaticCoverages.map(([_sensorId, coverage, date]) => (
        <GeoJSON key={`Coverage ${_sensorId}_${date}`} data={coverage} />
      ))}
      <PclGridMarker grid={pclCalcGrid} />
      {minDetectableRcsGrids.map(([sensorId, grid, date]) => (
        <MinDetectableRcsOverlay
          key={`RCS ${sensorId}_${date}`}
          grid={grid}
          geometry={pclCalcGrid}
        />
      ))}
    </MapContainer>
  );
}
