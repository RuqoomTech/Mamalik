import type {
  LocationCoordinates,
  PreviewPolygon,
} from "@/lib/kingdom/location-validation";

export const RESTRICTED_ZONE_SOURCE = "MAMALIK_RESTRICTED_V0_1";
const RESTRICTED_ZONE_TABLE_REGCLASS = '"RestrictedZone"';

export type RestrictedZoneCategory =
  | "AIRPORT"
  | "MILITARY"
  | "PROTECTED_AREA"
  | "ADMIN_BLOCK"
  | "TEST_FIXTURE";

export type RestrictedZoneStatus = "CLEAR" | "RESTRICTED" | "DATA_MISSING";

export type RestrictedZoneHit = {
  code: string;
  name: string;
  category: RestrictedZoneCategory;
  reason: string;
};

export type RestrictedZoneValidationResult =
  | {
      status: "CLEAR";
      source: string;
      zoneCount: number;
      zones: [];
    }
  | {
      status: "RESTRICTED";
      source: string;
      zoneCount: number;
      zones: RestrictedZoneHit[];
    }
  | {
      status: "DATA_MISSING";
      source: string;
      zoneCount: 0;
      zones: [];
      reason: "TABLE_MISSING";
    };

type RestrictedZoneQueryClient = {
  $queryRaw<T = unknown>(
    strings: TemplateStringsArray,
    ...values: unknown[]
  ): Promise<T>;
};

type TableExistsRow = {
  tableExists: boolean | string | null;
};

type RestrictedZoneCountRow = {
  zoneCount: number | bigint;
};

type RestrictedZoneRow = {
  source: string;
  code: string;
  name: string;
  category: RestrictedZoneCategory;
  reason: string;
};

export function createRestrictedZoneValidationResult(input: {
  tableExists: boolean;
  zoneCount: number;
  zones: RestrictedZoneHit[];
  source?: string;
}): RestrictedZoneValidationResult {
  if (!input.tableExists) {
    return {
      status: "DATA_MISSING",
      source: input.source ?? RESTRICTED_ZONE_SOURCE,
      zoneCount: 0,
      zones: [],
      reason: "TABLE_MISSING",
    };
  }

  if (input.zones.length > 0) {
    return {
      status: "RESTRICTED",
      source: input.source ?? RESTRICTED_ZONE_SOURCE,
      zoneCount: input.zoneCount,
      zones: input.zones,
    };
  }

  return {
    status: "CLEAR",
    source: input.source ?? RESTRICTED_ZONE_SOURCE,
    zoneCount: input.zoneCount,
    zones: [],
  };
}

export async function validatePointAndPreviewAgainstRestrictedZones(
  db: RestrictedZoneQueryClient,
  input: {
    coordinates: LocationCoordinates;
    previewPolygon: PreviewPolygon;
  },
): Promise<RestrictedZoneValidationResult> {
  const tableRows = await db.$queryRaw<TableExistsRow[]>`
    SELECT to_regclass(${RESTRICTED_ZONE_TABLE_REGCLASS}) IS NOT NULL AS "tableExists"
  `;
  const tableExists = Boolean(tableRows[0]?.tableExists);

  if (!tableExists) {
    return createRestrictedZoneValidationResult({
      tableExists: false,
      zoneCount: 0,
      zones: [],
    });
  }

  const countRows = await db.$queryRaw<RestrictedZoneCountRow[]>`
    SELECT COUNT(*)::int AS "zoneCount"
    FROM "RestrictedZone"
    WHERE "enabled" = true
  `;
  const zoneCount = Number(countRows[0]?.zoneCount ?? 0);
  const rows = await db.$queryRaw<RestrictedZoneRow[]>`
    WITH selected_point AS (
      SELECT ST_SetSRID(ST_MakePoint(${input.coordinates.lng}, ${input.coordinates.lat}), 4326) AS geom
    ),
    preview AS (
      SELECT ST_SetSRID(ST_GeomFromGeoJSON(${JSON.stringify(input.previewPolygon)}), 4326) AS geom
    ),
    hits AS (
      SELECT
        "source",
        "code",
        "name",
        "category",
        "reason"
      FROM "RestrictedZone", selected_point, preview
      WHERE
        "enabled" = true
        AND (
          ST_Covers("RestrictedZone"."geom", selected_point.geom)
          OR ST_Intersects("RestrictedZone"."geom", preview.geom)
        )
      ORDER BY "code"
      LIMIT 10
    )
    SELECT
      "source",
      "code",
      "name",
      "category",
      "reason"
    FROM hits
  `;
  const zones = rows.map((row) => ({
    code: row.code,
    name: row.name,
    category: row.category,
    reason: row.reason,
  }));

  return createRestrictedZoneValidationResult({
    tableExists: true,
    zoneCount,
    source: rows[0]?.source ?? RESTRICTED_ZONE_SOURCE,
    zones,
  });
}
