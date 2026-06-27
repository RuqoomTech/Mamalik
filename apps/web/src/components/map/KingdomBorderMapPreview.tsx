"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl, {
  type GeoJSONSource,
  type LngLatBoundsLike,
  type Map,
  type Marker,
} from "maplibre-gl";
import type { FeatureCollection, MultiPolygon, Polygon } from "geojson";

const BORDER_SOURCE_ID = "mamalik-kingdom-border";
const BORDER_FILL_LAYER_ID = "mamalik-kingdom-border-fill";
const BORDER_LINE_LAYER_ID = "mamalik-kingdom-border-line";
const EMPTY_FEATURE_COLLECTION = {
  type: "FeatureCollection" as const,
  features: [],
};

type BorderGeometry = Polygon | MultiPolygon;

function isBorderGeometry(value: unknown): value is BorderGeometry {
  if (!value || typeof value !== "object") {
    return false;
  }

  const maybeGeometry = value as { type?: unknown; coordinates?: unknown };

  return (
    (maybeGeometry.type === "Polygon" || maybeGeometry.type === "MultiPolygon") &&
    Array.isArray(maybeGeometry.coordinates)
  );
}

function createFeatureCollection(geometry: BorderGeometry): FeatureCollection {
  return {
    type: "FeatureCollection" as const,
    features: [
      {
        type: "Feature" as const,
        properties: {},
        geometry,
      },
    ],
  };
}

function collectLngLatPairs(value: unknown, pairs: Array<[number, number]>) {
  if (!Array.isArray(value)) {
    return;
  }

  if (
    value.length >= 2 &&
    typeof value[0] === "number" &&
    typeof value[1] === "number"
  ) {
    pairs.push([value[0], value[1]]);
    return;
  }

  for (const item of value) {
    collectLngLatPairs(item, pairs);
  }
}

function getBoundsFromGeometry(geometry: BorderGeometry): LngLatBoundsLike | null {
  const pairs: Array<[number, number]> = [];
  collectLngLatPairs(geometry.coordinates, pairs);

  if (pairs.length === 0) {
    return null;
  }

  let minLng = pairs[0][0];
  let minLat = pairs[0][1];
  let maxLng = pairs[0][0];
  let maxLat = pairs[0][1];

  for (const [lng, lat] of pairs) {
    minLng = Math.min(minLng, lng);
    minLat = Math.min(minLat, lat);
    maxLng = Math.max(maxLng, lng);
    maxLat = Math.max(maxLat, lat);
  }

  return [
    [minLng, minLat],
    [maxLng, maxLat],
  ];
}

function ensureBorderLayers(map: Map) {
  if (!map.getSource(BORDER_SOURCE_ID)) {
    map.addSource(BORDER_SOURCE_ID, {
      type: "geojson",
      data: EMPTY_FEATURE_COLLECTION,
    });
  }

  if (!map.getLayer(BORDER_FILL_LAYER_ID)) {
    map.addLayer({
      id: BORDER_FILL_LAYER_ID,
      type: "fill",
      source: BORDER_SOURCE_ID,
      paint: {
        "fill-color": "#183f35",
        "fill-opacity": 0.2,
      },
    });
  }

  if (!map.getLayer(BORDER_LINE_LAYER_ID)) {
    map.addLayer({
      id: BORDER_LINE_LAYER_ID,
      type: "line",
      source: BORDER_SOURCE_ID,
      paint: {
        "line-color": "#f0b45d",
        "line-opacity": 0.98,
        "line-width": 3,
      },
    });
  }
}

function updateBorderSource(map: Map, geometry: BorderGeometry | null) {
  ensureBorderLayers(map);
  const source = map.getSource(BORDER_SOURCE_ID) as GeoJSONSource | undefined;
  source?.setData(geometry ? createFeatureCollection(geometry) : EMPTY_FEATURE_COLLECTION);
}

export function KingdomBorderMapPreview({
  centerLat,
  centerLng,
  className,
  interactive = false,
  mapStyleUrl,
  visibleBorderGeojson,
}: {
  centerLat: number;
  centerLng: number;
  className?: string;
  interactive?: boolean;
  mapStyleUrl: string;
  visibleBorderGeojson: unknown;
}) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Map | null>(null);
  const markerRef = useRef<Marker | null>(null);
  const [mapError, setMapError] = useState<string | null>(
    mapStyleUrl ? null : "NEXT_PUBLIC_MAP_STYLE_URL is required before this map can load.",
  );
  const borderGeometry = isBorderGeometry(visibleBorderGeojson)
    ? visibleBorderGeojson
    : null;

  useEffect(() => {
    if (!mapContainerRef.current || !mapStyleUrl) {
      return;
    }

    const map = new maplibregl.Map({
      attributionControl: { compact: true },
      center: [centerLng, centerLat],
      container: mapContainerRef.current,
      interactive,
      style: mapStyleUrl,
      zoom: 14,
    });

    mapRef.current = map;

    if (interactive) {
      map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "top-right");
    }

    markerRef.current = new maplibregl.Marker({ color: "#183f35" })
      .setLngLat([centerLng, centerLat])
      .addTo(map);

    map.on("load", () => {
      updateBorderSource(map, borderGeometry);
      const bounds = borderGeometry ? getBoundsFromGeometry(borderGeometry) : null;

      if (bounds) {
        map.fitBounds(bounds, {
          duration: 0,
          maxZoom: interactive ? 15 : 14,
          padding: interactive ? 80 : 42,
        });
      }
    });

    map.on("error", () => {
      setMapError("Map style could not be loaded. Check NEXT_PUBLIC_MAP_STYLE_URL.");
    });

    return () => {
      markerRef.current?.remove();
      markerRef.current = null;
      map.remove();
      mapRef.current = null;
    };
  }, [borderGeometry, centerLat, centerLng, interactive, mapStyleUrl]);

  useEffect(() => {
    const map = mapRef.current;

    if (!map?.isStyleLoaded()) {
      return;
    }

    updateBorderSource(map, borderGeometry);
  }, [borderGeometry]);

  return (
    <div className={`mamalik-card relative overflow-hidden bg-[#e8f0f4] ${className ?? ""}`}>
      <div ref={mapContainerRef} className="h-full min-h-[260px] w-full" />
      {!borderGeometry ? (
        <div className="absolute inset-x-4 bottom-4 rounded-md border border-[#e7d6a0] bg-[#fff9e7] px-3 py-2 text-sm text-[#6a4a0a]">
          No visible border polygon is stored for this kingdom yet.
        </div>
      ) : null}
      {mapError ? (
        <div className="absolute inset-x-4 top-4 rounded-md border border-[#e1b8b8] bg-[#fff0f0] px-3 py-2 text-sm text-[#7a1d1d]">
          {mapError}
        </div>
      ) : null}
    </div>
  );
}
