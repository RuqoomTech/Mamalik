import type { LocationCoordinates } from "@/lib/kingdom/location-validation";

export const BASE_MINIMUM_KINGDOM_SPACING_M = 300;
export const BORDER_SPACING_GAP_M = 50;
export const LOCATION_SUGGESTION_RINGS_M = [300, 600, 1_000, 1_500, 2_000] as const;
export const LOCATION_SUGGESTION_BEARINGS_DEG = [
  0, 45, 90, 135, 180, 225, 270, 315,
] as const;
export const MAX_LOCATION_SUGGESTION_CANDIDATES = 24;
export const MAX_LOCATION_SUGGESTIONS = 3;

const EARTH_RADIUS_M = 6_371_000;

export type LocationSuggestionCandidate = LocationCoordinates & {
  distanceM: number;
  bearingDeg: number;
};

export type SpacingValidationResult =
  | {
      status: "CLEAR";
      minimumDistanceM: number;
    }
  | {
      status: "TOO_CLOSE";
      minimumDistanceM: number;
      nearestDistanceM: number;
      nearestKingdomId?: string;
    };

type DynamicSpacingQueryClient = {
  $queryRaw<T = unknown>(
    strings: TemplateStringsArray,
    ...values: unknown[]
  ): Promise<T>;
};

type SpacingRow = {
  nearestKingdomId: string;
  nearestDistanceM: number;
};

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}

function toDegrees(value: number): number {
  return (value * 180) / Math.PI;
}

function roundCoordinate(value: number): number {
  return Number(value.toFixed(6));
}

function normalizeLongitude(lng: number): number {
  return ((((lng + 180) % 360) + 360) % 360) - 180;
}

function isInsideCoordinateBounds(coordinates: LocationCoordinates): boolean {
  return (
    coordinates.lat >= -90 &&
    coordinates.lat <= 90 &&
    coordinates.lng >= -180 &&
    coordinates.lng <= 180
  );
}

export function calculateDynamicMinimumSpacingM(
  previewRadiusM: number,
  baseMinimumM = BASE_MINIMUM_KINGDOM_SPACING_M,
): number {
  if (!Number.isFinite(previewRadiusM) || previewRadiusM <= 0) {
    return baseMinimumM;
  }

  return Math.max(baseMinimumM, Math.ceil(previewRadiusM * 2 + BORDER_SPACING_GAP_M));
}

export function projectCoordinates(
  coordinates: LocationCoordinates,
  distanceM: number,
  bearingDeg: number,
): LocationCoordinates {
  const angularDistance = distanceM / EARTH_RADIUS_M;
  const bearing = toRadians(bearingDeg);
  const lat1 = toRadians(coordinates.lat);
  const lng1 = toRadians(coordinates.lng);
  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(angularDistance) +
      Math.cos(lat1) * Math.sin(angularDistance) * Math.cos(bearing),
  );
  const lng2 =
    lng1 +
    Math.atan2(
      Math.sin(bearing) * Math.sin(angularDistance) * Math.cos(lat1),
      Math.cos(angularDistance) - Math.sin(lat1) * Math.sin(lat2),
    );

  return {
    lat: roundCoordinate(toDegrees(lat2)),
    lng: roundCoordinate(normalizeLongitude(toDegrees(lng2))),
  };
}

export function createLocationSuggestionCandidates(
  coordinates: LocationCoordinates,
): LocationSuggestionCandidate[] {
  return LOCATION_SUGGESTION_RINGS_M.flatMap((distanceM) =>
    LOCATION_SUGGESTION_BEARINGS_DEG.map((bearingDeg) => ({
      ...projectCoordinates(coordinates, distanceM, bearingDeg),
      distanceM,
      bearingDeg,
    })),
  ).filter(isInsideCoordinateBounds);
}

export function limitLocationSuggestions<T>(
  suggestions: T[],
  maxSuggestions = MAX_LOCATION_SUGGESTIONS,
): T[] {
  return suggestions.slice(0, Math.max(0, maxSuggestions));
}

export async function validateDynamicSpacingFromExistingKingdoms(
  db: DynamicSpacingQueryClient,
  input: {
    coordinates: LocationCoordinates;
    minimumDistanceM: number;
    excludeKingdomId?: string;
  },
): Promise<SpacingValidationResult> {
  const rows = input.excludeKingdomId
    ? await db.$queryRaw<SpacingRow[]>`
      WITH selected_point AS (
        SELECT ST_SetSRID(ST_MakePoint(${input.coordinates.lng}, ${input.coordinates.lat}), 4326)::geography AS geog
      )
      SELECT
        "id" AS "nearestKingdomId",
        ST_Distance(
          ST_SetSRID(ST_MakePoint("centerLng", "centerLat"), 4326)::geography,
          selected_point.geog
        )::float8 AS "nearestDistanceM"
      FROM "Kingdom", selected_point
      WHERE "id" <> ${input.excludeKingdomId}
        AND ST_DWithin(
          ST_SetSRID(ST_MakePoint("centerLng", "centerLat"), 4326)::geography,
          selected_point.geog,
          ${input.minimumDistanceM}
        )
      ORDER BY "nearestDistanceM" ASC
      LIMIT 1
    `
    : await db.$queryRaw<SpacingRow[]>`
      WITH selected_point AS (
        SELECT ST_SetSRID(ST_MakePoint(${input.coordinates.lng}, ${input.coordinates.lat}), 4326)::geography AS geog
      )
      SELECT
        "id" AS "nearestKingdomId",
        ST_Distance(
          ST_SetSRID(ST_MakePoint("centerLng", "centerLat"), 4326)::geography,
          selected_point.geog
        )::float8 AS "nearestDistanceM"
      FROM "Kingdom", selected_point
      WHERE ST_DWithin(
        ST_SetSRID(ST_MakePoint("centerLng", "centerLat"), 4326)::geography,
        selected_point.geog,
        ${input.minimumDistanceM}
      )
      ORDER BY "nearestDistanceM" ASC
      LIMIT 1
    `;
  const nearest = rows[0];

  if (!nearest) {
    return {
      status: "CLEAR",
      minimumDistanceM: input.minimumDistanceM,
    };
  }

  return {
    status: "TOO_CLOSE",
    minimumDistanceM: input.minimumDistanceM,
    nearestDistanceM: Math.round(Number(nearest.nearestDistanceM)),
    nearestKingdomId: nearest.nearestKingdomId,
  };
}
