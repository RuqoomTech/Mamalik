import { Client } from "pg";
import { config as loadEnv } from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const LAND_MASK_SOURCE = "MAMALIK_COARSE_V0_1";

type MultiPolygonGeoJson = {
  type: "MultiPolygon";
  coordinates: number[][][][];
};

type CoarseLandMaskPolygon = {
  id: string;
  source: string;
  name: string;
  geojson: MultiPolygonGeoJson;
};

function rectangle(
  westLng: number,
  southLat: number,
  eastLng: number,
  northLat: number,
): MultiPolygonGeoJson {
  return {
    type: "MultiPolygon",
    coordinates: [
      [
        [
          [westLng, southLat],
          [eastLng, southLat],
          [eastLng, northLat],
          [westLng, northLat],
          [westLng, southLat],
        ],
      ],
    ],
  };
}

const COARSE_LAND_MASK: CoarseLandMaskPolygon[] = [
  {
    id: "landmask-africa-v0-1",
    source: LAND_MASK_SOURCE,
    name: "Africa coarse land mask",
    geojson: rectangle(-18, -35, 52, 37),
  },
  {
    id: "landmask-arabia-v0-1",
    source: LAND_MASK_SOURCE,
    name: "Arabian Peninsula coarse land mask",
    geojson: rectangle(34, 12, 60, 33),
  },
  {
    id: "landmask-europe-v0-1",
    source: LAND_MASK_SOURCE,
    name: "Europe coarse land mask",
    geojson: rectangle(-11, 35, 45, 72),
  },
  {
    id: "landmask-asia-v0-1",
    source: LAND_MASK_SOURCE,
    name: "Asia coarse land mask",
    geojson: rectangle(25, 5, 180, 81),
  },
  {
    id: "landmask-southeast-asia-v0-1",
    source: LAND_MASK_SOURCE,
    name: "Southeast Asia and Oceania coarse land mask",
    geojson: rectangle(92, -12, 154, 24),
  },
  {
    id: "landmask-north-america-v0-1",
    source: LAND_MASK_SOURCE,
    name: "North America coarse land mask",
    geojson: rectangle(-170, 7, -52, 84),
  },
  {
    id: "landmask-south-america-v0-1",
    source: LAND_MASK_SOURCE,
    name: "South America coarse land mask",
    geojson: rectangle(-82, -56, -34, 13),
  },
  {
    id: "landmask-australia-v0-1",
    source: LAND_MASK_SOURCE,
    name: "Australia coarse land mask",
    geojson: rectangle(112, -44, 154, -10),
  },
  {
    id: "landmask-greenland-v0-1",
    source: LAND_MASK_SOURCE,
    name: "Greenland coarse land mask",
    geojson: rectangle(-74, 59, -10, 84),
  },
];

function loadEnvironment(): void {
  const currentFile = fileURLToPath(import.meta.url);
  const dbPackageRoot = path.resolve(path.dirname(currentFile), "..");
  const repoRoot = path.resolve(dbPackageRoot, "../..");
  const envFiles = [
    path.join(repoRoot, "apps/web/.env.local"),
    path.join(repoRoot, "apps/web/.env"),
    path.join(dbPackageRoot, ".env"),
    path.join(repoRoot, ".env"),
  ];

  for (const envFile of envFiles) {
    loadEnv({ path: envFile, override: false, quiet: true });
  }
}

async function seedLandMask(): Promise<void> {
  loadEnvironment();

  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required to seed the land mask.");
  }

  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  try {
    for (const polygon of COARSE_LAND_MASK) {
      await client.query(
        `
          INSERT INTO "LandMaskPolygon" ("id", "source", "name", "geom")
          VALUES ($1, $2, $3, ST_SetSRID(ST_Multi(ST_GeomFromGeoJSON($4)), 4326))
          ON CONFLICT ("id") DO UPDATE
          SET
            "source" = EXCLUDED."source",
            "name" = EXCLUDED."name",
            "geom" = EXCLUDED."geom"
        `,
        [polygon.id, polygon.source, polygon.name, JSON.stringify(polygon.geojson)],
      );
    }

    console.log(
      `Seeded ${COARSE_LAND_MASK.length} coarse land-mask polygons from ${LAND_MASK_SOURCE}.`,
    );
  } finally {
    await client.end();
  }
}

seedLandMask().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
