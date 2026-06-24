import { Client } from "pg";
import { config as loadEnv } from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RESTRICTED_ZONE_SOURCE = "MAMALIK_RESTRICTED_V0_1";

type MultiPolygonGeoJson = {
  type: "MultiPolygon";
  coordinates: number[][][][];
};

type RestrictedZoneSeed = {
  id: string;
  source: string;
  code: string;
  name: string;
  category: "TEST_FIXTURE" | "ADMIN_BLOCK";
  reason: string;
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

const RESTRICTED_ZONES: RestrictedZoneSeed[] = [
  {
    id: "restricted-s4-test-riyadh-east-v0-1",
    source: RESTRICTED_ZONE_SOURCE,
    code: "S4_TEST_NO_START_RIYADH_EAST",
    name: "S4 Test No-Start Zone East of Riyadh",
    category: "TEST_FIXTURE",
    reason: "Artificial Sprint 4 fixture used to verify restricted-zone rejection.",
    geojson: rectangle(46.895, 24.945, 46.905, 24.955),
  },
  {
    id: "restricted-s4-test-admin-block-v0-1",
    source: RESTRICTED_ZONE_SOURCE,
    code: "S4_TEST_ADMIN_BLOCK",
    name: "S4 Test Administrative Block",
    category: "ADMIN_BLOCK",
    reason: "Artificial Sprint 4 fixture for generic admin no-start behavior.",
    geojson: rectangle(47.195, 24.695, 47.205, 24.705),
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

async function seedRestrictedZones(): Promise<void> {
  loadEnvironment();

  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required to seed restricted zones.");
  }

  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  try {
    for (const zone of RESTRICTED_ZONES) {
      await client.query(
        `
          INSERT INTO "RestrictedZone" (
            "id",
            "source",
            "code",
            "name",
            "category",
            "reason",
            "blockMode",
            "enabled",
            "geom"
          )
          VALUES ($1, $2, $3, $4, $5, $6, 'NO_START', true, ST_SetSRID(ST_Multi(ST_GeomFromGeoJSON($7)), 4326))
          ON CONFLICT ("id") DO UPDATE
          SET
            "source" = EXCLUDED."source",
            "code" = EXCLUDED."code",
            "name" = EXCLUDED."name",
            "category" = EXCLUDED."category",
            "reason" = EXCLUDED."reason",
            "blockMode" = EXCLUDED."blockMode",
            "enabled" = EXCLUDED."enabled",
            "geom" = EXCLUDED."geom",
            "updatedAt" = CURRENT_TIMESTAMP
        `,
        [
          zone.id,
          zone.source,
          zone.code,
          zone.name,
          zone.category,
          zone.reason,
          JSON.stringify(zone.geojson),
        ],
      );
    }

    console.log(
      `Seeded ${RESTRICTED_ZONES.length} restricted-zone fixtures from ${RESTRICTED_ZONE_SOURCE}.`,
    );
  } finally {
    await client.end();
  }
}

seedRestrictedZones().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
