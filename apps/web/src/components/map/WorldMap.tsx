"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl, { type Map } from "maplibre-gl";
import type { FeatureCollection, Point, Polygon } from "geojson";
import { getDocumentMapTheme, getThemedMapStyleUrl, prepareMap } from "@/lib/map/map-style";

export type WorldKingdom = {
  id: string;
  name: string;
  centerLat: number;
  centerLng: number;
  usableLandM2: number;
  border: Polygon | null;
  isOwn: boolean;
};

const OWN_COLOR = "#17493b";
const RIVAL_COLOR = "#1f2421";
const BORDER_ZOOM = 11;
const numberFormatter = new Intl.NumberFormat("en-US");

function toBorderCollection(kingdoms: WorldKingdom[]): FeatureCollection<Polygon> {
  return {
    type: "FeatureCollection",
    features: kingdoms
      .filter((kingdom) => kingdom.border)
      .map((kingdom) => ({
        type: "Feature",
        id: kingdom.id,
        properties: { id: kingdom.id, name: kingdom.name, own: kingdom.isOwn, land: kingdom.usableLandM2 },
        geometry: kingdom.border as Polygon,
      })),
  };
}

function toPointCollection(kingdoms: WorldKingdom[]): FeatureCollection<Point> {
  return {
    type: "FeatureCollection",
    features: kingdoms.map((kingdom) => ({
      type: "Feature",
      properties: { id: kingdom.id, name: kingdom.name, own: kingdom.isOwn, land: kingdom.usableLandM2 },
      geometry: { type: "Point", coordinates: [kingdom.centerLng, kingdom.centerLat] },
    })),
  };
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => `&#${character.charCodeAt(0)};`);
}

export function WorldMap({
  className,
  focus,
  kingdoms,
  mapStyleUrl,
}: {
  className?: string;
  focus: { lat: number; lng: number; zoom: number };
  kingdoms: WorldKingdom[];
  mapStyleUrl: string;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Map | null>(null);
  const [mapError, setMapError] = useState<string | null>(
    mapStyleUrl ? null : "The map is not configured yet.",
  );

  useEffect(() => {
    if (!containerRef.current || !mapStyleUrl) {
      return;
    }

    const map = new maplibregl.Map({
      attributionControl: { compact: true },
      center: [focus.lng, focus.lat],
      container: containerRef.current,
      style: getThemedMapStyleUrl(mapStyleUrl, getDocumentMapTheme()),
      zoom: focus.zoom,
    });

    prepareMap(map);
    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");

    map.on("load", () => {
      map.addSource("kingdom-borders", { type: "geojson", data: toBorderCollection(kingdoms) });
      map.addSource("kingdom-points", { type: "geojson", data: toPointCollection(kingdoms) });

      const colorByOwner: maplibregl.ExpressionSpecification = ["case", ["get", "own"], OWN_COLOR, RIVAL_COLOR];

      map.addLayer({
        id: "kingdom-fill",
        type: "fill",
        source: "kingdom-borders",
        minzoom: BORDER_ZOOM - 1,
        paint: { "fill-color": colorByOwner, "fill-opacity": ["case", ["get", "own"], 0.28, 0.14] },
      });
      map.addLayer({
        id: "kingdom-outline",
        type: "line",
        source: "kingdom-borders",
        minzoom: BORDER_ZOOM - 1,
        paint: { "line-color": colorByOwner, "line-width": ["case", ["get", "own"], 2.5, 1.5] },
      });
      map.addLayer({
        id: "kingdom-dot",
        type: "circle",
        source: "kingdom-points",
        maxzoom: BORDER_ZOOM,
        paint: {
          "circle-color": colorByOwner,
          "circle-radius": ["case", ["get", "own"], 7, 5],
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": 2,
        },
      });
      map.addLayer({
        id: "kingdom-label",
        type: "symbol",
        source: "kingdom-points",
        minzoom: 3,
        layout: {
          "text-field": ["get", "name"],
          "text-size": 12,
          "text-offset": [0, 1.2],
          "text-anchor": "top",
          "text-font": ["Noto Sans Bold"],
          "text-optional": true,
        },
        paint: { "text-color": "#161816", "text-halo-color": "#ffffff", "text-halo-width": 1.5 },
      });

      for (const layer of ["kingdom-fill", "kingdom-dot"]) {
        map.on("click", layer, (event) => {
          const feature = event.features?.[0];

          if (!feature) {
            return;
          }

          const properties = feature.properties as { name: string; own: boolean; land: number };

          new maplibregl.Popup({ closeButton: false, offset: 10 })
            .setLngLat(event.lngLat)
            .setHTML(
              `<strong>${escapeHtml(properties.name)}</strong><br/>${numberFormatter.format(
                Number(properties.land),
              )} m² of land${properties.own ? "<br/>Your kingdom" : ""}`,
            )
            .addTo(map);
        });
        map.on("mouseenter", layer, () => {
          map.getCanvas().style.cursor = "pointer";
        });
        map.on("mouseleave", layer, () => {
          map.getCanvas().style.cursor = "";
        });
      }
    });

    map.on("error", () => {
      if (!map.isStyleLoaded()) {
        setMapError("The map could not be loaded. Try again later.");
      }
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [focus.lat, focus.lng, focus.zoom, kingdoms, mapStyleUrl]);

  return (
    <div className={`relative overflow-hidden rounded-md border border-mk-line bg-mk-canvas ${className ?? ""}`}>
      <div ref={containerRef} className="h-full w-full" />
      {mapError ? (
        <p className="absolute inset-x-4 top-4 rounded-md border border-mk-line bg-mk-surface px-3 py-2 text-sm text-mk-danger">
          {mapError}
        </p>
      ) : null}
    </div>
  );
}
