# Theia Scenario Editor

A graphical editor for building Theia scenarios: placing sensors and
effectors, and assembling an order of battle (orbat).

For the concepts behind what you're editing (physics model, system
architecture), see the
[theia_backend documentation](https://github.com/Swiss-Armed-Forces/theia_backend).

## Installation

```bash
npm install
```

The editor talks to a `theia_backend` server for terrain models, PCL
transmitter data, default sensor configurations, and coverage
calculations. It expects that backend server at `http://localhost:8000` (not
currently configurable). Start it in standalone mode — see the backend's
[running the server](https://github.com/Swiss-Armed-Forces/theia_backend/blob/main/doc/source/running.rst)
docs — before starting the editor.

## Running

```bash
npm run dev
```

Serves the editor at `http://localhost:5173`. Stop it with `Ctrl+C`.

## Missiles

The editor has two kinds of missile, each with its own button, list and
settings form. Both are placed with two map clicks: launch point, then target.

- **Ballistic missiles** (`+ Ballistic Missile`) fly a ballistic arc.
- **Cruise missiles** (`+ Cruise Missile`) follow the terrain at a set height
  above ground, within configurable climb and descent angle limits, and finish
  with a terminal dive onto the target. Out-of-range values in the settings
  form are flagged and not applied.

For both, the map only shows the straight line between launch point and
target. The actual flight path is computed by the backend when the scenario is
simulated. For the cruise missile's flight model and parameters, see the
backend's `doc/source/concepts/cruise_missile.rst`.

## Offline map tiles

By default, map tiles are fetched live from public OpenStreetMap/ArcGIS
servers. A local/offline tile server fallback exists (`localhost:8080`)
for use without internet access.

> [!NOTE]
> TODO: document how to set up the local tile server.
