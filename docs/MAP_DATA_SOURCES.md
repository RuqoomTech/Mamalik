# Map Data Sources

This file tracks spatial datasets used by Mamalik v0.1 validation.

## Land Mask

Status: Sprint 4 foundation.

Current source: `MAMALIK_COARSE_V0_1`, a small checked-in coarse global land mask seeded by `npm run db:seed-land-mask`.

Storage:

- Table: `LandMaskPolygon`
- Geometry: `geometry(MultiPolygon, 4326)`
- Index: GiST on `geom`
- Migration: `packages/db/prisma/migrations/000006_land_mask_polygons/migration.sql`

Precision limits:

- The v0.1 seed uses broad continent and region rectangles.
- It rejects obvious open-ocean starts, such as `lat: 0`, `lng: -30`.
- It is not coastline-accurate.
- It can allow some near-coast water inside coarse land rectangles.
- It can reject some small islands until a production land dataset is imported.

Operational rule:

- Production should run `npm run db:migrate:deploy` and then `npm run db:seed-land-mask`.
- Validation blocks kingdom creation if the land-mask table or rows are missing.
- Local development may set `ALLOW_MISSING_LAND_MASK=true` to keep map work moving before seed data is loaded.
- `ALLOW_MISSING_LAND_MASK` must remain false/empty in production.

Future production source:

- Import Natural Earth land polygons or an equivalent licensed global land mask.
- Preferred scale for v0.1 production is Natural Earth 1:50m or 1:110m unless storage/query performance allows more detail.
- Import must remain local/offline from a versioned file; validation endpoints must not fetch remote data at runtime.

## Restricted Zones

Status: not implemented.

Restricted-zone datasets and checks remain assigned to Sprint 4 follow-up work.
