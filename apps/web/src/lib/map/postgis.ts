import type { PreviewPolygon } from "@/lib/kingdom/location-validation";
import {
  calculateCircularBorderRadiusM,
  classifyVisibleBorderTolerance,
  type VisibleBorderToleranceStatus,
} from "@/lib/map/border-generation";

export type BorderPreviewResult = {
  previewPolygon: PreviewPolygon;
  visibleAreaM2: number;
  toleranceStatus: VisibleBorderToleranceStatus;
  radiusM: number;
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
  const radiusM = calculateCircularBorderRadiusM(input.targetAreaM2);
  const rows = await db.$queryRaw<BorderPreviewRow[]>`
    WITH generated AS (
      SELECT ST_Buffer(
        ST_SetSRID(ST_MakePoint(${input.lng}, ${input.lat}), 4326)::geography,
        ${radiusM}
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
    radiusM,
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
