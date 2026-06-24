import type { LocationCoordinates } from "@/lib/kingdom/location-validation";

export const LAND_MASK_SOURCE = "MAMALIK_COARSE_V0_1";
const LAND_MASK_TABLE_REGCLASS = '"LandMaskPolygon"';

export type LandMaskStatus = "LAND" | "WATER" | "DATA_MISSING";

export type LandMaskValidationResult =
  | {
      status: "LAND";
      source: string;
      matchedPolygonName: string | null;
      allowMissingData: false;
    }
  | {
      status: "WATER";
      source: string;
      allowMissingData: false;
    }
  | {
      status: "DATA_MISSING";
      source: string;
      allowMissingData: boolean;
      reason: "TABLE_MISSING" | "EMPTY";
    };

type LandMaskQueryClient = {
  $queryRaw<T = unknown>(
    strings: TemplateStringsArray,
    ...values: unknown[]
  ): Promise<T>;
};

type TableExistsRow = {
  tableExists: boolean | string | null;
};

type LandMaskHitRow = {
  maskCount: number | bigint;
  matchedSource: string | null;
  matchedName: string | null;
};

export function isMissingLandMaskAllowed(
  env: { ALLOW_MISSING_LAND_MASK?: string } = process.env as {
    ALLOW_MISSING_LAND_MASK?: string;
  },
): boolean {
  const value = env.ALLOW_MISSING_LAND_MASK?.trim().toLowerCase();

  return value === "1" || value === "true" || value === "yes";
}

export function createLandMaskValidationResult(
  input: {
    tableExists: boolean;
    maskCount: number;
    matchedSource: string | null;
    matchedName: string | null;
  },
  allowMissingData: boolean,
): LandMaskValidationResult {
  if (!input.tableExists) {
    return {
      status: "DATA_MISSING",
      source: LAND_MASK_SOURCE,
      allowMissingData,
      reason: "TABLE_MISSING",
    };
  }

  if (input.maskCount <= 0) {
    return {
      status: "DATA_MISSING",
      source: LAND_MASK_SOURCE,
      allowMissingData,
      reason: "EMPTY",
    };
  }

  if (input.matchedSource) {
    return {
      status: "LAND",
      source: input.matchedSource,
      matchedPolygonName: input.matchedName,
      allowMissingData: false,
    };
  }

  return {
    status: "WATER",
    source: LAND_MASK_SOURCE,
    allowMissingData: false,
  };
}

export async function validatePointAgainstLandMask(
  db: LandMaskQueryClient,
  coordinates: LocationCoordinates,
): Promise<LandMaskValidationResult> {
  const allowMissingData = isMissingLandMaskAllowed();
  const tableRows = await db.$queryRaw<TableExistsRow[]>`
    SELECT to_regclass(${LAND_MASK_TABLE_REGCLASS}) IS NOT NULL AS "tableExists"
  `;
  const tableExists = Boolean(tableRows[0]?.tableExists);

  if (!tableExists) {
    return createLandMaskValidationResult(
      {
        tableExists: false,
        maskCount: 0,
        matchedSource: null,
        matchedName: null,
      },
      allowMissingData,
    );
  }

  const rows = await db.$queryRaw<LandMaskHitRow[]>`
    WITH point AS (
      SELECT ST_SetSRID(ST_MakePoint(${coordinates.lng}, ${coordinates.lat}), 4326) AS geom
    ),
    mask_count AS (
      SELECT COUNT(*)::int AS "maskCount"
      FROM "LandMaskPolygon"
    ),
    hit AS (
      SELECT "source", "name"
      FROM "LandMaskPolygon", point
      WHERE ST_Covers("LandMaskPolygon"."geom", point.geom)
      LIMIT 1
    )
    SELECT
      (SELECT "maskCount" FROM mask_count) AS "maskCount",
      (SELECT "source" FROM hit) AS "matchedSource",
      (SELECT "name" FROM hit) AS "matchedName"
  `;
  const row = rows[0];

  return createLandMaskValidationResult(
    {
      tableExists: true,
      maskCount: Number(row?.maskCount ?? 0),
      matchedSource: row?.matchedSource ?? null,
      matchedName: row?.matchedName ?? null,
    },
    allowMissingData,
  );
}
