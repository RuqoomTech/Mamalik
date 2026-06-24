# Session State

## Current Session

- Current date/time: 2026-06-24 23:10:25 +03:00
- Current sprint: Sprint 4 - Map Validation + Borders
- Current sprint file: `docs/sprints/SPRINT_04_MAP_VALIDATION_BORDERS.md`
- Current task: S4-002 - Water rejection foundation

## Last Completed Task

- Completed S4-002 - Water rejection foundation.
- Added a raw SQL `LandMaskPolygon` PostGIS table with `geometry(MultiPolygon, 4326)` and a GiST spatial index.
- Added `npm run db:seed-land-mask` and an idempotent seed script for a coarse checked-in `MAMALIK_COARSE_V0_1` land mask.
- Added `docs/MAP_DATA_SOURCES.md` to document map data source, storage, seed flow, precision limits, and future Natural Earth import direction.
- Added server-only land-mask validation helpers that distinguish `LAND`, `WATER`, and `DATA_MISSING`.
- Updated PostGIS location validation to reject obvious water starts before border preview generation and overlap checks.
- Updated kingdom creation to rerun the same server-side water validation and reject water or missing land-mask data before writing any kingdom records.
- Updated the create-kingdom map UI reason text for water and missing land-mask data.
- Kept gameplay usable land credit separate from visible border polygon area.
- Kept restricted-zone validation as an explicit `NOT_IMPLEMENTED` placeholder.

## Files Changed Recently

Changed for Sprint 4 S4-002:

- `AGENTS.md`
- `CHANGELOG.md`
- `apps/web/.env.example`
- `apps/web/src/app/api/kingdom/create/route.ts`
- `apps/web/src/components/map/KingdomLocationMap.tsx`
- `apps/web/src/lib/kingdom/location-validation.ts`
- `apps/web/src/lib/map/land-mask.ts`
- `apps/web/src/lib/map/land-mask.test.ts`
- `apps/web/src/lib/map/location-validation.ts`
- `apps/web/src/lib/map/location-validation.test.ts`
- `context.md`
- `docs/03_TECH_ARCHITECTURE.md`
- `docs/04_DATA_MODEL.md`
- `docs/DATABASE.md`
- `docs/DECISIONS_LOG.md`
- `docs/ENVIRONMENT.md`
- `docs/MAP_DATA_SOURCES.md`
- `docs/TESTING_STRATEGY.md`
- `docs/sprints/SPRINT_04_MAP_VALIDATION_BORDERS.md`
- `package.json`
- `packages/db/.env.example`
- `packages/db/package.json`
- `packages/db/prisma/migrations/000006_land_mask_polygons/migration.sql`
- `packages/db/src/seed-land-mask.ts`
- `tasks/backlog.md`
- `tasks/sprint_04.md`

## Commands Run

- `Get-Content AGENTS.md`
- `Get-Content context.md`
- `Get-Content session_state.md`
- `Get-Content docs/01_LOCKED_DECISIONS.md`
- `Get-Content docs/02_V0_1_SCOPE.md`
- `Get-Content docs/03_TECH_ARCHITECTURE.md`
- `Get-Content docs/04_DATA_MODEL.md`
- `Get-Content docs/sprints/SPRINT_04_MAP_VALIDATION_BORDERS.md`
- `Get-Content tasks/sprint_04.md`
- `Get-Content tasks/backlog.md`
- `Get-Content CHANGELOG.md`
- `git status --short`
- `rg -n "LandMask|validate-location|createKingdom|visibleBorderGeojson|ST_|postgis|waterCheck|restrictedZoneCheck|ALLOW_MISSING_LAND_MASK|DATABASE_URL|prisma" apps packages workers docs tasks -g '!docs/archive/**' -g '!tasks/archive/**'`
- `Get-Content packages/db/prisma/schema.prisma`
- `Get-Content apps/web/src/lib/map/postgis.ts`
- `Get-Content apps/web/src/lib/map/location-validation.ts`
- `Get-Content apps/web/src/lib/map/border-generation.ts`
- `Get-Content apps/web/src/app/api/kingdom/validate-location/route.ts`
- `Get-Content apps/web/src/app/api/kingdom/create/route.ts`
- `Get-Content apps/web/package.json`
- `Get-ChildItem -Recurse packages/db/prisma/migrations`
- `Get-Content package.json`
- `Get-Content packages/db/package.json`
- `Get-Content packages/db/tsconfig.json`
- `Get-Content apps/web/src/lib/db/client.ts`
- `Get-Content packages/db/src/client.ts`
- `Get-Content docs/ENVIRONMENT.md`
- `Get-Content docs/DATABASE.md`
- `Get-Content docs/DECISIONS_LOG.md`
- `Get-Content docs/TESTING_STRATEGY.md`
- `Get-Content apps/web/src/lib/kingdom/location-validation.ts`
- `Get-Content apps/web/.env.example`
- `Get-Content packages/db/.env.example`
- `npm run typecheck`
- `npm run test`
- `npm run lint`
- `npm run build`
- `npm run db:validate`
- `npm run db:typecheck`
- `npm run game:test`
- `npm run game:typecheck`
- `npm run tick:test`
- `npm run tick:typecheck`
- `npm run db:migrate:deploy`
- `npm run db:seed-land-mask`
- `npm exec -- tsx --eval "<direct land/water PostGIS smoke>"`
- `git diff --check`
- `git status --short`

## Test Status

- `npm run test`: initial sandbox run failed with `spawn EPERM`; rerun outside the sandbox passed with 89 web tests, 55 game tests, and 8 worker tests.
- `npm run typecheck`: passed.
- `npm run lint`: passed.
- `npm run build`: initial sandbox run compiled but failed with `spawn EPERM`; rerun outside the sandbox passed. Existing Node `module.register()` deprecation warning remains non-blocking.
- `npm run db:validate`: initial sandbox run failed because Prisma could not access/download its schema engine through the sandbox proxy; rerun outside the sandbox passed.
- `npm run db:typecheck`: passed.
- `npm run game:test`: initial sandbox run failed with `spawn EPERM`; rerun outside the sandbox passed with 55 tests.
- `npm run game:typecheck`: passed.
- `npm run tick:test`: initial sandbox run failed with `spawn EPERM`; rerun outside the sandbox passed with 8 tests.
- `npm run tick:typecheck`: passed.
- `npm run db:migrate:deploy`: initial sandbox run failed because Prisma could not access its schema engine; rerun outside the sandbox applied migration `000006_land_mask_polygons`.
- `npm run db:seed-land-mask`: initial sandbox run failed with `spawn EPERM`; rerun outside the sandbox seeded 9 coarse land-mask polygons from `MAMALIK_COARSE_V0_1`.
- `git diff --check`: passed; Git reported CRLF normalization warnings only.
- `git status --short`: shows the S4-002 code/docs changes pending commit.

## Manual PostGIS Smoke Status

- Direct helper smoke with Riyadh coordinates passed against the configured PostgreSQL/PostGIS database:
  - `valid: true`
  - `reason: null`
  - `landCheck.status: LAND`
  - `landCheck.source: MAMALIK_COARSE_V0_1`
  - `waterCheck: LAND`
  - `visibleAreaM2: 49,684`
  - `toleranceStatus: STRICT`
  - `overlap.overlaps: false`
  - `overlap.overlappingKingdomCount: 0`
- Direct helper smoke with Atlantic coordinates `lat: 0`, `lng: -30` passed:
  - `valid: false`
  - `reason: water`
  - `landCheck.status: WATER`
  - `landCheck.source: MAMALIK_COARSE_V0_1`
  - `waterCheck: WATER`
  - `visibleAreaM2: null`
  - `toleranceStatus: null`
  - `overlap: null`
- Authenticated `/api/kingdom/validate-location` route smoke and full `/create-kingdom` browser smoke were not run in this task. Direct helper smoke covered the same validation function used by the route and creation endpoint without requiring a prepared signed-in no-kingdom account.
- Direct live kingdom creation on an ocean point was not attempted because it requires an authenticated no-kingdom session. The creation endpoint now calls the same server-side validation helper and rejects `water` before writes.

## Migration Status

- Added migration `000006_land_mask_polygons`.
- Applied `000006_land_mask_polygons` to the configured database with `npm run db:migrate:deploy`.
- Seeded 9 coarse land-mask polygons with `npm run db:seed-land-mask`.

## Known Issues

- The current `MAMALIK_COARSE_V0_1` seed rejects obvious open ocean but is not coastline-accurate.
- Some near-coast water inside coarse land rectangles may be accepted until a production land-mask import is added.
- Some small islands may be rejected until a production land-mask import is added.
- Restricted-zone model/checks are not implemented yet; they remain S4-003.
- Dynamic buffer checks by area type are not implemented yet; they remain S4-005.
- Nearby valid point suggestions still need Sprint 4 follow-up work.
- Land purchases still increase gameplay usable land credit only; visible-border expansion from land purchases remains future Sprint 4+ work.
- `npm run build` passes but emits the existing Node v26.1.0 deprecation warning for `module.register()`.

## Open Questions

- None for S4-002.

## Next Recommended Task

- S4-003 - Add restricted-zone placeholder model and checks.
