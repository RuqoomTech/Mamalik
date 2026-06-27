# Map Data Sources

This file tracks spatial datasets used by Mamalik v0.1 validation.

## Land Mask

Status: Sprint 4 foundation.

Current source: `MAMALIK_COARSE_V0_1`, a small checked-in coarse global land mask seeded by `npm run db:seed-land-mask`.

Sprint 4 closure decision: acceptable for the v0.1 validation foundation and Sprint 5 start, but not accurate enough for production launch precision claims.

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

Status: Sprint 4 placeholder foundation.

Current source: `MAMALIK_RESTRICTED_V0_1`, a small checked-in artificial no-start fixture set seeded by `npm run db:seed-restricted-zones`.

Sprint 4 closure decision: acceptable for proving the restricted-zone validation path and seed workflow, but not a production global restricted-zone dataset.

Storage:

- Table: `RestrictedZone`
- Geometry: `geometry(MultiPolygon, 4326)`
- Indexes: GiST on `geom`, plus source/category and enabled indexes
- Migration: `packages/db/prisma/migrations/000007_restricted_zones/migration.sql`

Current categories:

- `AIRPORT`
- `MILITARY`
- `PROTECTED_AREA`
- `ADMIN_BLOCK`
- `TEST_FIXTURE`

Operational rule:

- Production should run `npm run db:migrate:deploy` before restricted-zone validation is considered available.
- The v0.1 seed command is `npm run db:seed-restricted-zones`.
- The checked-in seed contains artificial validation fixtures only; it is not a production global no-start dataset.
- If the `RestrictedZone` table exists with zero active rows, validation treats restricted zones as clear.
- If the `RestrictedZone` table is missing, validation returns `restricted-zone-data-missing` and blocks kingdom creation.
- Validation endpoints do not fetch restricted-zone data from remote services at runtime.

Validation behavior:

- A start is rejected if the selected point is inside an enabled restricted zone.
- A start is also rejected if the generated preview polygon intersects an enabled restricted zone.
- User-facing errors stay generic. Fixture names can be exposed during v0.1 development, but future sensitive datasets should avoid detailed public disclosure.

Precision limits:

- The current dataset is intentionally tiny and artificial.
- It only verifies the storage, seed, and validation path.
- Production restricted zones require a reviewed, licensed, versioned import source before launch hardening.

## Area Type Classification

Status: Sprint 4 placeholder.

Current source: `V0_1_DEFAULT`.

Sprint 4 closure decision: area-type metadata is wired, but area-type-based buffer variation and non-`STANDARD` pricing behavior remain deferred until a real classifier and enum expansion exist.

Behavior:

- Valid starts are classified server-side as `STANDARD`.
- The validation response includes source `V0_1_DEFAULT`, confidence `LOW`, and a reason explaining that no v0.1 land-use dataset is active.
- Kingdom creation reruns validation and stores the server-side `STANDARD` value in `Kingdom.areaType`.
- Client-submitted area type values are not accepted.

Operational rule:

- No remote land-use data is fetched at runtime.
- Land purchase pricing continues to use the server-stored/default `STANDARD` area type.
- Non-standard area types require a future reviewed dataset, a schema enum migration, and balancing work before they affect pricing or dynamic buffers.

Precision limits:

- The placeholder is intentionally not realistic.
- It is only a stable API/data-model foundation for later classification.
- It must not be described as accurate urban, rural, or strategic classification.
