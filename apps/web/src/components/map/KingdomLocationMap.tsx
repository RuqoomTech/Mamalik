"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getLandAreaTypeLabel } from "@mamalik/game";
import maplibregl, {
  type GeoJSONSource,
  type LngLatLike,
  type Map,
  type Marker,
} from "maplibre-gl";
import { KingdomConfirmationPanel } from "@/components/create-kingdom/KingdomConfirmationPanel";
import type {
  LocationSuggestion,
  LocationValidationResponse,
  PreviewPolygon,
} from "@/lib/kingdom/location-validation";
import {
  describeLocationValidationStatus,
  formatBearing,
  formatDistanceMeters,
  formatLocationValidationStatus,
  formatSquareMeters,
  formatSuggestionSummary,
  formatToleranceStatus,
  formatValidationReason,
  getLocationValidationUiStatus,
} from "@/lib/map/location-ui";

type SelectedLocation = {
  latitude: number;
  longitude: number;
};

type KingdomLocationMapProps = {
  mapStyleUrl: string;
  playerDisplayName: string;
  playerEmail: string;
};

const RIYADH_CENTER: LngLatLike = [46.6753, 24.7136];
const PREVIEW_SOURCE_ID = "mamalik-selected-border-preview";
const PREVIEW_FILL_LAYER_ID = "mamalik-selected-border-preview-fill";
const PREVIEW_LINE_LAYER_ID = "mamalik-selected-border-preview-line";
const EMPTY_PREVIEW_FEATURE_COLLECTION = {
  type: "FeatureCollection" as const,
  features: [],
};

function formatCoordinate(value: number): string {
  return value.toFixed(6);
}

function createPreviewFeatureCollection(previewPolygon: PreviewPolygon) {
  return {
    type: "FeatureCollection" as const,
    features: [
      {
        type: "Feature" as const,
        properties: {},
        geometry: previewPolygon,
      },
    ],
  };
}

function ensurePreviewLayers(map: Map) {
  if (!map.getSource(PREVIEW_SOURCE_ID)) {
    map.addSource(PREVIEW_SOURCE_ID, {
      type: "geojson",
      data: EMPTY_PREVIEW_FEATURE_COLLECTION,
    });
  }

  if (!map.getLayer(PREVIEW_FILL_LAYER_ID)) {
    map.addLayer({
      id: PREVIEW_FILL_LAYER_ID,
      type: "fill",
      source: PREVIEW_SOURCE_ID,
      paint: {
        "fill-color": "#183f35",
        "fill-opacity": 0.22,
      },
    });
  }

  if (!map.getLayer(PREVIEW_LINE_LAYER_ID)) {
    map.addLayer({
      id: PREVIEW_LINE_LAYER_ID,
      type: "line",
      source: PREVIEW_SOURCE_ID,
      paint: {
        "line-color": "#f0b45d",
        "line-opacity": 0.95,
        "line-width": 3,
      },
    });
  }
}

function setPreviewPolygon(map: Map, previewPolygon: PreviewPolygon) {
  if (!map.isStyleLoaded()) {
    return;
  }

  ensurePreviewLayers(map);
  const source = map.getSource(PREVIEW_SOURCE_ID) as GeoJSONSource | undefined;
  source?.setData(createPreviewFeatureCollection(previewPolygon));
}

function clearPreviewPolygon(map: Map | null) {
  if (!map?.isStyleLoaded()) {
    return;
  }

  const source = map.getSource(PREVIEW_SOURCE_ID) as GeoJSONSource | undefined;
  source?.setData(EMPTY_PREVIEW_FEATURE_COLLECTION);
}

export function KingdomLocationMap({
  mapStyleUrl,
  playerDisplayName,
  playerEmail,
}: KingdomLocationMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Map | null>(null);
  const markerRef = useRef<Marker | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<SelectedLocation | null>(null);
  const [mapError, setMapError] = useState<string | null>(
    mapStyleUrl ? null : "NEXT_PUBLIC_MAP_STYLE_URL is required before the map can load.",
  );
  const [isMapReady, setIsMapReady] = useState(false);
  const [validationResult, setValidationResult] = useState<LocationValidationResponse | null>(
    null,
  );
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const selectLocation = useCallback((nextLocation: SelectedLocation) => {
    setSelectedLocation(nextLocation);
    setValidationResult(null);
    setValidationError(null);
    clearPreviewPolygon(mapRef.current);

    const map = mapRef.current;

    if (!map) {
      return;
    }

    if (!markerRef.current) {
      markerRef.current = new maplibregl.Marker({ color: "#183f35" })
        .setLngLat([nextLocation.longitude, nextLocation.latitude])
        .addTo(map);
    } else {
      markerRef.current.setLngLat([nextLocation.longitude, nextLocation.latitude]);
    }
  }, []);

  useEffect(() => {
    if (!mapContainerRef.current || !mapStyleUrl) {
      return;
    }

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: mapStyleUrl,
      center: RIYADH_CENTER,
      zoom: 4,
      attributionControl: { compact: true },
    });

    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "top-right");

    map.on("load", () => {
      setIsMapReady(true);
      clearPreviewPolygon(map);
    });

    map.on("click", (event) => {
      const nextLocation = {
        latitude: event.lngLat.lat,
        longitude: event.lngLat.lng,
      };

      selectLocation(nextLocation);
    });

    map.on("error", () => {
      setMapError("Map style could not be loaded. Check NEXT_PUBLIC_MAP_STYLE_URL.");
    });

    return () => {
      markerRef.current?.remove();
      markerRef.current = null;
      setIsMapReady(false);
      map.remove();
      mapRef.current = null;
    };
  }, [mapStyleUrl, selectLocation]);

  useEffect(() => {
    const map = mapRef.current;

    if (!map) {
      return;
    }

    if (validationResult?.valid && validationResult.previewPolygon) {
      setPreviewPolygon(map, validationResult.previewPolygon);
      return;
    }

    clearPreviewPolygon(map);
  }, [validationResult]);

  async function validateLocation(location: SelectedLocation) {
    setIsValidating(true);
    setValidationResult(null);
    setValidationError(null);
    clearPreviewPolygon(mapRef.current);

    try {
      const response = await fetch("/api/kingdom/validate-location", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          lat: location.latitude,
          lng: location.longitude,
        }),
      });
      const result = (await response.json()) as LocationValidationResponse;

      setValidationResult(result);

      if (!response.ok && result.valid) {
        setValidationError("Location validation failed.");
      }
    } catch {
      setValidationError("Location validation could not be reached.");
    } finally {
      setIsValidating(false);
    }
  }

  async function handleValidateLocation() {
    if (!selectedLocation) {
      return;
    }

    await validateLocation(selectedLocation);
  }

  async function handleSuggestionClick(suggestion: LocationSuggestion) {
    const nextLocation = {
      latitude: suggestion.lat,
      longitude: suggestion.lng,
    };

    selectLocation(nextLocation);
    mapRef.current?.panTo([suggestion.lng, suggestion.lat]);
    await validateLocation(nextLocation);
  }

  function handleChangeLocation() {
    setValidationResult(null);
    setValidationError(null);
    clearPreviewPolygon(mapRef.current);
  }

  const validationStatus = getLocationValidationUiStatus({
    hasSelectedLocation: Boolean(selectedLocation),
    isValidating,
    validationResult,
    validationError,
  });
  const validationReasonDisplay =
    validationResult && !validationResult.valid
      ? formatValidationReason(validationResult.reason, {
          overlapsExistingKingdom: validationResult.overlap?.overlaps,
        })
      : null;
  const validateButtonDisabled = !selectedLocation || isValidating || !isMapReady || Boolean(mapError);

  return (
    <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="mamalik-card relative min-h-[520px] overflow-hidden bg-[#eef3ec]">
        <div ref={mapContainerRef} className="h-[520px] w-full" />
        {!mapError && !isMapReady ? (
          <div className="absolute inset-x-4 top-4 rounded-md border border-[#dfe5dc] bg-white/90 px-3 py-2 text-sm font-medium text-[#183f35] shadow-sm">
            Loading map...
          </div>
        ) : null}
        {mapError ? (
          <div className="border-t border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {mapError}
          </div>
        ) : null}
      </div>

      <aside className="space-y-4">
        <section className="mamalik-card p-5">
          <p className="text-sm text-[#5f665d]">Signed in</p>
          <p className="mt-1 text-lg font-semibold text-[#10140f]">
            {playerDisplayName}
          </p>
          <p className="text-sm text-[#5f665d]">{playerEmail}</p>
        </section>

        <section className="mamalik-card p-5">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-[#10140f]">Search</span>
            <input
              className="mamalik-input px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-70"
              disabled
              placeholder="Search locations"
              type="search"
            />
          </label>
        </section>

        <section className="mamalik-card p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-[#10140f]">Location validation</h2>
              <p className="mt-1 text-sm text-[#5f665d]">
                {describeLocationValidationStatus(validationStatus)}
              </p>
            </div>
            <span className="shrink-0 rounded-full border border-[#dfe5dc] bg-[#f7f8f4] px-2.5 py-1 text-xs font-semibold text-[#183f35]">
              {formatLocationValidationStatus(validationStatus)}
            </span>
          </div>

          {selectedLocation ? (
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-[#5f665d]">Latitude</dt>
                <dd className="font-semibold text-[#10140f]">
                  {formatCoordinate(selectedLocation.latitude)}
                </dd>
              </div>
              <div>
                <dt className="text-[#5f665d]">Longitude</dt>
                <dd className="font-semibold text-[#10140f]">
                  {formatCoordinate(selectedLocation.longitude)}
                </dd>
              </div>
            </dl>
          ) : (
            <p className="mt-3 text-sm text-[#5f665d]">
              Click the map to choose a starting point.
            </p>
          )}

          <button
            className="mamalik-action-primary mt-5 w-full px-4 py-2.5"
            disabled={validateButtonDisabled}
            onClick={handleValidateLocation}
            type="button"
          >
            {isValidating ? "Validating..." : "Validate location"}
          </button>

          {validationError ? (
            <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {validationError}
            </p>
          ) : null}

          {validationResult?.valid ? (
            <div className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
              <p className="font-medium">Location has a valid border preview.</p>
              <dl className="mt-2 grid grid-cols-2 gap-2">
                <div>
                  <dt className="text-emerald-900/70">Usable land</dt>
                  <dd className="font-semibold">
                    {formatSquareMeters(validationResult.usableLandM2)}
                  </dd>
                </div>
                <div>
                  <dt className="text-emerald-900/70">Visible area</dt>
                  <dd className="font-semibold">
                    {formatSquareMeters(validationResult.visibleAreaM2)}
                  </dd>
                </div>
                <div>
                  <dt className="text-emerald-900/70">Target area</dt>
                  <dd className="font-semibold">
                    {formatSquareMeters(validationResult.targetAreaM2)}
                  </dd>
                </div>
                <div>
                  <dt className="text-emerald-900/70">Border fit</dt>
                  <dd className="font-semibold">
                    {formatToleranceStatus(validationResult.toleranceStatus)}
                    {validationResult.toleranceStatus ? (
                      <span className="ml-1 text-xs font-medium">
                        ({validationResult.toleranceStatus})
                      </span>
                    ) : null}
                  </dd>
                </div>
                <div>
                  <dt className="text-emerald-900/70">Area type</dt>
                  <dd className="font-semibold">
                    {validationResult.areaType
                      ? getLandAreaTypeLabel(validationResult.areaType)
                      : "Standard"}
                  </dd>
                </div>
              </dl>
            </div>
          ) : null}

          {validationResult && !validationResult.valid && validationReasonDisplay ? (
            <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              <p className="font-medium">{validationReasonDisplay.title}</p>
              <p className="mt-1 text-amber-900">{validationReasonDisplay.description}</p>
              {validationResult.suggestions.length > 0 ? (
                <div className="mt-3 space-y-2">
                  <p className="text-xs font-medium uppercase tracking-wide">
                    Nearby valid suggestions
                  </p>
                  {validationResult.suggestions.map((suggestion) => (
                    <button
                      className="block w-full rounded-md border border-amber-300 bg-white px-3 py-2 text-left text-sm text-neutral-950 hover:bg-amber-100"
                      key={`${suggestion.lat}-${suggestion.lng}-${suggestion.distanceM ?? 0}-${suggestion.bearingDeg ?? 0}`}
                      onClick={() => handleSuggestionClick(suggestion)}
                      type="button"
                    >
                      <span className="font-medium">Use this location</span>
                      <span className="block text-xs text-neutral-600">
                        {formatCoordinate(suggestion.lat)}, {formatCoordinate(suggestion.lng)}
                      </span>
                      <span className="mt-1 block text-xs text-neutral-600">
                        {formatSuggestionSummary(suggestion)}
                      </span>
                      <span className="mt-2 grid grid-cols-2 gap-2 text-xs text-neutral-600">
                        <span>Distance: {formatDistanceMeters(suggestion.distanceM) ?? "nearby"}</span>
                        <span>Direction: {formatBearing(suggestion.bearingDeg) ?? "unknown"}</span>
                        <span>Visible: {formatSquareMeters(suggestion.visibleAreaM2)}</span>
                        <span>Fit: {formatToleranceStatus(suggestion.toleranceStatus)}</span>
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-xs text-amber-900">
                  No nearby valid suggestions were found. Choose another point and validate again.
                </p>
              )}
            </div>
          ) : null}
        </section>

        {selectedLocation && validationResult?.valid ? (
          <KingdomConfirmationPanel
            onChangeLocation={handleChangeLocation}
            playerDisplayName={playerDisplayName}
            selectedLocation={selectedLocation}
            validationResult={validationResult}
          />
        ) : null}

        <section className="mamalik-card p-5">
          <h2 className="text-lg font-semibold text-[#10140f]">Starting Rules</h2>
          <ul className="mt-3 space-y-2 text-sm text-[#5f665d]">
            <li>Kingdoms start with 50,000 m2 usable land.</li>
            <li>The selected location must be valid land.</li>
            <li>Visible borders are generated separately from gameplay usable land.</li>
          </ul>
        </section>
      </aside>
    </section>
  );
}
