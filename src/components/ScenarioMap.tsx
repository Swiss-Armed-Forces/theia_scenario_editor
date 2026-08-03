import {
  Circle,
  GeoJSON,
  MapContainer,
  Marker,
  Polyline,
  Popup,
  Rectangle,
  ScaleControl,
  TileLayer,
  Tooltip,
  useMap,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { DEFAULT_MAP_CENTER } from "../util/constants";
import { useEffect, useMemo, useState } from "react";
import type {
  Effector,
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
import { elevationAt, lineOfSightDistance } from "../backend/backend";
import { haversineDistance } from "../util/geo";
import { minDetectableRcsColor } from "../util/rcsColorScale";
import { combineMinDetectableRcsGrids } from "../util/minDetectableRcsGrid";
import { isPclReceiverVisible } from "../util/pclVisibility";

function MaxZoomUpdater({ maxZoom }: { maxZoom: number }) {
  const map = useMap();

  useEffect(() => {
    map.setMaxZoom(maxZoom);
  }, [map, maxZoom]);

  return null;
}

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
      if (Number.isNaN(value)) {
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
      pathOptions={{ fill: false, color: "black" }}
    >
      <Tooltip>PCL coverage calculation grid</Tooltip>
    </Rectangle>
  );
}

function ClickMarker() {
  const [pos, setPos] = useState<Point | null>(null);

  const mapClickListener = useGuiStateStore((state) => state.mapClickListener);
  const distancePoints = useGuiStateStore((state) => state.distancePoints);
  const addDistancePoint = useGuiStateStore((state) => state.addDistancePoint);
  const clearDistancePoints = useGuiStateStore(
    (state) => state.clearDistancePoints,
  );

  // Dismiss any leftover coordinate popup as soon as the click-listener mode
  // changes (e.g. entering or leaving "place a new sensor" mode), otherwise
  // it keeps reappearing on unrelated re-renders since it was never cleared.
  useEffect(() => {
    setPos(null);
  }, [mapClickListener]);

  useMapEvents({
    click: (e) => {
      // Any click dismisses a leftover coordinate popup from an earlier
      // plain click; the branches below re-open it only when appropriate.
      setPos(null);

      if (e.originalEvent.shiftKey) {
        // Shift+click: start (or extend) the distance measurement tool.
        elevationAt(e.latlng.lat, e.latlng.lng).then((alt) => {
          addDistancePoint({ lat: e.latlng.lat, lon: e.latlng.lng, alt: alt });
        });
        return;
      }
      if (distancePoints.length > 0) {
        // A plain click while the distance tool is active removes it,
        // rather than falling through to the default click behavior below.
        clearDistancePoints();
        return;
      }
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

const distancePointIcon = L.divIcon({
  html: `<div style="width:10px;height:10px;border-radius:50%;background:#ff5722;border:2px solid white;box-shadow:0 0 2px rgba(0,0,0,0.6)"></div>`,
  className: "",
  iconSize: [10, 10],
  iconAnchor: [5, 5],
});

// Renders the active distance-measurement tool: a marker per clicked vertex,
// a dashed line per segment labeled with that segment's line-of-sight
// distance, and a running total on the last vertex. Segment distances come
// from the terrain-aware backend endpoint, so they're fetched asynchronously
// and re-fetched whenever the vertex list changes.
function DistanceMeasurementLayer() {
  const points = useGuiStateStore((state) => state.distancePoints);
  const [segmentDistances, setSegmentDistances] = useState<number[]>([]);

  useEffect(() => {
    if (points.length < 2) {
      setSegmentDistances([]);
      return;
    }
    let cancelled = false;
    Promise.all(
      points.slice(1).map((p, i) => lineOfSightDistance(points[i], p)),
    ).then((distances) => {
      if (!cancelled) {
        setSegmentDistances(distances);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [points]);

  if (points.length === 0) {
    return null;
  }

  const total = segmentDistances.reduce((sum, d) => sum + d, 0);

  return (
    <>
      {points.slice(1).map((p, i) => {
        const prev = points[i];
        const distance = segmentDistances[i];
        return (
          <Polyline
            key={i}
            positions={[
              [prev.lat, prev.lon],
              [p.lat, p.lon],
            ]}
            pathOptions={{ color: "#ff5722", weight: 2, dashArray: "6, 4" }}
          >
            <Tooltip permanent direction="center">
              {distance !== undefined ? `${distance.toFixed(0)} m` : "..."}
            </Tooltip>
          </Polyline>
        );
      })}
      {points.map((p, i) => (
        <Marker key={i} position={[p.lat, p.lon]} icon={distancePointIcon}>
          {i === points.length - 1 && points.length > 1 && (
            <Tooltip permanent direction="top" offset={[0, -8]}>
              Total: {total.toFixed(0)} m
            </Tooltip>
          )}
        </Marker>
      ))}
    </>
  );
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

const friendlyEffectorSymbol = new ms.Symbol("10231000001301000000", {
  size: 24,
});

const effectorIcon = L.divIcon({
  html: friendlyEffectorSymbol.asSVG(),
  className: "", // remove default 'leaflet-div-icon' styles if needed
  iconSize: [24, 24],
  iconAnchor: [12, 12], // center the icon
});
const highlightedEffectorIcon = L.divIcon({
  html: `<div style="border: 2px solid red; width: fit-content; height: fit-content">${friendlyEffectorSymbol.asSVG()}</div>`,
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

function EffectorMarker({ effector }: { effector: Effector }) {
  const selectedEffectorId = useGuiStateStore(
    (state) => state.selectedEffectorId,
  );
  const selectEffector = useGuiStateStore((state) => state.selectEffector);

  const isHighlighted = selectedEffectorId === effector.id;
  return (
    <>
      <Marker
        position={[effector.point.lat, effector.point.lon]}
        icon={isHighlighted ? highlightedEffectorIcon : effectorIcon}
        eventHandlers={{
          click: () => {
            selectEffector(isHighlighted ? null : effector.id);
          },
        }}
      >
        <Tooltip>
          {effector.name} #{effector.id}
          <br />
          Combat range = {effector.combat_range.toFixed(0)}m
          <br />
          {effector.n_attacks_left} attack(s) left
        </Tooltip>
      </Marker>
      <Circle
        center={[effector.point.lat, effector.point.lon]}
        radius={effector.combat_range}
        pathOptions={{ fill: false, color: "blue", dashArray: "4, 4" }}
      />
    </>
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
          <tr>
            <td>Power</td>
            <td>{transmitter.power.toFixed(1)}</td>
            <td>W</td>
          </tr>
          <tr>
            <td>Frequency</td>
            <td>{transmitter.frequency.toFixed(1)}</td>
            <td>MHz</td>
          </tr>
          <tr>
            <td>Bandwidth</td>
            <td>{transmitter.bandwidth.toFixed(1)}</td>
            <td>MHz</td>
          </tr>
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
  const receiver = useScenarioStore(
    (state) => state.pclReceivers.find((r) => r.receiver.id === receiverId),
  )?.receiver;
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
  ).filter((sensor) => visibleSensorIds.has(sensor.sensor.id));
  const allPclSensors = useScenarioStore((state) => state.pclSensors);
  const pclReceivers = useScenarioStore((state) => state.pclReceivers).filter(
    (dr) => isPclReceiverVisible(dr.receiver, allPclSensors, visibleSensorIds),
  );
  const pclSensors = allPclSensors.filter((d) =>
    visibleSensorIds.has(d.sensor.id),
  );
  const effectors = useScenarioStore((state) => state.effectors);
  const blueMonostaticCoverages = useSimulationStore(
    (state) => state.monostaticCoverages,
  ).filter(([sensorId, _coverage, _date]) => visibleSensorIds.has(sensorId));
  const minDetectableRcsGrids = useSimulationStore(
    (state) => state.minDetectableRcsGrids,
  ).filter(([sensorId, _grid, _date]) => visibleSensorIds.has(sensorId));
  const combinedMinDetectableRcsGrid = useMemo(
    () =>
      combineMinDetectableRcsGrids(
        minDetectableRcsGrids.map(([, grid]) => grid),
      ),
    [minDetectableRcsGrids],
  );

  const pclCalcGrid = useGuiStateStore(
    (state) => state.pclCoverageCalcConf.grid,
  );
  const selectedReceiverId = useGuiStateStore(
    (state) => state.selectedReceiverId,
  );
  const pclSelectionReceiverId = useGuiStateStore(
    (state) => state.pclSelectionReceiverId,
  );
  const maxZoom = useGuiStateStore((state) => state.maxZoomLevel)
  const distancePoints = useGuiStateStore((state) => state.distancePoints);

  return (
    <MapContainer
      center={DEFAULT_MAP_CENTER}
      zoom={10}
      maxZoom={maxZoom}
      // Rapid clicks while placing distance-tool vertices can otherwise be
      // read by the browser as a native dblclick, which Leaflet's default
      // double-click-zoom handler would then act on regardless of Shift.
      doubleClickZoom={distancePoints.length === 0}
    >
      <MaxZoomUpdater maxZoom={maxZoom} />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url={useGuiStateStore((state) => state.mapTileUrl)}
      />
      <ClickMarker />;
      <DistanceMeasurementLayer />
      <ScaleControl position="bottomleft" />
      {blueMonostaticSensors.map((sensor, i) => (
        <MonostaticRadarMarker
          key={i}
          radar={sensor.sensor}
        ></MonostaticRadarMarker>
      ))}
      {effectors.map((detectableEffector) => (
        <EffectorMarker
          key={detectableEffector.effector.id}
          effector={detectableEffector.effector}
        />
      ))}
      {pclReceivers.map((dr) => (
        <ReceiverMarker
          key={dr.receiver.id}
          receiver={dr.receiver}
          isHighlighted={selectedReceiverId === dr.receiver.id}
        />
      ))}
      {pclSensors
        .filter((d) => d.sensor.receiver.id !== pclSelectionReceiverId)
        .map((d) => (
          <FmTransmitterMarker
            key={d.sensor.id}
            transmitter={d.sensor.transmitter}
            isHighlighted={selectedReceiverId === d.sensor.receiver.id}
          />
        ))}
      {pclSelectionReceiverId !== null && (
        <PclTransmitterSelectionLayer receiverId={pclSelectionReceiverId} />
      )}
      {blueMonostaticCoverages.map(([_sensorId, coverage, date]) => (
        <GeoJSON key={`Coverage ${_sensorId}_${date}`} data={coverage} />
      ))}
      <PclGridMarker grid={pclCalcGrid} />
      {combinedMinDetectableRcsGrid.length > 0 && (
        <MinDetectableRcsOverlay
          grid={combinedMinDetectableRcsGrid}
          geometry={pclCalcGrid}
        />
      )}
    </MapContainer>
  );
}
