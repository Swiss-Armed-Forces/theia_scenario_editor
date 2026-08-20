import React, { useEffect, useId } from 'react';
import { useMap } from 'react-leaflet';
import type { TileLayerProps } from 'react-leaflet';

/**
 * BlurredTileLayer
 * ------------------
 * Wraps a react-leaflet <TileLayer> and visually blurs its tiles.
 *
 * How it works:
 * Leaflet renders each layer's tiles into a "pane" (a plain <div>).
 * We create a pane unique to this wrapper, apply a CSS `filter: blur(...)`
 * to that pane, and render the child TileLayer into it via the `pane` prop.
 * Because the blur lives on the pane container (not on individual <img>
 * tiles), it stays applied uniformly as tiles load/unload while panning
 * and zooming.
 *
 * IMPORTANT — this is a *visual* blur only:
 * - The original tile images are still requested and present in the DOM.
 * - Anyone with browser dev tools can select the pane and delete/override
 *   the `filter` style, or read the raw tiles from the Network tab.
 * - Use this to keep details illegible on a shared screen / in a live
 *   demo, NOT as an access control for genuinely sensitive imagery.
 *   If the tile content itself must never reach the client unredacted,
 *   blur or redact it server-side (or serve pre-sanitized tiles) instead.
 *
 * Usage:
 *   <MapContainer center={[51.505, -0.09]} zoom={13}>
 *     <BlurredTileLayer blurAmount={10}>
 *       <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
 *     </BlurredTileLayer>
 *   </MapContainer>
 */

export interface BlurredTileLayerProps {
  /** px of blur applied via CSS filter. Default 8. */
  blurAmount?: number;
  /** Optionally desaturate along with blurring. Default false. */
  grayscale?: boolean;
  /** z-index for the created pane. Default 200 (Leaflet's default tile-pane tier). */
  paneZIndex?: number;
  /** A single <TileLayer /> element. */
  children: React.ReactElement<TileLayerProps>;
}

export function BlurredTileLayer({
  blurAmount = 8,
  grayscale = false,
  paneZIndex = 200,
  children,
}: BlurredTileLayerProps): React.ReactElement | null {
  const map = useMap();
  const rawId = useId().replace(/[:]/g, '');
  const paneName = `blurred-tile-pane-${rawId}`;

  // Create the pane synchronously during render, not inside useEffect.
  // React fires effects child-before-parent, so by the time our own
  // useEffect would run, the child <TileLayer>'s internal effect has
  // *already* called map.getPane(paneName) to attach its tiles — if the
  // pane doesn't exist yet, that throws "Cannot read properties of
  // undefined (reading 'appendChild')". Render, on the other hand, runs
  // parent-before-child, so creating the pane here guarantees it exists
  // before TileLayer ever looks for it.
  //
  // Note: we deliberately don't stash the pane in a ref. Reading/writing
  // ref.current during render is unsafe (render can be called more than
  // once, e.g. in StrictMode or under concurrent rendering, without
  // committing). Instead we just re-run the idempotent map.getPane /
  // map.createPane lookup wherever the pane is needed — it's a plain DOM
  // lookup, not an expensive operation.
  if (!map.getPane(paneName)) {
    const pane = map.createPane(paneName);
    // Tiles are non-interactive visuals; avoid intercepting mouse events.
    pane.style.pointerEvents = 'none';
  }

  // Style updates (blur amount, grayscale, z-index) live in an effect
  // since they only need to happen after the pane exists, not before
  // TileLayer mounts. We look the pane up again here rather than reading
  // it from a ref set during render.
  useEffect(() => {
    const pane = map.getPane(paneName);
    if (!pane) return;
    pane.style.zIndex = String(paneZIndex);
    const filters: string[] = [`blur(${blurAmount}px)`];
    if (grayscale) filters.push('grayscale(1)');
    pane.style.filter = filters.join(' ');
  }, [map, paneName, blurAmount, grayscale, paneZIndex]);

  if (!children) return null;


  // Inject the pane name into the TileLayer child so Leaflet renders
  // its tiles inside our blurred pane instead of the default tile pane.
  return React.cloneElement(children, { pane: paneName });
}

export default BlurredTileLayer;