# Testing Strategy

## Baseline

The `apps/web` Next.js foundation exists. Root npm scripts delegate to app-local checks in `apps/web`, DB checks in `packages/db`, and worker checks in `workers/tick-worker` through app-local TypeScript tooling.

## Expected Checks By Work Type

| Work type | Checks |
|---|---|
| Repository/docs | `rg --files`, `git diff --check` |
| Environment examples | `rg --files -g ".env.example"`, `git check-ignore -q apps/web/.env.example` should exit as not ignored, and local secret files should stay ignored |
| TypeScript app | `npm run typecheck`, `npm run lint`, `npm run build`, unit tests where available |
| Auth helpers | `npm run test`, plus route smoke checks when a database is available |
| Prisma schema | `npm run db:validate`, `npm run db:generate`, migration validation when a database is available |
| Game formulas | `npm run game:test`, `npm run game:typecheck`, deterministic unit tests for outputs and edge cases |
| API routes | unit/integration tests where practical plus manual API smoke notes |
| Map/spatial logic | unit tests for helpers, PostGIS validation, manual map smoke notes |
| Worker/tick logic | `npm run tick:test`, `npm run tick:typecheck`, manual `npm run tick:once` when a migrated PostgreSQL/PostGIS database is reachable |
| UI flows | manual smoke notes until E2E tests are introduced |

## Sprint 1 Testing Priorities

- Tooling checks after project setup: `npm run typecheck`, `npm run lint`, `npm run build`.
- Environment examples check: confirm `.env.example` exists and real `.env*` files stay ignored.
- Prisma validation after database foundation: `npm run db:validate`, `npm run db:generate`, `npm run db:typecheck`.
- Migration application after database foundation requires local PostgreSQL/PostGIS access.
- Auth helper unit tests after auth.
- Auth route smoke checks after auth when a PostgreSQL/PostGIS database is reachable.
- Temporary kingdom location validation helper tests after S1-012.
- Kingdom name validation and starter-state constant tests after S1-013.
- Kingdom creation helper tests for slug generation, protection duration, starter district total, resources, units, and package constants after S1-014/S1-015.
- Kingdom creation API integration tests require a reachable PostgreSQL/PostGIS database.
- Dashboard helper tests for free land, protection remaining time, and dashboard data shaping after S1-016.
- Admin helper tests for enum labels, district free land, report read state, and read-model shaping after S1-017.
- Dashboard/admin manual smoke checks.

## Sprint 2 Testing Priorities

- Tick key calculation and tick-log helper unit tests after S2-001/S2-002.
- Resource-generation formula tests after S2-003.
- Food consumption formula and net-Food clamping tests after S2-004.
- Resource-generation breakdown tests after S2-005 should verify population tax, population-driven Manpower, unchanged starter totals, inactive-building behavior, and breakdown-total consistency.
- Construction progress tests after S2-006 should verify active buildings do not progress, constructing/upgrading timers decrement, completed buildings activate, stale zero-tick rows normalize, and timers never go negative.
- Training progress tests after S2-007 should verify active queues decrement, active queues complete at zero, stale zero-tick queues normalize, completed/cancelled queues do not progress, unit stacks receive completed quantities, and duplicate ticks do not train units twice.
- Dashboard economy tests after S2-008 should verify per-tick estimates use formula totals, net Food and Food status are calculated correctly, active construction/training rows are shaped for display, latest TickLog rows are exposed, and report summaries remain display-only.
- Admin tick action tests after S2-009 should verify unauthenticated users and non-admin users cannot call the tick wrapper, admins can call it, duplicate tick results return `SKIPPED` cleanly, failed tick results surface worker errors, and admin TickLog rows shape correctly.
- `npm run test` now includes web tests, `npm run game:test`, and `npm run tick:test`.
- `npm run typecheck` now includes web typecheck and `npm run game:typecheck`; `npm run tick:typecheck` validates the separate worker TypeScript package.
- `npm run tick:once` is the manual smoke command for the worker, but it requires `DATABASE_URL` and the TickLog migration applied to a reachable database.
- Construction and training tests were added with the owning Sprint 2 tasks.
- Sprint 2 closure checks should include the full root test/typecheck/lint/build suite, database validation/typecheck, game and worker tests/typechecks, migration deploy verification when a live database is available, and two `npm run tick:once` runs in the same tick slot to confirm duplicate skipping.
- Browser smoke for dashboard/admin remains useful when a browser session is available, but server-side tests and live tick checks are the required baseline for Sprint 2 closure.

## Sprint 3 Testing Priorities

- Land package tests should verify all locked package sizes, keys, labels, and cooldowns.
- Land pricing tests should verify package price, kingdom size multiplier tiers, area multipliers, unknown area defaulting, invalid package rejection, and price rounding.
- Land cooldown tests should verify next available timestamps and active/expired cooldown detection.
- Land purchase validation tests should verify valid purchase, insufficient Money, active cooldown, invalid package, missing kingdom, and missing stockpile results.
- Land purchase mutation tests should verify unauthenticated access, missing kingdom, invalid package, missing stockpile, insufficient Money, active cooldown, Money changes, usable land changes, cooldown updates, report creation, and duplicate cooldown rejection paths.
- Land purchase DB smoke should use rollback-only fixtures when possible: buy `LAND_500`, buy `LAND_1000`, retry `LAND_1000`, verify Money/land/report/cooldown behavior, then roll back test data.
- Land purchase dashboard tests should verify server-side option shaping, disabled reason mapping, cooldown display helpers, and purchase result messages. Browser smoke should verify the dashboard renders all four packages and updates Money, usable land, cooldowns, and reports after purchases when a live account is available.
- District land dashboard tests should verify clamped district free land, usage percentage, overused status, kingdom-level unallocated land, per-district building counts, and dashboard data shaping. Browser smoke should verify all five starter districts render and no reassignment actions appear before S3-008.
- District unused-land allocation tests should verify unallocated land calculation, valid allocation, invalid amounts, no-unallocated state, amount exceeding unallocated land, exact allocation, overused-district allocation, authenticated server action behavior, district ownership, DB-recomputed land totals, report creation, and dashboard action result messages.
- Sprint 3 closure checks should include the full root test/typecheck/lint/build suite, database validation/typecheck, migration deploy verification against the configured database, game and worker tests/typechecks, and `git diff --check`.
- Browser smoke for land purchase and district allocation remains recommended when a browser session is available, but helper/action tests plus migration verification are the baseline for Sprint 3 closure.

## Sprint 4 Testing Priorities

- Map coordinate tests should verify latitude/longitude validation, radius approximation, visible-area tolerance classification, and fallback behavior without requiring a live database.
- Land-mask helper tests should verify land hits, water misses, missing table/data behavior, and the `ALLOW_MISSING_LAND_MASK` development fallback.
- Restricted-zone helper tests should verify missing table behavior, empty-table clear behavior, restricted hit shaping, and point/preview-polygon query result handling.
- PostGIS helper smoke should use the configured database when available to confirm generated GeoJSON, measured area near 50,000 m2, and overlap detection against existing kingdom borders.
- Overlap regression tests should verify a generated preview polygon with `overlapCount > 0` returns `too-close-to-existing-kingdom`, preserves overlap count metadata, and does not trust client-submitted geometry.
- Dynamic-spacing tests should verify the 50,000 m2 preview produces a 303m minimum spacing rule, PostGIS spacing rows map to `CLEAR` or `TOO_CLOSE`, and invalid coordinate-range errors do not trigger suggestion scans.
- Nearby-suggestion tests should verify deterministic candidate rings/bearings, the 24-candidate scan cap, the 3-suggestion return cap, recursive suggestion generation being disabled, and returned suggestions being validated through the same land/restricted/overlap/spacing pipeline.
- Area-type placeholder tests should verify shared area-type parsing/defaulting/labels, validation responses including `STANDARD` classification metadata for valid points, invalid points not claiming reliable classifier source, and kingdom creation continuing to use only server-side classification.
- Dynamic visible-border generation tests should verify corrected-radius math, bounded radius attempts, strict/loose/fallback best-result selection, validation responses including `targetAreaM2` and tolerance status, and that usable land remains independent from measured visible area.
- Map preview UI helper tests should verify validation status labels, validation reason messages, tolerance labels, area/distance/bearing formatting, and suggestion summary formatting. Browser smoke remains the strongest check for actual MapLibre layer rendering.
- Water rejection smoke should seed the land mask, validate a known land point such as Riyadh, validate an obvious ocean point such as `lat: 0`, `lng: -30`, and confirm kingdom creation rejects water server-side.
- Restricted-zone smoke should apply migration `000007_restricted_zones`, run `npm run db:seed-restricted-zones`, validate a coordinate inside the artificial fixture, confirm `restricted-zone` rejection, then re-check a known land point and an ocean point for regressions.
- Route/API smoke for `/api/kingdom/validate-location` requires a signed-in no-kingdom user because the endpoint enforces authentication and one-kingdom-per-user behavior.
- Kingdom creation smoke should confirm the server reruns PostGIS validation and stores the server-generated `visibleBorderGeojson`; client-submitted preview polygons remain untrusted.
- Water and restricted-zone checks must not be marked complete until their datasets/checks exist.

## Documentation Requirement

Every task must record:

- Commands run.
- Result of each check.
- Why any expected check could not run.
- Known issues and residual risk.
