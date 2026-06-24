import {
  STARTING_USABLE_LAND_M2,
  TEMPORARY_MIN_KINGDOM_DISTANCE_M,
  TEMPORARY_VISIBLE_AREA_M2,
} from "@mamalik/game/constants";

export type CoordinateInput = {
  lat: unknown;
  lng: unknown;
};

export type KingdomPoint = {
  centerLat: number;
  centerLng: number;
};

export type LocationCoordinates = {
  lat: number;
  lng: number;
};

export type LocationSuggestion = LocationCoordinates & {
  label: string;
};

export type PreviewPolygon = {
  type: "Polygon";
  coordinates: number[][][];
};

export type LocationValidationReason =
  | "missing-coordinates"
  | "invalid-coordinates"
  | "latitude-out-of-range"
  | "longitude-out-of-range"
  | "user-already-has-kingdom"
  | "too-close-to-existing-kingdom"
  | "unauthenticated"
  | "border-generation-failed";

export type LocationValidationResponse = {
  ok?: boolean;
  valid: boolean;
  reason: LocationValidationReason | null;
  center?: LocationCoordinates | null;
  usableLandM2: number;
  visibleAreaM2: number | null;
  previewPolygon: PreviewPolygon | null;
  toleranceStatus?: "STRICT" | "LOOSE" | "FALLBACK" | null;
  overlap?: {
    overlaps: boolean;
    overlappingKingdomCount: number;
  } | null;
  waterCheck?: "NOT_IMPLEMENTED";
  restrictedZoneCheck?: "NOT_IMPLEMENTED";
  suggestions: LocationSuggestion[];
};

type CoordinateParseResult =
  | { ok: true; coordinates: LocationCoordinates }
  | { ok: false; reason: LocationValidationReason };

const EARTH_RADIUS_M = 6_371_000;
const METERS_PER_DEGREE_LATITUDE = 111_320;

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}

function roundCoordinate(value: number): number {
  return Number(value.toFixed(6));
}

export function parseLocationCoordinates(input: Partial<CoordinateInput>): CoordinateParseResult {
  if (!("lat" in input) || !("lng" in input)) {
    return { ok: false, reason: "missing-coordinates" };
  }

  if (typeof input.lat !== "number" || typeof input.lng !== "number") {
    return { ok: false, reason: "invalid-coordinates" };
  }

  if (!Number.isFinite(input.lat) || !Number.isFinite(input.lng)) {
    return { ok: false, reason: "invalid-coordinates" };
  }

  if (input.lat < -90 || input.lat > 90) {
    return { ok: false, reason: "latitude-out-of-range" };
  }

  if (input.lng < -180 || input.lng > 180) {
    return { ok: false, reason: "longitude-out-of-range" };
  }

  return {
    ok: true,
    coordinates: {
      lat: input.lat,
      lng: input.lng,
    },
  };
}

export function calculateDistanceMeters(
  first: LocationCoordinates,
  second: LocationCoordinates,
): number {
  const deltaLat = toRadians(second.lat - first.lat);
  const deltaLng = toRadians(second.lng - first.lng);
  const firstLat = toRadians(first.lat);
  const secondLat = toRadians(second.lat);
  const haversine =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(firstLat) * Math.cos(secondLat) * Math.sin(deltaLng / 2) ** 2;

  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(haversine));
}

function isInsideCoordinateBounds(coordinates: LocationCoordinates): boolean {
  return (
    coordinates.lat >= -90 &&
    coordinates.lat <= 90 &&
    coordinates.lng >= -180 &&
    coordinates.lng <= 180
  );
}

export function isTooCloseToExistingKingdom(
  coordinates: LocationCoordinates,
  existingKingdoms: KingdomPoint[],
  minimumDistanceM = TEMPORARY_MIN_KINGDOM_DISTANCE_M,
): boolean {
  return existingKingdoms.some((kingdom) => {
    const kingdomCoordinates = {
      lat: kingdom.centerLat,
      lng: kingdom.centerLng,
    };

    return calculateDistanceMeters(coordinates, kingdomCoordinates) < minimumDistanceM;
  });
}

function offsetCoordinates(
  coordinates: LocationCoordinates,
  northMeters: number,
  eastMeters: number,
): LocationCoordinates {
  const lat = coordinates.lat + northMeters / METERS_PER_DEGREE_LATITUDE;
  const metersPerDegreeLongitude =
    METERS_PER_DEGREE_LATITUDE * Math.cos(toRadians(coordinates.lat));
  const lng =
    Math.abs(metersPerDegreeLongitude) < 1
      ? coordinates.lng
      : coordinates.lng + eastMeters / metersPerDegreeLongitude;

  return {
    lat: roundCoordinate(lat),
    lng: roundCoordinate(lng),
  };
}

export function createTemporaryPreviewPolygon(
  coordinates: LocationCoordinates,
  visibleAreaM2 = TEMPORARY_VISIBLE_AREA_M2,
): PreviewPolygon {
  const halfSideM = Math.sqrt(visibleAreaM2) / 2;
  const southwest = offsetCoordinates(coordinates, -halfSideM, -halfSideM);
  const southeast = offsetCoordinates(coordinates, -halfSideM, halfSideM);
  const northeast = offsetCoordinates(coordinates, halfSideM, halfSideM);
  const northwest = offsetCoordinates(coordinates, halfSideM, -halfSideM);

  return {
    type: "Polygon",
    coordinates: [
      [
        [southwest.lng, southwest.lat],
        [southeast.lng, southeast.lat],
        [northeast.lng, northeast.lat],
        [northwest.lng, northwest.lat],
        [southwest.lng, southwest.lat],
      ],
    ],
  };
}

export function createNearbySuggestions(
  coordinates: LocationCoordinates,
  existingKingdoms: KingdomPoint[],
  minimumDistanceM = TEMPORARY_MIN_KINGDOM_DISTANCE_M,
): LocationSuggestion[] {
  const offsetDistanceM = minimumDistanceM * 2;
  const candidateOffsets = [
    [offsetDistanceM, 0],
    [0, offsetDistanceM],
    [offsetDistanceM, offsetDistanceM],
    [-offsetDistanceM, 0],
    [0, -offsetDistanceM],
  ];

  return candidateOffsets
    .map(([northMeters, eastMeters]) => offsetCoordinates(coordinates, northMeters, eastMeters))
    .filter((candidate) => isInsideCoordinateBounds(candidate))
    .filter((candidate) => !isTooCloseToExistingKingdom(candidate, existingKingdoms, minimumDistanceM))
    .slice(0, 3)
    .map((candidate) => ({
      ...candidate,
      label: "Nearby valid point",
    }));
}

export function createInvalidLocationResponse(
  reason: LocationValidationReason,
  suggestions: LocationSuggestion[] = [],
): LocationValidationResponse {
  return {
    ok: false,
    valid: false,
    reason,
    center: null,
    usableLandM2: STARTING_USABLE_LAND_M2,
    visibleAreaM2: null,
    previewPolygon: null,
    toleranceStatus: null,
    overlap: null,
    waterCheck: "NOT_IMPLEMENTED",
    restrictedZoneCheck: "NOT_IMPLEMENTED",
    suggestions,
  };
}

export function validateTemporaryKingdomLocation(
  coordinates: LocationCoordinates,
  existingKingdoms: KingdomPoint[],
): LocationValidationResponse {
  if (isTooCloseToExistingKingdom(coordinates, existingKingdoms)) {
    return createInvalidLocationResponse(
      "too-close-to-existing-kingdom",
      createNearbySuggestions(coordinates, existingKingdoms),
    );
  }

  return {
    ok: true,
    valid: true,
    reason: null,
    center: coordinates,
    usableLandM2: STARTING_USABLE_LAND_M2,
    visibleAreaM2: TEMPORARY_VISIBLE_AREA_M2,
    previewPolygon: createTemporaryPreviewPolygon(coordinates),
    toleranceStatus: "STRICT",
    overlap: {
      overlaps: false,
      overlappingKingdomCount: 0,
    },
    waterCheck: "NOT_IMPLEMENTED",
    restrictedZoneCheck: "NOT_IMPLEMENTED",
    suggestions: [],
  };
}
