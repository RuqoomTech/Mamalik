import type { PreviewPolygon } from "@/lib/kingdom/location-validation";
import {
  appendUniqueBorderRadius,
  calculateCircularBorderRadiusM,
  calculateCorrectedBorderRadiusM,
  classifyVisibleBorderTolerance,
  createAdjustedBorderRadii,
  MAX_VISIBLE_BORDER_ATTEMPTS,
  selectBestVisibleBorderAttempt,
  type VisibleBorderGenerationAttempt,
  type VisibleBorderToleranceStatus,
} from "@/lib/map/border-generation";

export type BorderPreviewResult = {
  previewPolygon: PreviewPolygon;
  visibleAreaM2: number;
  toleranceStatus: VisibleBorderToleranceStatus;
  targetAreaM2: number;
  radiusM: number;
  attempts: VisibleBorderGenerationAttempt[];
};

export type BorderOverlapResult = {
  overlaps: boolean;
  overlappingKingdomCount: number;
};

type PostgisQueryClient = {
  $queryRaw<T = unknown>(
    strings: TemplateStringsArray,
    ...values: unknown[]
  ): Promise<T>;
};

type BorderPreviewRow = {
  geojson: unknown;
  visibleAreaM2: number;
};

type OverlapRow = {
  overlapCount: number | bigint;
};

export async function generateVisibleBorderPreview(
  db: PostgisQueryClient,
  input: {
    lat: number;
    lng: number;
    targetAreaM2: number;
  },
): Promise<BorderPreviewResult> {
  const targetAreaM2 = input.targetAreaM2;
  const initialRadiusM = calculateCircularBorderRadiusM(targetAreaM2);
  let radiusAttempts = appendUniqueBorderRadius([], initialRadiusM);
  const attempts: BorderPreviewCandidate[] = [];

  for (
    let index = 0;
    index < radiusAttempts.length && index < MAX_VISIBLE_BORDER_ATTEMPTS;
    index += 1
  ) {
    const candidate = await generateVisibleBorderPreviewAtRadius(db, {
      lat: input.lat,
      lng: input.lng,
      radiusM: radiusAttempts[index] ?? initialRadiusM,
    });

    attempts.push(candidate);

    if (candidate.toleranceStatus === "STRICT") {
      return createBorderPreviewResult(candidate, attempts, targetAreaM2);
    }

    if (index === 0) {
      radiusAttempts = appendUniqueBorderRadius(
        radiusAttempts,
        calculateCorrectedBorderRadiusM({
          currentRadiusM: candidate.radiusM,
          targetAreaM2,
          measuredAreaM2: candidate.visibleAreaM2,
        }),
      );

      for (const adjustedRadiusM of createAdjustedBorderRadii(initialRadiusM)) {
        radiusAttempts = appendUniqueBorderRadius(radiusAttempts, adjustedRadiusM);
      }
    }
  }

  const bestAttempt = selectBestVisibleBorderAttempt(attempts, targetAreaM2);

  if (!bestAttempt) {
    throw new Error("postgis-border-preview-empty");
  }

  return createBorderPreviewResult(bestAttempt, attempts, targetAreaM2);
}

type BorderPreviewCandidate = VisibleBorderGenerationAttempt & {
  previewPolygon: PreviewPolygon;
};

async function generateVisibleBorderPreviewAtRadius(
  db: PostgisQueryClient,
  input: {
    lat: number;
    lng: number;
    radiusM: number;
  },
): Promise<BorderPreviewCandidate> {
  const rows = await db.$queryRaw<BorderPreviewRow[]>`
    WITH generated AS (
      SELECT ST_Buffer(
        ST_SetSRID(ST_MakePoint(${input.lng}, ${input.lat}), 4326)::geography,
        ${input.radiusM}
      )::geometry AS geom
    )
    SELECT
      ST_AsGeoJSON(geom)::json AS "geojson",
      ST_Area(geom::geography)::float8 AS "visibleAreaM2"
    FROM generated
  `;
  const row = rows[0];

  if (!row) {
    throw new Error("postgis-border-preview-empty");
  }

  const previewPolygon = parsePreviewPolygon(row.geojson);
  const visibleAreaM2 = Math.round(Number(row.visibleAreaM2));

  return {
    previewPolygon,
    visibleAreaM2,
    toleranceStatus: classifyVisibleBorderTolerance(visibleAreaM2),
    radiusM: input.radiusM,
  };
}

function createBorderPreviewResult(
  selectedAttempt: BorderPreviewCandidate,
  attempts: BorderPreviewCandidate[],
  targetAreaM2: number,
): BorderPreviewResult {
  return {
    previewPolygon: selectedAttempt.previewPolygon,
    visibleAreaM2: selectedAttempt.visibleAreaM2,
    toleranceStatus: selectedAttempt.toleranceStatus,
    targetAreaM2,
    radiusM: selectedAttempt.radiusM,
    attempts: attempts.map((attempt) => ({
      radiusM: attempt.radiusM,
      visibleAreaM2: attempt.visibleAreaM2,
      toleranceStatus: attempt.toleranceStatus,
    })),
  };
}

export async function doesBorderOverlapExistingKingdoms(
  db: PostgisQueryClient,
  input: {
    previewPolygon: PreviewPolygon;
    excludeKingdomId?: string;
  },
): Promise<BorderOverlapResult> {
  const previewPolygonJson = JSON.stringify(input.previewPolygon);
  const rows = input.excludeKingdomId
    ? await db.$queryRaw<OverlapRow[]>`
      SELECT COUNT(*)::int AS "overlapCount"
      FROM "Kingdom"
      WHERE "id" <> ${input.excludeKingdomId}
        AND ST_Intersects(
          ST_SetSRID(ST_GeomFromGeoJSON("visibleBorderGeojson"::text), 4326),
          ST_SetSRID(ST_GeomFromGeoJSON(${previewPolygonJson}), 4326)
        )
    `
    : await db.$queryRaw<OverlapRow[]>`
      SELECT COUNT(*)::int AS "overlapCount"
      FROM "Kingdom"
      WHERE ST_Intersects(
        ST_SetSRID(ST_GeomFromGeoJSON("visibleBorderGeojson"::text), 4326),
        ST_SetSRID(ST_GeomFromGeoJSON(${previewPolygonJson}), 4326)
      )
    `;
  const overlapCount = Number(rows[0]?.overlapCount ?? 0);

  return {
    overlaps: overlapCount > 0,
    overlappingKingdomCount: overlapCount,
  };
}

function parsePreviewPolygon(value: unknown): PreviewPolygon {
  const parsedValue = typeof value === "string" ? JSON.parse(value) : value;

  if (!isPreviewPolygon(parsedValue)) {
    throw new Error("postgis-border-preview-invalid-geojson");
  }

  return parsedValue;
}

function isPreviewPolygon(value: unknown): value is PreviewPolygon {
  if (!value || typeof value !== "object") {
    return false;
  }

  const polygon = value as { type?: unknown; coordinates?: unknown };

  return polygon.type === "Polygon" && Array.isArray(polygon.coordinates);
}
