"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getLandAreaTypeLabel } from "@mamalik/game";
import maplibregl, { type LngLatLike, type Map, type Marker } from "maplibre-gl";
import { KingdomConfirmationPanel } from "@/components/create-kingdom/KingdomConfirmationPanel";
import type {
  LocationSuggestion,
  LocationValidationResponse,
} from "@/lib/kingdom/location-validation";

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

function formatCoordinate(value: number): string {
  return value.toFixed(6);
}

function formatDistanceMeters(value: number | undefined): string | null {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null;
  }

  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)} km`;
  }

  return `${Math.round(value)} m`;
}

function formatBearing(value: number | undefined): string | null {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null;
  }

  return `${Math.round(value)} deg`;
}

function formatReason(reason: string | null): string {
  switch (reason) {
    case "too-close-to-existing-kingdom":
      return "That point is too close to an existing kingdom.";
    case "water":
      return "That point is water. Choose a location on land.";
    case "land-mask-data-missing":
      return "Land validation data is not loaded yet.";
    case "restricted-zone":
      return "That point is inside a restricted no-start zone.";
    case "restricted-zone-data-missing":
      return "Restricted-zone validation data is not loaded yet.";
    case "user-already-has-kingdom":
      return "This account already has a kingdom.";
    case "missing-coordinates":
      return "Choose a map point before validating.";
    case "invalid-coordinates":
      return "The selected coordinates are invalid.";
    case "latitude-out-of-range":
      return "Latitude must be between -90 and 90.";
    case "longitude-out-of-range":
      return "Longitude must be between -180 and 180.";
    case "unauthenticated":
      return "Sign in before validating a kingdom location.";
    case "border-generation-failed":
      return "The selected point could not generate a valid border preview.";
    default:
      return "Location validation failed.";
  }
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
  const [validationResult, setValidationResult] = useState<LocationValidationResponse | null>(
    null,
  );
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const selectLocation = useCallback((nextLocation: SelectedLocation) => {
    setSelectedLocation(nextLocation);
    setValidationResult(null);
    setValidationError(null);

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
      map.remove();
      mapRef.current = null;
    };
  }, [mapStyleUrl, selectLocation]);

  async function handleValidateLocation() {
    if (!selectedLocation) {
      return;
    }

    setIsValidating(true);
    setValidationResult(null);
    setValidationError(null);

    try {
      const response = await fetch("/api/kingdom/validate-location", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          lat: selectedLocation.latitude,
          lng: selectedLocation.longitude,
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

  function handleSuggestionClick(suggestion: LocationSuggestion) {
    selectLocation({
      latitude: suggestion.lat,
      longitude: suggestion.lng,
    });
    mapRef.current?.panTo([suggestion.lng, suggestion.lat]);
  }

  function handleChangeLocation() {
    setValidationResult(null);
    setValidationError(null);
  }

  return (
    <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="mamalik-card min-h-[520px] overflow-hidden bg-[#eef3ec]">
        <div ref={mapContainerRef} className="h-[520px] w-full" />
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
          <h2 className="text-lg font-semibold text-[#10140f]">Selected Location</h2>
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
            disabled={!selectedLocation || isValidating}
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
              <p className="mt-1">
                Usable land: {validationResult.usableLandM2.toLocaleString()} m2
              </p>
              {validationResult.toleranceStatus ? (
                <p className="mt-1">Border tolerance: {validationResult.toleranceStatus}</p>
              ) : null}
              {validationResult.areaType ? (
                <p className="mt-1">
                  Area type: {getLandAreaTypeLabel(validationResult.areaType)}
                </p>
              ) : null}
            </div>
          ) : null}

          {validationResult && !validationResult.valid ? (
            <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              <p className="font-medium">{formatReason(validationResult.reason)}</p>
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
                      <span className="font-medium">
                        {suggestion.label ?? "Nearby valid location"}
                      </span>
                      <span className="block text-xs text-neutral-600">
                        {formatCoordinate(suggestion.lat)}, {formatCoordinate(suggestion.lng)}
                      </span>
                      <span className="mt-1 block text-xs text-neutral-600">
                        {[
                          formatDistanceMeters(suggestion.distanceM),
                          formatBearing(suggestion.bearingDeg),
                          suggestion.toleranceStatus
                            ? `border ${suggestion.toleranceStatus.toLowerCase()}`
                            : null,
                          suggestion.visibleAreaM2
                            ? `${suggestion.visibleAreaM2.toLocaleString()} m2`
                            : null,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
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
