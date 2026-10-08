import type { Polygon } from "geojson";
import type { WorldKingdom } from "@/components/map/WorldMap";
import { getPrismaClient } from "@/lib/db/client";

export const WORLD_KINGDOM_LIMIT = 2_000;

function toPolygon(value: unknown): Polygon | null {
  const candidate = typeof value === "string" ? (JSON.parse(value) as unknown) : value;

  if (
    candidate &&
    typeof candidate === "object" &&
    (candidate as { type?: unknown }).type === "Polygon" &&
    Array.isArray((candidate as { coordinates?: unknown }).coordinates)
  ) {
    return candidate as Polygon;
  }

  return null;
}

// Public world view: every kingdom's name, location, land, and border. No owner details.
export async function getWorldKingdoms(ownKingdomId: string | null): Promise<WorldKingdom[]> {
  const kingdoms = await getPrismaClient().kingdom.findMany({
    orderBy: { usableLandM2: "desc" },
    take: WORLD_KINGDOM_LIMIT,
    select: {
      id: true,
      name: true,
      centerLat: true,
      centerLng: true,
      usableLandM2: true,
      visibleBorderGeojson: true,
    },
  });

  return kingdoms.map((kingdom) => ({
    id: kingdom.id,
    name: kingdom.name,
    centerLat: kingdom.centerLat,
    centerLng: kingdom.centerLng,
    usableLandM2: kingdom.usableLandM2,
    border: toPolygon(kingdom.visibleBorderGeojson),
    isOwn: kingdom.id === ownKingdomId,
  }));
}
