import maplibregl, { type Map } from "maplibre-gl";
import { getLabelTextField, withHiddenPlaces, type MapLocale, type MapTheme } from "@/lib/map/map-label-policy";

export { getKingdomMapPalette, getThemedMapStyleUrl, type MapLocale, type MapTheme } from "@/lib/map/map-label-policy";

// Vendored copy of @mapbox/mapbox-gl-rtl-text 0.3.0 (BSD-2). MapLibre needs it to join
// Arabic letters and lay out right-to-left labels correctly.
const RTL_TEXT_PLUGIN_URL = "/vendor/mapbox-gl-rtl-text-0.3.0.js";

export function ensureRtlTextPlugin(): void {
  if (maplibregl.getRTLTextPluginStatus() !== "unavailable") {
    return;
  }

  // Lazy: the plugin is only downloaded once a right-to-left label is on screen.
  maplibregl.setRTLTextPlugin(RTL_TEXT_PLUGIN_URL, true).catch(() => undefined);
}

export function getDocumentMapLocale(): MapLocale {
  return typeof document !== "undefined" && document.documentElement.lang === "ar" ? "ar" : "en";
}

export const THEME_CHANGE_EVENT = "mk-theme-change";

export function getDocumentMapTheme(): MapTheme {
  if (typeof document === "undefined") {
    return "light";
  }

  const explicit = document.documentElement.dataset.theme;

  if (explicit === "dark" || explicit === "light") {
    return explicit;
  }

  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function subscribeToThemeChanges(onChange: () => void): () => void {
  const media = window.matchMedia?.("(prefers-color-scheme: dark)");

  window.addEventListener(THEME_CHANGE_EVENT, onChange);
  media?.addEventListener("change", onChange);

  return () => {
    window.removeEventListener(THEME_CHANGE_EVENT, onChange);
    media?.removeEventListener("change", onChange);
  };
}

export function applyMapLabelPolicy(map: Map, locale: MapLocale): void {
  const textField = getLabelTextField(locale);

  for (const layer of map.getStyle()?.layers ?? []) {
    if (layer.type !== "symbol" || layer.id.startsWith("kingdom-") || layer.id.startsWith("mamalik-")) {
      continue;
    }

    if (JSON.stringify(map.getLayoutProperty(layer.id, "text-field") ?? null).includes('"name')) {
      map.setLayoutProperty(layer.id, "text-field", textField);
    }

    if (layer["source-layer"] === "place") {
      map.setFilter(layer.id, withHiddenPlaces(map.getFilter(layer.id) || null));
    }
  }
}

// Call right after creating a map: loads the RTL plugin and applies the label policy on every style load.
export function prepareMap(map: Map, locale: MapLocale = getDocumentMapLocale()): void {
  ensureRtlTextPlugin();
  map.on("style.load", () => applyMapLabelPolicy(map, locale));
}
