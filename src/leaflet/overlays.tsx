import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import L from "leaflet";
import { useLeafletContext } from "./context";
import { omitUndefined } from "./internal";

// `_contentNode` is an internal, undocumented field on Leaflet's DivOverlay
// (the base class behind both Tooltip and Popup): the <div> Leaflet renders
// overlay content into once the overlay has been laid out. There is no
// public API to obtain a stable content-container handle, so we reach into
// this field to portal React children into it - always behind a defensive
// null check, since it only exists once Leaflet has actually opened/laid
// out the overlay.
function getContentNode(overlay: L.Popup | L.Tooltip): HTMLElement | null {
  return (overlay as unknown as { _contentNode?: HTMLElement })._contentNode ?? null;
}

export interface TooltipProps {
  children?: ReactNode;
  permanent?: boolean;
  direction?: L.Direction;
  offset?: L.PointExpression;
}

export function Tooltip({ children, permanent, direction, offset }: TooltipProps) {
  const { overlayContainer } = useLeafletContext();
  const instanceRef = useRef<L.Tooltip | null>(null);
  if (!instanceRef.current) {
    instanceRef.current = L.tooltip(omitUndefined({ permanent, direction, offset }));
  }
  const instance = instanceRef.current;
  const [contentNode, setContentNode] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (!overlayContainer) return;

    const handleOpen = () => setContentNode(getContentNode(instance));
    const handleClose = () => setContentNode(null);

    // Listeners must be attached *before* bindTooltip() runs below: a
    // permanent tooltip bound to a layer that's already on the map opens
    // synchronously inside bindTooltip() itself, firing 'tooltipopen'
    // before bindTooltip() even returns.
    overlayContainer.on("tooltipopen", handleOpen);
    overlayContainer.on("tooltipclose", handleClose);
    overlayContainer.bindTooltip(instance);
    // Defensive fallback in case the tooltip ended up open without us
    // observing the 'tooltipopen' event (e.g. some future reordering).
    if (instance.isOpen()) handleOpen();

    return () => {
      overlayContainer.off("tooltipopen", handleOpen);
      overlayContainer.off("tooltipclose", handleClose);
      overlayContainer.unbindTooltip();
    };
  }, [overlayContainer, instance]);

  // Refresh Leaflet's layout of the tooltip when its content
  // changes while open, so dynamic content doesn't render clipped/stale.
  useEffect(() => {
    if (contentNode) instance.update();
  }, [instance, contentNode, children]);

  return contentNode ? createPortal(children, contentNode) : null;
}

export interface PopupProps {
  position: L.LatLngExpression;
  children?: ReactNode;
}

// Only supports the standalone, map-bound usage pattern used in this
// codebase (created/positioned via `position`, opened/closed as the owning
// component mounts/unmounts).
export function Popup({ position, children }: PopupProps) {
  const { map } = useLeafletContext();
  const instanceRef = useRef<L.Popup | null>(null);
  if (!instanceRef.current) {
    // L.popup()'s single-argument overload only recognizes its argument as
    // a latlng (rather than as an options object, its *other* overload)
    // when it's an `L.LatLng` instance or a `[lat, lng]` array - a plain
    // `{lat, lng}` object literal (which `position` commonly is here) fails
    // that check and silently falls through to the options-object
    // interpretation, leaving `_latlng` unset. Normalize explicitly.
    instanceRef.current = L.popup(L.latLng(position));
  }
  const instance = instanceRef.current;
  const [contentNode, setContentNode] = useState<HTMLElement | null>(null);

  useEffect(() => {
    // openOn() synchronously adds the popup layer to the map, which
    // synchronously lays out its content node - so it's readable
    // immediately afterwards, no event listener needed.
    instance.openOn(map);
    setContentNode(getContentNode(instance));

    return () => {
      map.closePopup(instance);
      setContentNode(null);
    };
  }, [map, instance]);

  useEffect(() => {
    instance.setLatLng(position);
  }, [instance, position]);

  return contentNode ? createPortal(children, contentNode) : null;
}
