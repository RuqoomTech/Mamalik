# Session State

## Current Session

- Current date/time: 2026-06-24 23:45:33 +03:00
- Current sprint: Sprint 4 - Map Validation + Borders
- Current sprint file: `docs/sprints/SPRINT_04_MAP_VALIDATION_BORDERS.md`
- Current task: S4-003 - Restricted-zone placeholder model and validation foundation

## Last Completed Task

- Completed S4-003 - Restricted-zone placeholder model and validation foundation.
- Added raw SQL `RestrictedZone` PostGIS storage with `geometry(MultiPolygon, 4326)`, enabled/source/category indexes, and a GiST spatial index.
- Added `npm run db:seed-restricted-zones` and an idempotent seed script for artificial `MAMALIK_RESTRICTED_V0_1` no-start fixtures.
- Added server-only restricted-zone validation helpers that distinguish `CLEAR`, `RESTRICTED`, and `DATA_MISSING`.
- Updated PostGIS location validation to reject restricted zones after land/water checks and preview polygon generation, before existing kingdom overlap checks.
- Updated kingdom creation to rerun the same server-side restricted-zone validation and reject restricted zones or missing restricted-zone table data before writing kingdom records.
- Updated the create-kingdom map UI reason text for restricted-zone failures.
- Kept the restricted-zone dataset placeholder-only; no final global restricted-zone dataset was added.

## Files Changed Recently

Changed for Sprint 4 S4-003:

- `CHANGELOG.md`
- `apps/web/src/app/api/kingdom/create/route.ts`
- `apps/web/src/components/map/KingdomLocationMap.tsx`
- `apps/web/src/lib/kingdom/location-validation.ts`
- `apps/web/src/lib/map/location-validation.test.ts`
- `apps/web/src/lib/map/location-validation.ts`
- `apps/web/src/lib/map/restricted-zones.test.ts`
- `apps/web/src/lib/map/restricted-zones.ts`
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
- `packages/db/package.json`
- `packages/db/prisma/migrations/000007_restricted_zones/migration.sql`
- `packages/db/src/seed-restricted-zones.ts`
- `tasks/backlog.md`
- `tasks/sprint_04.md`

## Commands Run

- `git status --short`
- `rg -n "LandMaskPolygon|validatePointAgainstLandMask|restrictedZoneCheck|LocationValidationReason|ReportType|model Kingdom|visibleBorder|LandMask" packages apps docs tasks -S`
- `Get-ChildItem packages/db/prisma/migrations`
- `Get-Content apps/web/src/lib/map/location-validation.ts`
- `Get-Content apps/web/src/lib/kingdom/location-validation.ts`
- `Get-Content apps/web/src/lib/map/land-mask.ts`
- `Get-Content packages/db/src/seed-land-mask.ts`
- `Get-Content package.json`
- `Get-Content packages/db/package.json`
- `Get-Content apps/web/src/lib/map/location-validation.test.ts`
- `Get-Content apps/web/src/app/api/kingdom/create/route.ts`
- `Get-Content apps/web/src/components/map/KingdomLocationMap.tsx`
- `Get-Content apps/web/src/app/api/kingdom/validate-location/route.ts`
- `New-Item -ItemType Directory -Force packages/db/prisma/migrations/000007_restricted_zones`
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
- `npm run db:seed-restricted-zones`
- `npm exec -- tsx tmp-s4-003-smoke.ts`
- `Get-Date -Format "yyyy-MM-dd HH:mm:ss zzz"`

## Test Status

- `npm run typecheck`: passed.
- `npm run test`: initial sandbox run failed with `spawn EPERM`; rerun outside the sandbox passed with 96 web tests, 55 game tests, and 8 worker tests.
- `npm run lint`: passed.
- `npm run build`: initial sandbox run compiled but failed with `spawn EPERM`; rerun outside the sandbox passed. Existing Node `module.register()` deprecation warning remains non-blocking.
- `npm run db:validate`: initial sandbox run failed because Prisma could not access/download its schema engine through the sandbox proxy; rerun outside the sandbox passed.
- `npm run db:typecheck`: passed.
- `npm run game:test`: passed with 55 tests.
- `npm run game:typecheck`: passed.
- `npm run tick:test`: passed with 8 tests.
- `npm run tick:typecheck`: passed.
- `npm run db:migrate:deploy`: applied migration `000007_restricted_zones` to the configured database.
- `npm run db:seed-restricted-zones`: seeded 2 artificial restricted-zone fixtures from `MAMALIK_RESTRICTED_V0_1`.

## Manual Restricted-Zone Smoke Status

- Direct helper smoke with Riyadh coordinates passed against the configured PostgreSQL/PostGIS database:
  - `valid: true`
  - `reason: null`
  - `landCheck.status: LAND`
  - `restrictedZoneCheck.status: CLEAR`
  - `visibleAreaM2: 49,684`
  - `toleranceStatus: STRICT`
  - `overlap.overlaps: false`
- Direct helper smoke with restricted fixture coordinates `lat: 24.95`, `lng: 46.9` passed:
  - `valid: false`
  - `reason: restricted-zone`
  - `landCheck.status: LAND`
  - `restrictedZoneCheck.status: RESTRICTED`
  - `zones: S4_TEST_NO_START_RIYADH_EAST`
  - `overlap: null`
- Direct helper smoke with Atlantic coordinates `lat: 0`, `lng: -30` passed:
  - `valid: false`
  - `reason: water`
  - `landCheck.status: WATER`
  - `restrictedZoneCheck.status: NOT_IMPLEMENTED`
  - `overlap: null`
- Direct helper smoke with an existing kingdom center passed:
  - `valid: false`
  - `reason: too-close-to-existing-kingdom`
  - `landCheck.status: LAND`
  - `restrictedZoneCheck.status: CLEAR`
  - `overlap.overlaps: true`
- Authenticated `/api/kingdom/validate-location` route smoke and full `/create-kingdom` browser smoke were not run in this task. Direct helper smoke covered the same validation function used by the route and creation endpoint without requiring a prepared signed-in no-kingdom account.

## Migration Status

- Added migration `000007_restricted_zones`.
- Applied `000007_restricted_zones` to the configured database with `npm run db:migrate:deploy`.
- Seeded 2 artificial restricted-zone fixtures with `npm run db:seed-restricted-zones`.

## Known Issues

- The current restricted-zone seed is artificial and only validates the no-start-zone foundation.
- Production-grade global restricted-zone data remains deferred.
- Future sensitive restricted-zone datasets should keep public rejection messages generic.
- The current `MAMALIK_COARSE_V0_1` land mask rejects obvious open ocean but is not coastline-accurate.
- Dynamic buffer checks by area type are not implemented yet; they remain S4-005.
- Nearby valid point suggestions still need Sprint 4 follow-up work.
- Land purchases still increase gameplay usable land credit only; visible-border expansion from land purchases remains future Sprint 4+ work.
- `npm run build` passes but emits the existing Node v26.1.0 deprecation warning for `module.register()`.

## Open Questions

- None for S4-003.

## Next Recommended Task

- S4-004 - Implement overlap checks and reconcile the task tracker with the overlap foundation already introduced in S4-001.
