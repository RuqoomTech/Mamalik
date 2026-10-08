import { generateKingdomShape } from "@mamalik/game";
import { getPrismaClient } from "@/lib/db/client";
import { parsePreviewPolygon } from "@/lib/map/postgis";

export type KingdomBorderRecalculation = {
  kingdomId: string;
  visibleAreaM2: number;
};

type BorderRow = {
  geojson: unknown;
  visibleAreaM2: number | null;
};

type KingdomBorderDb = {
  $queryRaw<T = unknown>(strings: TemplateStringsArray, ...values: unknown[]): Promise<T>;
  kingdom: {
    findUnique(args: {
      where: { id: string };
      select: { id: true; centerLat: true; centerLng: true; usableLandM2: true };
    }): Promise<{ id: string; centerLat: number; centerLng: number; usableLandM2: number } | null>;
    update(args: {
      where: { id: string };
      data: { visibleBorderGeojson: object; visibleAreaM2: number };
    }): Promise<unknown>;
  };
};

// Regrows a kingdom's visible border from its usable land: the kingdom keeps its own
// organic silhouette (seeded by its center), scaled to its land, then trimmed so it never
// covers a neighbour's border or open water. Gameplay land stays the exact usable credit.
export async function recalculateKingdomBorder(
  kingdomId: string,
  db: KingdomBorderDb = getPrismaClient() as unknown as KingdomBorderDb,
): Promise<KingdomBorderRecalculation | null> {
  const kingdom = await db.kingdom.findUnique({
    where: { id: kingdomId },
    select: { id: true, centerLat: true, centerLng: true, usableLandM2: true },
  });

  if (!kingdom) {
    return null;
  }

  const shapeJson = JSON.stringify(
    generateKingdomShape({ lat: kingdom.centerLat, lng: kingdom.centerLng, areaM2: kingdom.usableLandM2 }),
  );
  const rows = await db.$queryRaw<BorderRow[]>`
    WITH shape AS (
      SELECT ST_MakeValid(ST_SetSRID(ST_GeomFromGeoJSON(${shapeJson}), 4326)) AS geom
    ),
    center AS (
      SELECT ST_SetSRID(ST_MakePoint(${kingdom.centerLng}, ${kingdom.centerLat}), 4326) AS geom
    ),
    neighbours AS (
      SELECT ST_Union(ST_MakeValid(ST_SetSRID(ST_GeomFromGeoJSON(k."visibleBorderGeojson"::text), 4326))) AS geom
      FROM "Kingdom" k, shape
      WHERE k."id" <> ${kingdom.id}
        AND ST_Intersects(ST_SetSRID(ST_GeomFromGeoJSON(k."visibleBorderGeojson"::text), 4326), shape.geom)
    ),
    land AS (
      SELECT ST_Union(m."geom") AS geom
      FROM "LandMaskPolygon" m, shape
      WHERE ST_Intersects(m."geom", shape.geom)
    ),
    clipped AS (
      SELECT ST_CollectionExtract(
        ST_MakeValid(
          ST_Intersection(
            ST_Difference(shape.geom, COALESCE(neighbours.geom, ST_GeomFromText('POLYGON EMPTY', 4326))),
            COALESCE(land.geom, shape.geom)
          )
        ),
        3
      ) AS geom
      FROM shape, neighbours, land
    ),
    parts AS (
      SELECT (ST_Dump(clipped.geom)).geom AS geom FROM clipped
    ),
    chosen AS (
      SELECT parts.geom
      FROM parts, center
      ORDER BY ST_Covers(parts.geom, center.geom) DESC, ST_Area(parts.geom::geography) DESC
      LIMIT 1
    )
    SELECT
      ST_AsGeoJSON(chosen.geom, 7)::json AS "geojson",
      ST_Area(chosen.geom::geography)::float8 AS "visibleAreaM2"
    FROM chosen
  `;
  const row = rows[0];

  if (!row || row.visibleAreaM2 === null) {
    return null;
  }

  const visibleBorderGeojson = parsePreviewPolygon(row.geojson);
  const visibleAreaM2 = Math.round(Number(row.visibleAreaM2));

  await db.kingdom.update({
    where: { id: kingdom.id },
    data: { visibleBorderGeojson, visibleAreaM2 },
  });

  return { kingdomId: kingdom.id, visibleAreaM2 };
}

export async function recalculateAllKingdomBorders(
  db: KingdomBorderDb & { kingdom: { findMany(args: { select: { id: true }; orderBy: { createdAt: "asc" } }): Promise<Array<{ id: string }>> } } = getPrismaClient() as never,
): Promise<KingdomBorderRecalculation[]> {
  const kingdoms = await db.kingdom.findMany({ select: { id: true }, orderBy: { createdAt: "asc" } });
  const results: KingdomBorderRecalculation[] = [];

  // Oldest kingdoms first, so earlier settlers keep their ground when borders meet.
  for (const kingdom of kingdoms) {
    const result = await recalculateKingdomBorder(kingdom.id, db);

    if (result) {
      results.push(result);
    }
  }

  return results;
}

export async function recalculateKingdomBorderForUser(userId: string): Promise<KingdomBorderRecalculation | null> {
  const kingdom = await getPrismaClient().kingdom.findUnique({ where: { userId }, select: { id: true } });

  return kingdom ? recalculateKingdomBorder(kingdom.id) : null;
}
