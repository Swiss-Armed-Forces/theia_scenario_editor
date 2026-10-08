---
name: run-app
description: Launch the Theia scenario editor dev server (and its theia_backend FastAPI server) and drive it in headless Chromium via Playwright to verify a change actually renders/works, with a screenshot as proof.
---

# Running and verifying theia_scenario_editor

This is a Vite + React SPA (`react-leaflet` map) talking to the `theia_backend`
FastAPI server at `http://localhost:8000`. There is no test suite and no
browser-automation tooling pre-installed in this repo. This recipe was
adapted from the sibling repo `theia_frontend`'s `run-app` skill (same
stack, different git project) and confirmed working here directly.

## 1. Backend server

`theia_backend` must be running and reachable at `http://localhost:8000` —
the frontend has no mock/offline mode. Start it via the project's poetry
venv interpreter (plain `poetry run` / `python3` won't have the deps):

```bash
lsof -ti:8000 -sTCP:LISTEN | xargs -r kill   # free the port if stale
cd /home/claude_code/Documents/theia_backend
/home/claude_code/.cache/pypoetry/virtualenvs/theia-iLCo1Bwa-py3.12/bin/python \
  scripts/run_server.py > /tmp/theia-backend-server.log 2>&1 &
disown
timeout 30 bash -c 'until curl -sf http://localhost:8000/docs >/dev/null; do sleep 1; done'
```

Takes ~15-20s to report "Application startup complete" in the log (loads
terrain models) — poll, don't assume instant readiness. If the poetry venv
path above is stale, re-find it: `find ~/.cache/pypoetry/virtualenvs -maxdepth 1`.

## 2. Dev server

```bash
cd /home/claude_code/Documents/theia_scenario_editor
lsof -ti:5173 -sTCP:LISTEN | xargs -r kill   # free the port if a stale server is running
npm run dev > /tmp/vite-dev.log 2>&1 &
disown
timeout 30 bash -c 'until curl -sf http://localhost:5173 >/dev/null; do sleep 1; done'
```

## 3. Playwright (headless Chromium)

`playwright` is a devDependency here (added when this skill was copied in).
If it's ever missing: `npm install -D playwright`.

**Browser binary version must match the installed `playwright` package** — a
stale/mismatched cache in `~/.cache/ms-playwright` fails with
`Executable doesn't exist at .../chrome-headless-shell`. Fix by downloading
the matching build (safe to always run, it's a no-op if already current):

```bash
npx playwright install chromium
```

**Module resolution gotcha:** a driver script only resolves `import { chromium }
from "playwright"` if it lives somewhere under this project's `node_modules`
ancestor chain. Keep driver scripts inside the repo (e.g. this skill
directory, or a scratch file at the repo root) — running one from `/tmp`
fails with `ERR_MODULE_NOT_FOUND` even though the package is installed.

## 4. Smoke-test drive

`drive.mjs` in this directory is a generic driver: loads the app, waits for
the map (`.leaflet-container`) to render, reports any console errors, and
saves a full-page screenshot.

```bash
node .claude/skills/run-app/drive.mjs http://localhost:5173 /path/to/screenshot.png
```

**Look at the screenshot** — a blank/error page is a failure to launch, not
a pass.

## 5. Writing a feature-specific check

For anything beyond the generic smoke test, write a one-off script alongside
`drive.mjs` (or a scratch `.mjs` at the repo root — see the module
resolution gotcha above) using the `playwright` package directly.

App structure notes gathered while verifying the Effector→GBAD rename
(2026-09-03), useful for any sidebar/map component:

- **Sidebar sections are `<fieldset>` with a `<legend>`** — e.g. the GBAD
  settings form's legend text is literally `"Effector Settings"` (the UI
  label wasn't renamed even though the underlying type/store field is now
  `Gbad`/`gbads` — don't assume the legend text tracks the code rename).
  Target one via `page.locator("fieldset", { has: page.locator("legend", { hasText: "..." }) })`.
- **List rows use class `.SensorListItem`** (shared across sensor/GBAD/missile/
  drone list items) — scope with `.filter({ hasText: ... })` to disambiguate.
- **Adding a component (`+ GBAD Effector` etc.) auto-selects the new item** —
  its settings panel is already open immediately after the map click that
  places it. Don't click the list item again "to select it": since selection
  is a toggle (`selectGbad(isHighlighted ? null : id)`), a redundant click
  deselects it and closes the settings panel instead.
- **Number inputs are ambiguous by type alone**: the Position section (Lat/
  Lon/Alt) renders `input[type="number"]` too, ahead of RCS/Combat range/N
  attacks/Cadence in DOM order. Don't index into `input[type="number"]` by
  position — target via the adjacent label instead:
  `page.locator('label:has-text("Combat range") + input')`.
- **Leaflet renders both data polygons and markers as SVG `<path>`** — they
  are not distinguishable by a generic `path.leaflet-interactive` selector
  alone. Data layers (`<GeoJSON>`) live under `.leaflet-overlay-pane`;
  markers live under `.leaflet-marker-pane`.
- **Expect `net::ERR_CONNECTION_REFUSED` console noise for `localhost:8080`
  tile requests** in this sandbox — that's the local-tile-server fallback in
  `GuiStateStore.ts` (`TILE_SERVER_LOCAL`), used when the OSM-reachability
  probe doesn't resolve cleanly; nothing to do with app correctness, and the
  map still renders fine from the OSM tiles that did load. Don't chase it as
  a regression — filter console/request errors down to the domains your
  change actually touches before treating any as a real signal.
- **`+ Ballistic Missile` and `+ Cruise Missile` need two map clicks with a
  pause in between** — the stop-point click listener is only armed after the
  backend elevation lookup for the start point returns, so a second click
  fired immediately is lost. Wait ~2s between the clicks (see
  `verify_target_category.mjs`, `verify_cruise_missile.mjs`). The button
  was called `+ Missile` before cruise missiles existed.
- **Missile legends and list rows**: `"Ballistic Missile Settings"` /
  `"Ballistic missile #N"` and `"Cruise Missile Settings"` /
  `"Cruise missile #N"`. A `hasText: "Missile Settings"` legend filter
  matches both forms; only one is visible at a time.
- **Selection survives loading a file** — after `Load file`, the previously
  selected item's id may still be selected, so clicking its list row toggles
  it *off*. Check whether the settings form is already visible before
  clicking (see `select()` in `verify_cruise_missile.mjs`).
- **Cruise missile form validation**: an out-of-range value shows a
  `role="alert"` message inside the form and is not written to the store, so
  a save made meanwhile still holds the last valid value.
- **React `<StrictMode>` double-invokes effects in dev only** — a
  `useEffect(() => { fetch(...) }, [])` will issue two requests under
  `npm run dev`; not a bug, doesn't happen in a production build.

## Feature checks

- `verify_critical_infra.mjs` — critical infrastructure.
- `verify_target_category.mjs` — ballistic missile and drone swarm
  categories, including legacy save files.
- `verify_cruise_missile.mjs` — cruise missile placement, settings
  defaults, range validation, Delete key, save/load, and a ballistic missile
  alongside it. Prints a JSON summary and writes `cruise_missile.png` and
  `cruise_missile_invalid.png` to the output directory:

  ```bash
  node .claude/skills/run-app/verify_cruise_missile.mjs http://localhost:5173 /tmp
  ```

## 6. Teardown

```bash
lsof -ti:5173 -sTCP:LISTEN | xargs -r kill
lsof -ti:8000 -sTCP:LISTEN | xargs -r kill
```

**Wait until the backend process has actually exited before starting anything
else theia-related** (backend tests, `simulate_scenario.py`, another server).
`run_server.py` loads the terrain named by `THEIA_DEFAULT_TERRAIN`; when that
is a `tree_*` terrain, it is a `FastSrtmModel` that fills more than half the
machine's RAM, so a second one (e.g. `tests/test_fast_los.py` loads one) can
run the machine out of memory. A free port does not mean the process is gone:

```bash
timeout 60 bash -c 'while pgrep -f scripts/run_server.py >/dev/null; do sleep 1; done'
```
