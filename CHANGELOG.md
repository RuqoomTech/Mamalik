# Changelog

All notable Mamalik project changes are recorded here.

## 2026-10-01 - S5-005 Attack Order Validation

### Added

- Added `packages/game/src/movement/target-eligibility.ts` with `validateMovementTarget`, `isKingdomUnderBeginnerProtection`, and the `MovementTargetFailureReason` union (`INVALID_TARGET`, `SELF_TARGET`, `TARGET_NOT_FOUND`, `TARGET_PROTECTED`). These are the four target rules S5-003 inlined in the scout validator, now shared by both order types so SCOUT and ATTACK cannot drift apart. Exported from `packages/game/src/index.ts`.
- Added `packages/game/src/movement/attack-order-validation.ts` with `validateAttackOrder`, the single source of truth for "may this kingdom send this army against that target right now", plus the `AttackArmyEntry` and `AttackOrderValidationFailureReason` types. It returns the normalized manifest, total units, slowest unit type, distance, travel ticks, and arrival.
- Added `apps/web/src/lib/kingdom/attack-orders.ts` with `createAttackOrderForUser` and `getCreateAttackOrderResultMessage`, the server-side attack dispatch mutation.
- Added `apps/web/src/lib/kingdom/attack-target-options.ts` with `getAttackTargetOptionsForUser` and `getAttackArmyStacksForUser`, the bounded attack target and unit-picker read models.
- Added `apps/web/src/components/kingdom/AttackOrderPanel.tsx`, the `/army` attack UI.
- Added 74 tests: 30 in `attack-order-validation.test.ts` (123 -> 153 game tests), 24 in `attack-orders.test.ts`, and 20 in `attack-target-options.test.ts` (157 -> 201 web tests).

### Changed

- `packages/game/src/movement/scout-order-validation.ts` now DELEGATES its four target-eligibility rules to the shared `validateMovementTarget` instead of implementing them inline. It keeps its exact six-string failure union and its exact return values, and re-exports `isKingdomUnderBeginnerProtection` for backwards compatibility. The implementation of that helper MOVED into `target-eligibility.ts`, because the first pass had the shared module import it back from the scout validator — a circular dependency between a shared base and one of its consumers that happened to work only because the call occurred at call time rather than module-evaluation time. The dependency is now one-way and nothing imports the scout module except its test. The 25 pre-existing scout validator tests were NOT modified and still pass, which is what evidences the refactor was behaviour-preserving.
- `apps/web/src/app/dashboard/actions.ts` gained `AttackOrderActionState`, `createAttackOrderAction`, and `createAttackOrderFormAction` (additive only).
- `apps/web/src/app/army/page.tsx` now renders `AttackOrderPanel` alongside the existing scout surface.
- A dispatched attack writes a `MovementOrder` row with `orderType: "ATTACK"`, `status: "IN_TRANSIT"`, and a MIXED normalized manifest in `unitsJson`, in contrast to the scouts-only scout manifest. `returnAt`, `parentOrderId`, `resolvedAt`, and `cancelledAt` are null, as for a scout dispatch. **A dispatched attack has NO EFFECT: it sits in transit.**
- The `/army` attack panel copy now states plainly that a dispatched attack has no effect, with a "Dispatch only, no battle yet" badge and a standing notice that no battle is fought, no casualties dealt, no land taken, and no battle report written.

### Checks

- `apps\web` `tsc --noEmit`: passed (exit 0). `apps\web` `eslint`: passed (exit 0).
- `npm --prefix apps/web run test`: 201/201 passed (was 157/157; 44 new).
- `npm run game:test`: 153/153 passed (was 123/123; 30 new).
- `npm run tick:test`: 23/23 passed (unchanged; S5-005 adds no worker code).
- `npm run game:typecheck`: passed. `npm run tick:typecheck`: passed.
- `npm run db:validate`: passed. S5-005 adds no migration.
- `next build` was NOT run for S5-005, unlike S5-003 and S5-004. The web typecheck and lint above are the evidence recorded, and that gap is stated rather than implied as checked.

### Known issues

- A DISPATCHED ATTACK HAS NO EFFECT. The order is written and the units are reserved, but nothing happens at the target: no battle is fought, no casualties are dealt, no land is captured, and no battle report is written. The tick worker has no `ATTACK` arrival branch, no return leg is created, and the reserved units stay decremented for the life of the order. Battle resolution is S5-006, defender bonuses S5-007, siege S5-008, war land capture S5-009, and the battle report S5-010. This is the single most important scope fact about this release.
- NO live database smoke and NO browser smoke was performed. `npm run db:validate` ran without applying any migration, and migration `000008_movement_orders` still has NEVER been applied to a real PostgreSQL/PostGIS database. The entire attack dispatch path — the mixed-army reservation, the all-or-nothing rollback, the conditional decrement against real rows, and the `ATTACK` order insert — is verified only against a hand-rolled fake client.
- The repo has NO component test runner, so `AttackOrderPanel` is manual smoke only and has zero automated UI coverage. It was never rendered or clicked.
- The alliance rule "alliance members cannot attack each other" remains UNENFORCEABLE and is a LIVE LOCKED-RULE GAP that S5-005 does not close: Sprint 6 still has no `Alliance` schema, so there is nothing authoritative to check against.
- No minimum and no maximum attack army size is enforced. One unit is a legal attack; an upper or lower bound is a balance decision and is deliberately deferred, the same status as `SCOUT_ORDER_MAX_SCOUTS`.
- The client-side convention of submitting a fully empty manifest so the server rejects it with `INVALID_ARMY` is not covered by any test, because it lives in the form action's plumbing rather than in the validator.
- `ARRIVED`, `RETURNING`, and `CANCELLED` `MovementOrder` statuses remain unused, and no `Battle` or `WarLandCapture` model exists.
- All scout band thresholds and `MOVEMENT_BASE_METERS_PER_TICK` remain unretuned v0.1 balance placeholders.

## 2026-10-01 - S5-004 Approximate Scout Reports

### Added

- Added `packages/game/src/movement/scout-report.ts` with `approximateScoutObservation`, `buildScoutReportBody`, `SCOUT_BAND_LABELS`, the band unions, and the band threshold constants, completing S5-004. Exported from `packages/game/src/index.ts`.
- Added `workers/tick-worker/src/movement-arrival.ts` with `processMovementArrivals`, the tick worker's movement arrival resolution pass.
- Added `apps/web/src/lib/kingdom/scout-report-display.ts` with the null-safe `parseScoutReportBody` reader, `getScoutReportBandRows`, `formatScoutLandBand`, and `formatScoutReportSummary`.
- Added scout report rendering to `ReportsPanel` in `apps/web/src/components/kingdom/KingdomPagePanels.tsx`, and a parsed `scoutBody` to the report rows in `apps/web/src/lib/kingdom/dashboard-data.ts`.
- Added 46 tests: 20 in `scout-report.test.ts` (103 -> 123 game tests), 15 in `movement-arrival.test.ts` (8 -> 23 tick tests), and 11 in `scout-report-display.test.ts` (146 -> 157 web tests).

### Changed

- `runOneTick` now calls `processMovementArrivals(tx, { now, tickKey })` inside the existing `prisma.$transaction` (30-second timeout), at the START of the transaction before the per-kingdom loop. The pass runs two ordered phases: RETURN legs complete first (garrison credited back, order `COMPLETED` with `returnAt`), then arriving SCOUT orders resolve (SCOUT `Report` on the source kingdom, outbound order `RESOLVED` with `resolvedAt`, `RETURN` leg created). The return leg reuses the outbound order's `travelTicks` rather than recomputing it.
- `workers/tick-worker/src/tick-log.ts` gained the `MovementArrivalSummary` field on the tick result plus the arrival counters and per-order warnings in the printed tick output.
- Rewrote the `/army` and `/reports` copy to state honestly that a scout report is produced when the tick worker processes the arrival, that it appears on the NEXT TICK and is not immediate, that it shows coarse bands only and never exact enemy figures, and that combat and battle reports are still upcoming.
- `resolvedAt`, `returnAt`, and `parentOrderId` are now actually written on `MovementOrder`; they were previously documented as null-at-creation.

### Checks

- `apps\web` `tsc --noEmit`: passed (exit 0). `apps\web` `eslint`: passed (exit 0). `apps\web` `next build`: passed (exit 0).
- `npm --prefix apps/web run test`: 157/157 passed (was 146/146; 11 new).
- `npm run game:test`: 123/123 passed (was 103/103; 20 new).
- `npm run tick:test`: 23/23 passed (was 8/8; 15 new).
- `npm run game:typecheck`: passed. `npm run tick:typecheck`: passed.
- `npm run db:validate`: passed. The schema is unchanged by S5-004, so no new migration was added.

### Known issues

- NO live database smoke and NO browser smoke was performed. `npm run db:validate` ran with a dummy `DATABASE_URL`, and migration `000008_movement_orders` still has NEVER been applied to a real PostgreSQL/PostGIS database. The entire arrival path is therefore unverified against real rows and is covered only by unit tests against a hand-rolled fake transaction client.
- The repo has NO component test runner, so the `ReportsPanel` scout report rendering is manual smoke only and has zero automated UI coverage. It was never rendered or clicked.
- All scout band thresholds (army 50/200, food 1,000/5,000, wall levels 1/3, defence score 6/16, land 10,000 m2 step) and `MOVEMENT_BASE_METERS_PER_TICK` remain unretuned v0.1 balance placeholders and need real playtest data.
- Attack orders, the battle formula, defender bonuses, the siege requirement, war land capture, and battle reports DO NOT EXIST yet (S5-005 through S5-010). No `Battle` or `WarLandCapture` model exists.
- No alliance check exists, because Sprint 6 still has no `Alliance` schema to check against.
- `ARRIVED`, `RETURNING`, and `CANCELLED` `MovementOrder` statuses remain unused.
- `prisma migrate diff` still emits no SQL in this toolchain; migrations remain hand-written from the validated schema.
- S5-004 is on branch `sprint-5-movement-scouting` and is not yet committed. The branch carries two prior commits: `5e7093b` (S5-001/S5-002) and `55754a1` (S5-003).

## 2026-10-01 - S5-003 Scout Order Validation

### Added

- Added `packages/game/src/movement/scout-order-validation.ts` with `validateScoutOrder`, `isKingdomUnderBeginnerProtection`, `SCOUT_ORDER_MIN_SCOUTS`, and `SCOUT_ORDER_UNIT_TYPE`, completing S5-003.
- Exported `movement/scout-order-validation` from `packages/game/src/index.ts`.
- Added `apps/web/src/lib/kingdom/scout-orders.ts` with the server-side `createScoutOrderForUser` mutation and `getCreateScoutOrderResultMessage`.
- Added `apps/web/src/lib/kingdom/scout-target-options.ts` with the bounded `getScoutTargetOptionsForUser` read model and `SCOUT_TARGET_OPTION_LIMIT`.
- Added `ScoutOrderActionState`, `createScoutOrderAction`, and `createScoutOrderFormAction` to `apps/web/src/app/dashboard/actions.ts`.
- Added `apps/web/src/components/kingdom/ScoutOrderPanel.tsx` and rendered it on the `/army` page.
- Added 51 tests: 25 in `scout-order-validation.test.ts` (78 -> 103 game tests) and 26 in `apps/web` (`scout-orders.test.ts` 15, `scout-target-options.test.ts` 11; web tests 120 -> 146).

### Changed

- Rewrote the `/army` page intro paragraph to state honestly that scout orders are recorded on dispatch and that nothing resolves on arrival yet.
- `/army` now also resolves `getCurrentUser()` because the scout target read model is keyed by user id, which `getKingdomPageData()` does not expose.

### Checks

- `apps\web` `tsc --noEmit`: passed. `apps\web` `eslint`: passed. `apps\web` `next build`: passed.
- `npm --prefix apps/web run test`: 146/146 passed (was 120/120).
- `npm run game:test`: 103/103 passed (was 78/78).
- `npm run game:typecheck`: passed. `npm run tick:test`: 8/8 passed, unchanged.
- `npm run db:validate`: passed. The schema is unchanged by S5-003, so no new migration was added.

### Known issues

- Dispatched scout orders do not resolve. They stay `IN_TRANSIT` with no report, no return leg, no status transition, no return of the reserved scouts, and no tick-worker movement processing. Arrival handling and the approximate scout report are S5-004.
- The new `ScoutOrderPanel` has zero automated UI coverage. The repo has no component test runner, so its verification is manual smoke only, and no browser smoke was performed.
- No live database smoke was performed. `npm run db:validate` ran with a dummy `DATABASE_URL`, and migration `000008_movement_orders` still has never been applied to a real PostgreSQL/PostGIS database, so end-to-end dispatch remains unverified against real rows.
- No alliance check is implemented, because Sprint 6 still has no `Alliance` schema to check against.
- No `SCOUT_ORDER_MAX_SCOUTS` cap exists; only the correctness floor is enforced. An upper bound is a balance decision and is deferred.
- `prisma migrate diff` still emits no SQL in this toolchain, and `MOVEMENT_BASE_METERS_PER_TICK` remains a v0.1 balance placeholder.

## 2026-10-01

### Added

- Added the Sprint 5 `MovementOrder` Prisma model with `MovementOrderType` (`SCOUT`, `ATTACK`, `RETURN`) and `MovementOrderStatus` (`IN_TRANSIT`, `ARRIVED`, `RESOLVED`, `RETURNING`, `COMPLETED`, `CANCELLED`) enums, completing S5-001.
- Added migration `000008_movement_orders` with the `MovementOrder` table, per-kingdom order indexes, a pending-arrival `status` + `arrivalAt` index, and a unique `parentOrderId` self-relation for return legs.
- Added `Kingdom.outgoingMovementOrders` and `Kingdom.incomingMovementOrders` relations.
- Added `packages/game/src/map/distance.ts` with shared `calculateGreatCircleDistanceMeters` great-circle math.
- Added `packages/game/src/movement/travel-time.ts` with order/unit type guards, `calculateMovementDistanceMeters`, `getMovementSpeedMetersPerTick`, `calculateTravelTime`, and `getMovementArrivalAt` / `getMovementReturnAt`, completing S5-002.
- Added 19 tests covering great-circle distance and travel-time behavior.

### Changed

- Pointed `apps/web/src/lib/kingdom/location-validation.ts` `calculateDistanceMeters` at the shared `calculateGreatCircleDistanceMeters` helper, removing the duplicated haversine implementation.

### Checks

- `npm run db:validate`: passed. `npm run db:generate`: passed.
- `npm run db:typecheck`, `npm run game:typecheck`: passed.
- `npm --prefix apps/web run typecheck`: passed. `npm --prefix apps/web run lint`: passed. `npm run build`: passed.
- `npm run game:test`: 78/78 passed (was 59/59).
- `npm --prefix apps/web run test`: 120/120 passed, unchanged by the distance de-duplication.
- `npm run tick:test`: 8/8 passed.

### Known issues

- `prisma migrate diff` again emitted no SQL in this toolchain, so `000008_movement_orders` was hand-written from the validated Prisma schema, consistent with `000002`.
- Migration `000008_movement_orders` has not been applied to a real database; applying it and smoke-testing a movement order row still needs a reachable PostgreSQL/PostGIS instance.
- No order creation API, unit reservation, arrival resolution, battle formula, or tick-worker movement processing exists yet; those belong to S5-003 through S5-010.
- `MOVEMENT_BASE_METERS_PER_TICK` is a v0.1 balance placeholder and needs retuning against real playtest data.

## 2026-09-29

### Fixed

- Clamped kingdom and admin free-land display at zero so overused land no longer shows negative values.
- Forced `ALLOW_MISSING_LAND_MASK` fail-closed in production; the bypass works only outside production.
- Blocked email/password registration for `ADMIN_EMAILS` allowlisted addresses to prevent admin pre-registration takeover.
- Enforced kingdom ownership in `getKingdomDashboardData` via optional `expectedUserId` and updated kingdom page data to pass the signed-in user id.
- Pinned map area/number formatting to `en-US` so `formatSquareMeters` and confirmation numbers are deterministic across system locales.
- Hardened session verification to reject unknown roles, future `issuedAt` beyond 5-minute skew, and malformed expiry windows.

### Checks

- `npm install --prefix apps/web` and `--prefix packages/db`: passed.
- `npm --prefix apps/web run typecheck`: passed.
- `npm --prefix apps/web run lint`: passed.
- `npm --prefix apps/web run test`: 120/120 passed after locale pin (was 118/119 with Arabic-locale digit failure).
- `npm run game:test`: 59/59 passed. `npm run tick:test`: 8/8 passed.
- `npm run db:validate`, `game:typecheck`, `tick:typecheck`: passed with dummy `DATABASE_URL` for Prisma generate/validate.

### Known issues

- Tick recovery (STARTED lease/retry, per-kingdom isolation), login rate-limiting, session revocation, Google OAuth PKCE/ID-token validation, polygon water checks, and visible-border expansion remain deferred foundation hardening.
- Live DB smoke still requires reachable PostgreSQL/PostGIS; Prisma generate/validate used a dummy URL only.

## 2026-06-29

### Changed

- Tightened the public landing page to more closely match the supplied reference proportions, including the centered parchment frame, shorter hero, lower feature-card band, compact trust strip, and aligned footer.
- Replaced placeholder-style landing and footer symbols with inline SVG icon treatments and arrow controls.
- Removed the duplicate rendered kingdom stat overlay because the supplied hero art already contains the reference stat card.

### Known issues

- Browser screenshot capture through the requested Browser plugin was not available in this tool session; local `/` returned HTTP 200 and automated typecheck/lint/build checks passed.

## 2026-06-28

### Added

- Added a shared public marketing shell for the Mamalik landing page and public information pages.
- Added public pages for `/features`, `/about`, `/how-to-play`, `/roadmap`, `/updates`, `/careers`, and `/contact`.
- Added the supplied kingdom world reference image as the local landing hero asset.

### Changed

- Rebuilt the public landing page with the reference-inspired kingdom hero, green/gold action buttons, feature cards, trust strip, and footer navigation.
- Kept landing-page copy aligned with current v0.1 status so future Sprint 5 and Sprint 6 systems are presented as roadmap work, not completed gameplay.

## 2026-06-27

### Added

- Added an authenticated kingdom app shell with section navigation for overview, world, economy, land, buildings, army, and reports.
- Added focused kingdom pages at `/world`, `/economy`, `/land`, `/buildings`, `/army`, and `/reports`.
- Added a read-only MapLibre kingdom border preview component that renders stored `Kingdom.visibleBorderGeojson` on dashboard/world surfaces.
- Added `docs/sprints/SPRINT_04_REVIEW.md` with Sprint 4 closure status, acceptance criteria, PostGIS smoke results, browser smoke status, map dataset status, migration/seed status, deferred items, and Sprint 5 readiness.

### Changed

- Changed `/dashboard` from an all-in-one data page into a command overview with resource, map, queue, land, economy, and report summaries linking to focused pages.
- Reused shared kingdom display panels across focused pages so economy, land, building, army, tick, and report views still use server-shaped data.
- Extended dashboard read-model data to expose stored visible border GeoJSON and server-side area type for authenticated map/detail pages.
- Revalidated focused land/economy/report routes after existing land purchase and district allocation actions.
- Improved the authenticated kingdom section navigation so it wraps cleanly on narrower viewports instead of showing a horizontal scrollbar.
- Marked S4-010 complete in active Sprint 4 docs and task trackers.
- Closed Sprint 4 from the documentation and task-tracking standpoint and marked it ready for Sprint 5.

### Deferred

- New gameplay actions, start-construction UI, start-training UI, scouting, combat, alliances, rankings, and visible-border expansion after purchases remain in their existing v0.1 owning tasks.
- Area-type buffer variation remains deferred until non-`STANDARD` area classification exists.
- Production-grade land-mask/restricted-zone datasets and cadastral parcel-like border generation remain deferred map-hardening work.

## 2026-06-26

### Added

- Added bounded dynamic visible-border generation attempts for Sprint 4 location validation.
- Added helper and PostGIS tests for corrected-radius math, bounded radius attempts, and strict/loose/fallback preview selection.
- Added `targetAreaM2` and bounded attempt count metadata to location-validation responses that include a generated preview.
- Added shared map-preview UI helpers and tests for validation states, validation reasons, tolerance labels, and suggestion summaries.

### Changed

- Updated PostGIS preview generation to try the initial circular radius, a measured-area correction, and deterministic radius adjustment factors before choosing the best server-generated polygon.
- Updated create-kingdom validation UI copy to show player-facing border tolerance labels: Excellent fit, Acceptable fit, and Approximate border.
- Marked S4-007 complete in the Sprint 4 docs and task trackers.
- Updated the create-kingdom map to render validated server-generated preview polygons, clear stale polygons on selection/validation changes, and rerun validation when a suggested location is selected.
- Updated the create-kingdom status, invalid-reason, suggestion, and confirmation panels to show visible area, target area, tolerance, area type, and clear user-facing state.
- Marked S4-009 complete in the Sprint 4 docs and task trackers.

### Deferred

- Visible-border expansion after land purchases remains deferred to later Sprint 4 work.
- Real cadastral parcel shapes and production-grade parcel-style borders remain deferred beyond this v0.1 foundation.
- Area-type-based dynamic buffer variation remains deferred until non-`STANDARD` classification is introduced.

## 2026-06-25

### Added

- Added shared `packages/game` area-type helpers for supported area type values, defaulting, parsing, and display labels.
- Added a server-side Sprint 4 area-type classification placeholder that classifies valid starts as `STANDARD` with `V0_1_DEFAULT` source and low confidence.
- Added area-type classification metadata to valid location-validation responses and displayed the area type on the create-kingdom validation and confirmation panels.
- Added focused area-type helper and classifier tests.
- Added a focused overlap regression test proving generated preview polygons with existing-border overlap return `too-close-to-existing-kingdom` and preserve overlap count metadata.
- Added a server-only dynamic spacing helper using a v0.1 `max(300, ceil(previewRadiusM * 2 + 50))` minimum-distance rule.
- Added PostGIS `ST_DWithin` center-distance checks after direct visible-border overlap validation.
- Added capped server-generated nearby valid suggestions for water, restricted-zone, overlap, and spacing failures.
- Added dynamic-spacing and suggestion tests for radius-based minimum spacing, candidate rings/bearings, suggestion caps, spacing result mapping, and non-recursive validation.

### Changed

- Updated kingdom creation to store the server-side area type classification in the existing `Kingdom.areaType` field while continuing to reject client-provided area-type values.
- Marked S4-006 complete in Sprint 4 docs and task trackers.
- Marked S4-004 complete as overlap validation reconciliation because S4-001 already implemented direct visible-border overlap checks and S4-003 live smoke verified the behavior.
- Documented that direct no-overlap validation uses `ST_Intersects` against stored `Kingdom.visibleBorderGeojson`, while dynamic buffer spacing remains S4-005.
- Updated `/api/kingdom/validate-location` to return up to 3 server-validated nearby suggestions when invalid selections can be repaired nearby.
- Updated the create-kingdom map UI to show suggestion distance, bearing, border tolerance, and visible area when available.
- Marked S4-005 complete and marked nearby valid point suggestions complete because the S4-005 task bundled the basic server-generated suggestion flow.

### Deferred

- Non-standard area type datasets, non-`STANDARD` persistence, area-type bonuses, and area-type-based dynamic buffer variation remain deferred until a real classifier is introduced.
- Area-type buffer classification, visible-border expansion after land purchase, and map preview polish remain pending Sprint 4 follow-up work.

## 2026-06-24

### Added

- Added a raw SQL `RestrictedZone` PostGIS table migration with `geometry(MultiPolygon, 4326)`, enabled/source/category indexes, and a GiST spatial index for Sprint 4 restricted-zone validation.
- Added an artificial `MAMALIK_RESTRICTED_V0_1` restricted-zone seed script and root `npm run db:seed-restricted-zones` command.
- Added restricted-zone validation helpers and tests for missing table, empty table, restricted hits, and point/preview-polygon query behavior.
- Added composed location-validation tests for restricted-zone rejection and missing restricted-zone table behavior.
- Added a raw SQL `LandMaskPolygon` PostGIS table migration with `geometry(MultiPolygon, 4326)` and a GiST spatial index for Sprint 4 water rejection.
- Added a coarse `MAMALIK_COARSE_V0_1` land-mask seed script and root `npm run db:seed-land-mask` command.
- Added `docs/MAP_DATA_SOURCES.md` documenting land-mask source, storage, precision limits, seed flow, and future Natural Earth import direction.
- Added land-mask validation helpers and tests for land hits, water misses, missing data, and local missing-data fallback parsing.
- Added composed location-validation tests for land, water, and missing land-mask data behavior.
- Added Sprint 4 PostGIS map-validation foundation helpers for coordinate validation, circular border radius calculation, tolerance classification, preview polygon generation, area measurement, and overlap checks.
- Added server-side Sprint 4 validation composition for PostGIS-generated border previews with explicit water/restricted-zone placeholder statuses.
- Added focused map helper tests for coordinate validation, 50,000 m2 radius approximation, and tolerance classification.
- Added `docs/sprints/SPRINT_03_REVIEW.md` with Sprint 3 closure status, acceptance criteria, checks, deferred items, migration status, and Sprint 4 readiness.
- Added a dashboard `Buy land` panel that displays all four locked land packages with server-computed price, cooldown, affordability, availability, disabled reason, and purchase action state.
- Added land purchase display helpers for cooldown duration, remaining cooldown, disabled reason labels, and user-facing action result messages.
- Added dashboard read-model support for server-computed land purchase options.
- Added focused tests for dashboard land purchase option shaping and land purchase display helpers.
- Added a read-only dashboard `District land` section with kingdom-level usable, allocated, used, free, and unallocated land totals.
- Added per-district dashboard rows for allocated land, used land, free land, usage percentage, building count, and land status.
- Added focused dashboard read-model tests for district free land clamping, usage percentage, overused status, unallocated land totals, and building counts.
- Added shared district unused-land allocation validation helpers in `packages/game`.
- Added an authenticated dashboard Server Action for assigning unallocated usable land into an existing district.
- Added a dashboard `Allocate unused land` form that submits only district id and amount.
- Added `DISTRICT_ALLOCATION` reports and migration `000005_district_allocation_report_type`.
- Added focused tests for allocation validation, server-side DB recomputation, district ownership, report creation, and dashboard result messages.

### Changed

- Marked S4-003 complete in the active Sprint 4 docs and task trackers.
- Updated `/api/kingdom/validate-location` to reject configured restricted no-start zones after preview polygon generation and before existing kingdom overlap checks.
- Updated `POST /api/kingdom/create` to reject restricted zones and missing restricted-zone validation data when rerunning server-side validation.
- Updated the create-kingdom map UI to show restricted-zone validation reasons.
- Documented the placeholder restricted-zone source, seed flow, validation order, and sensitive-details display policy.
- Marked S4-002 complete in the active Sprint 4 docs and task trackers.
- Updated `/api/kingdom/validate-location` to reject obvious water starts before border preview generation.
- Updated `POST /api/kingdom/create` to reject water and missing land-mask data when rerunning server-side validation.
- Updated the create-kingdom map UI to show water and missing-land-mask validation reasons.
- Documented `ALLOW_MISSING_LAND_MASK` as a local-development-only fallback; production should leave it false/empty.
- Started Sprint 4 and marked S4-001 complete in the active Sprint 4 docs and task trackers.
- Moved the canonical Sprint 4 doc to `docs/sprints/SPRINT_04_MAP_VALIDATION_BORDERS.md` to match the active task naming.
- Updated `/api/kingdom/validate-location` to use PostGIS-backed border preview generation and overlap checks.
- Updated `POST /api/kingdom/create` to rerun the same server-side PostGIS validation and store the server-generated preview polygon and measured visible area.
- Updated the kingdom creation map UI wording to remove stale Sprint 1 stub language and display border tolerance status.
- Refined `AGENTS.md` into a repository contributor guide with project structure, commands, style, testing, documentation workflow, commit/PR guidance, security notes, and anti-drift rules.
- Preserved the mandatory Mamalik v0.1 preflight, canonical documentation sources, documentation update loop, and no-v0.2 scope guard.
- Marked S3-006 complete in the active Sprint 3 docs and task trackers.
- Marked S3-007 complete in the active Sprint 3 docs and task trackers.
- Marked S3-008 complete in the active Sprint 3 docs and task trackers.
- Updated the dashboard status note so land buying is no longer listed as future work.
- Documented `District.usedLandM2` as the dashboard source for district used/free land, with buildings used only for counts and detail display.
- Documented Sprint 3 district management as allocation-only: unallocated usable land can be added to districts, but allocated land is not moved out of districts.
- Closed Sprint 3 from the documentation and task-tracking standpoint after confirming land purchase, reports, dashboard land display, and unused-land allocation scope.
- Documented that reports are sufficient v0.1 land-change history and that a dedicated land purchase history table remains deferred.
- Documented Sprint 3 transaction-local rechecks and conditional updates as the v0.1 land mutation concurrency baseline.

### Deferred

- Production-grade global restricted-zone datasets remain deferred; the current seed is artificial and only validates the no-start-zone foundation.
- Coastline-accurate production land-mask import remains deferred; the current seed is coarse and intended as a foundation.
- Full coastline-accurate water rejection remains deferred until a production land-mask dataset is imported.
- Dynamic area-type buffers, nearby suggestions, and land-purchase visible-border expansion remain pending Sprint 4+ work.
- Moving allocated land out of a district or between districts remains deferred.
- Real visible-border expansion and polygon recalculation remain Sprint 4 work.
- Real map-driven area classification remains Sprint 4 work.
- Stronger row-level locking is deferred unless production contention requires it.

## 2026-06-23

### Added

- Added shared land package constants with stable package keys, labels, sizes, and cooldowns in `packages/game`.
- Added deterministic land pricing helpers for package size, kingdom size multiplier, and area multiplier.
- Added land package cooldown helpers for next-available timestamps and active cooldown checks.
- Added land purchase validation helpers for package, kingdom, stockpile, Money, and cooldown checks.
- Added focused land package, pricing, cooldown, and validation tests.
- Added an authenticated land purchase Server Action backed by a transaction-safe server helper.
- Added read-only land purchase option shaping for the future dashboard UI.
- Added `LAND_PURCHASE` report creation during successful land purchases.
- Added focused land purchase mutation tests for rejection paths, Money/land changes, cooldown updates, duplicate cooldown rejection, and report creation.

### Changed

- Started Sprint 3 and marked S3-001 through S3-003 complete in active task trackers.
- Reused existing `LandPurchaseCooldown` persistence instead of adding a duplicate cooldown model.
- Documented the v0.1 land pricing formula and placeholder area-type behavior.
- Marked S3-004 and S3-005 complete because the purchase mutation and report creation now run in one transaction.
- Documented the land purchase Server Action pattern and v0.1 concurrency boundary.

### Deferred

- Dashboard land purchase UI and district reassignment remain pending Sprint 3 tasks.
- Real visible-border expansion and polygon recalculation remain Sprint 4 work.

### Known issues

- Real map-driven area classification is not implemented; current pricing defaults unknown area values to `STANDARD`.

## 2026-06-21

### Added

- Added read-only dashboard sections for resource stockpiles, per-tick economy estimates, Food status, active construction progress, active training progress, latest TickLog activity, and latest kingdom reports.
- Added dashboard data shaping for net Food, ticks until Food reaches zero, queue duration display, and report summaries.
- Added shared tick-duration display helper tests in `packages/game`.
- Added an admin-only Server Action that runs one manual tick through the existing tick worker core.
- Added Tick Controls and Recent Tick Logs sections to `/admin`.
- Added admin tick authorization tests and TickLog row-shaping tests.
- Added `docs/sprints/SPRINT_02_REVIEW.md` with Sprint 2 closure status, deferred items, migration status, and Sprint 3 readiness.

### Changed

- Reused `packages/game` resource-generation and Food-consumption formulas for dashboard per-tick estimates instead of duplicating formulas in UI components.
- Marked S2-008 complete in Sprint 2 task trackers.
- Marked S2-009 complete in Sprint 2 task trackers.
- Completed Sprint 2 QA, stabilization, and closure review documentation.
- Documented that Sprint 2 closes on worker-side processing, dashboard visibility, and admin/manual tick controls.

### Deferred

- Player-facing start-construction/start-upgrade actions, player-facing start-training actions, one-active-training-queue enforcement, automatic tick scheduling, failed TickLog cleanup tooling, starvation penalties, and deprecation-warning cleanup remain deferred to their owning future v0.1 or maintenance tasks.

### Known issues

- None blocking Sprint 3 start from the Sprint 2 tick-engine standpoint.

## 2026-06-20

### Added

- Added deterministic Food consumption formulas for population and army in `packages/game`.
- Added net Food clamping helper so Food cannot go below zero after a tick.
- Added Food consumption unit tests for population-only consumption, starter kingdom consumption, each v0.1 unit type, invalid quantity clamping, unknown unit rejection, and non-negative Food results.
- Added named resource-generation breakdowns for population tax and population-driven Manpower generation.
- Added tests that confirm starter generation totals remain unchanged while formula breakdown totals stay consistent.
- Added construction progress helpers and tests for active, constructing, upgrading, completion, normalization, and negative-timer cases.
- Added construction progress summaries to tick output.
- Added construction completion report creation during tick processing.
- Added `TrainingQueueStatus` and `TrainingQueueItem` to Prisma with migration `000004_training_queue_items`.
- Added training progress helpers and tests for active, completed, cancelled, completion, normalization, and negative-timer cases.
- Added training progress summaries to tick output.
- Added training completion report creation during tick processing.

### Changed

- Wired `tick:once` to subtract Food consumption after Food generation for each processed kingdom.
- Extended tick output with consumed Food totals and Food shortage count.
- Marked S2-004 complete in Sprint 2 task trackers.
- Extended tick output with population tax and population Manpower summary totals.
- Marked S2-005 complete in Sprint 2 task trackers.
- Wired `tick:once` to decrement `CONSTRUCTING` and `UPGRADING` building timers after generation and Food consumption.
- Marked S2-006 complete in Sprint 2 task trackers.
- Wired `tick:once` to decrement active training queues, complete ready queues, and add trained units to garrison stacks.
- Increased tick worker transaction timeout to 30 seconds for remote database tick reliability.
- Marked S2-007 complete in Sprint 2 task trackers.

### Deferred

- Starvation deaths, training pauses, shortage penalties, player-facing construction start actions, and player-facing start-training actions remain deferred to later Sprint 2 tasks.

### Known issues

- None blocking the next Sprint 2 implementation task.

## 2026-06-19

### Added

- Added public `/privacy` and `/terms` pages for Google OAuth publication.
- Added reusable legal page layout and legal link components.
- Added a Google OAuth publication checklist at `docs/GOOGLE_OAUTH_PUBLICATION_CHECKLIST.md`.
- Added `workers/tick-worker` as the Sprint 2 tick worker package.
- Added stable 10-minute tick key helpers and tick log formatting helpers.
- Added `TickLogStatus` and `TickLog` to Prisma with migration `000003_tick_logs`.
- Added root tick scripts: `tick:once`, `tick:dev`, `tick:test`, and `tick:typecheck`.
- Added worker unit tests for tick key calculation and tick-log helpers.
- Added the first `packages/game` package manifest, TypeScript config, and shared exports.
- Added deterministic resource-generation formulas for Money, Food, Manpower, and Knowledge.
- Added unit tests for population-only generation, starter kingdom generation, inactive buildings, building stacking, and invalid input clamping.

### Changed

- Linked Privacy Policy and Terms of Service from the home, login, and register pages.
- Added a Google-login policy notice near the Google login entry points on `/login` and `/register`.
- Documented Google OAuth publication URLs and remaining Google Cloud Console setup steps.
- Completed Sprint 1 QA/auth compliance closure and marked Sprint 1 ready for Sprint 2.
- Updated Sprint 1 acceptance docs to reflect user-tested auth, routing, kingdom creation, dashboard, admin, and public legal page flows.
- Started Sprint 2 and marked S2-001/S2-002 complete in the active task trackers.
- Updated root `npm run test` to include worker tests after web tests.
- Documented the tick worker command convention, TickLog model, and duplicate tick-key protection.
- Applied migration `000003_tick_logs` to the configured database and verified `npm run tick:once` completes.
- Wired `tick:once` to apply resource generation for each processed kingdom and report generated totals.
- Updated root `npm run test` and `npm run typecheck` to include shared game package checks.

### Fixed

- Filled the missing public policy URL surface required before safely publishing Google OAuth login.
- Removed stale Sprint 1 live-smoke blocker language from active Sprint 1 closure docs.
- Improved `tick:once` failure output when the TickLog schema is missing.

### Deferred

- Google Cloud Console OAuth consent configuration remains an external deployment/setup step.
- Food consumption, population effects beyond the current formula inputs, construction progress, training progress, scheduler behavior, and admin tick controls remain deferred to later Sprint 2 tasks.

### Known issues

- None blocking the next Sprint 2 implementation task. Production Google OAuth publication still requires external Google Cloud Console configuration before public production publishing.

## 2026-06-17

### Added

- Added `POST /api/kingdom/validate-location` as a temporary Sprint 1 validation endpoint.
- Added reusable temporary location validation helpers for coordinate validation, distance checks, suggestions, and preview polygon generation.
- Added shared game constants for starting usable land, temporary visible area, and temporary minimum kingdom distance.
- Added unit tests for temporary kingdom location validation helpers.
- Added an editable `/create-kingdom` confirmation panel after successful location validation.
- Added shared starter-state constants for resources, population, districts, buildings, units, and beginner protection.
- Added kingdom name validation helpers and focused tests.
- Added `POST /api/kingdom/create` with authenticated, server-side kingdom creation.
- Added a database transaction that creates the kingdom, five districts, resource stockpile, starter buildings, starter units, land package cooldown rows, and beginner protection timestamp.
- Added kingdom creation helpers and tests for slug generation, protection duration, starter district totals, starter units, and land package constants.
- Added a read-only `/dashboard` kingdom overview loaded server-side from the database.
- Added dashboard data helpers and tests for free land, district free land, beginner-protection remaining time, and dashboard data shaping.
- Added a read-only `/admin` panel for Sprint 1 foundation inspection.
- Added admin overview counts plus users, kingdoms, resources, districts, buildings, units, and reports preview tables.
- Added admin data helpers and tests for enum labels, district free land, report read state, and read-model shaping.
- Added `docs/sprints/SPRINT_01_REVIEW.md` for Sprint 1 QA closure.
- Added shared Mamalik UI primitives for page shells, cards, inputs, action buttons, and data tables.

### Changed

- Wired the `/create-kingdom` validate button to call the temporary validation endpoint and show loading, success, invalid reason, and suggestions.
- Updated `/create-kingdom` to show selected coordinates, validation status, land values, preview polygon summary, locked starter state, editable kingdom name, and a placeholder Create kingdom action after validation succeeds.
- Wired the `/create-kingdom` confirmation panel to call `POST /api/kingdom/create`, show loading/errors, and redirect to `/dashboard` on success.
- Expanded starter constants so the UI and creation route share server-usable enum values, labels, building footprints, and land purchase package data.
- Confirmed S1-011 was already completed by the S1-010 map slice and left it marked complete in the active task trackers.
- Marked Sprint 1 Task S1-012 complete in the active task files.
- Marked Sprint 1 Task S1-013 complete in the active task files.
- Marked Sprint 1 Tasks S1-014 and S1-015 complete in the active task files.
- Marked Sprint 1 Task S1-016 complete in the active task files.
- Marked Sprint 1 Task S1-017 complete in the active task files.
- Marked Sprint 1 QA, stabilization, and closure complete in the active task files.
- Completed a post-closure UI stabilization pass for the existing home, login, register, dashboard, admin, and create-kingdom surfaces.
- Updated the signed-in home page to show the existing player destination and admin navigation when applicable.
- Documented the temporary validation behavior and Sprint 4 replacement path.
- Configured Next.js `outputFileTracingRoot` to the repository root so production builds can trace repo-local package runtime files.

### Fixed

- Replaced the local validate-location placeholder message with an actual temporary API call.
- Replaced the confirmation panel's placeholder Create kingdom action with the real Sprint 1 creation request.
- Fixed kingdom name validation so control characters are rejected before whitespace normalization.
- Fixed the Sprint 1 production build failure caused by missing traced Prisma runtime files from `packages/db`.
- Fixed inconsistent Sprint 1 surface styling by applying the shared UI primitives across existing app pages.

### Deferred

- Real water validation, restricted-zone validation, dynamic buffer/PostGIS validation, and real visible border generation remain deferred to their assigned Sprint 4 tasks.
- Sprint 1 admin write controls, reset/delete/edit actions, and admin-triggered ticks remain deferred to later owning tasks.

### Known issues

- Live validate-location route smoke testing requires a reachable PostgreSQL/PostGIS database and signed-in no-kingdom account.
- Live confirmation-flow smoke testing also requires a signed-in no-kingdom account and reachable database.
- Live kingdom creation route and database record smoke testing require a reachable PostgreSQL/PostGIS database and signed-in no-kingdom account.
- Live Google OAuth smoke testing still requires configured Google OAuth credentials.
- Live no-kingdom create-kingdom map/validation/creation smoke testing still requires a prepared signed-in no-kingdom account.
- Live second kingdom rejection and non-admin admin-denial smoke tests still require prepared account states.

## 2026-06-16

### Added

- Added MapLibre GL JS to the web app.
- Added the first protected `/create-kingdom` map-selection page.
- Added a client-side `KingdomLocationMap` component with pan, zoom, click selection, selected marker, coordinate display, search placeholder, and local validate-location placeholder message.

### Changed

- Marked Sprint 1 Tasks S1-010 and S1-011 complete in the active task files because the S1-010 instructions included the S1-011 map interaction requirements.
- Documented active MapLibre environment configuration and the no-fallback map-style behavior.

### Fixed

- Replaced the S1-009 `/create-kingdom` placeholder with the first usable map-selection surface.

### Deferred

- Server-side temporary location validation remains Sprint 1 Task S1-012.
- Editable kingdom name confirmation, kingdom creation transaction, starter state seeding, real land validation, visible border generation, and gameplay systems remain deferred to their assigned tasks.

### Known issues

- Live map smoke testing requires a signed-in no-kingdom user and reachable PostgreSQL/PostGIS database.
- `npm --prefix apps/web install maplibre-gl` reported 3 npm audit findings: 2 moderate and 1 high.

## 2026-06-08

### Added

- Added server-side route guard helpers for authenticated app routes.
- Added `/dashboard`, `/create-kingdom`, and `/admin` Sprint 1 placeholder pages.
- Added post-login destination and admin allowlist helpers.
- Added focused auth tests for kingdom-based destination selection and admin access checks.
- Added first-party Google OAuth start and callback route handlers.
- Added short-lived Google OAuth state cookie helpers.
- Added Google identity normalization and user upsert/linking logic.
- Added "Continue with Google" links to `/login` and `/register`.
- Added focused auth tests for OAuth state, Google authorization URL creation, identity normalization, and user linking/creation.
- Added `docs/archive/` for historical duplicate documentation.
- Added `tasks/archive/` for historical duplicate task artifacts.
- Added archive README files explaining that archived materials are read-only historical references.

### Changed

- Marked Sprint 1 Task S1-009 complete in the active task files.
- Documented protected route behavior and admin allowlist behavior.
- Redirect signed-in `/login` and `/register` visitors to `/create-kingdom` or `/dashboard`.
- Marked Sprint 1 Task S1-008 complete in the active task files.
- Documented Google OAuth configuration, callback URI, state cookie behavior, and account-linking behavior.
- Added canonical documentation and task source guidance to `AGENTS.md`.
- Recorded the canonical documentation convention in `context.md` and `docs/DECISIONS_LOG.md`.
- Moved legacy duplicate v0.1 docs and duplicate Sprint 1-6 task artifacts into archive folders.

### Fixed

- Reduced documentation drift by keeping zero-padded Sprint 1-6 docs and Markdown task files as the active source of truth.

### Deferred

- MapLibre kingdom creation UI remains Sprint 1 Task 10.
- Full admin read-only views remain Sprint 1 Task 17.

### Known issues

- Live protected route smoke testing requires a reachable PostgreSQL/PostGIS database.
- Live Google OAuth smoke testing requires configured Google OAuth credentials, matching callback URI, and a reachable PostgreSQL/PostGIS database.
- v0.2 docs and task artifacts remain future-only references.
- Export/reference backlog files remain in place and are not active task trackers.

## 2026-06-07

### Added

- Added email/password register, login, and logout route handlers.
- Added `/register` and `/login` pages.
- Added signed `mamalik_session` cookie helpers and `crypto.scrypt` password hashing.
- Added focused auth unit tests and app-local `tsx` test runner support.
- Added `docs/AUTHENTICATION.md`.
- Added a generated v0.1 logo mark at `apps/web/public/brand/mamalik-logo.png`.
- Added `docs/BRAND_ASSETS.md`.

### Changed

- Marked Sprint 1 Task S1-007 complete in the active task files.
- Updated architecture, environment, testing, sprint, context, and decision docs for first-party email/password auth.
- Updated app metadata and the home page to use the Mamalik logo mark.

### Fixed

- Configured the web build root so Turbopack can build repo-local `packages/db` imports.

### Deferred

- Google login is deferred to Sprint 1 Task 8.
- Protected dashboard/create-kingdom route behavior is deferred to Sprint 1 Task 9.

### Known issues

- No live database setup exists yet.
- `npm install` for the web app reported two moderate npm audit findings after adding `tsx`.
- Live register/login route smoke tests require a reachable database and were not run in this environment.

## 2026-06-02

### Added

- Added persistent Codex instructions in `AGENTS.md`.
- Added long-term project memory in `context.md`.
- Added live working memory in `session_state.md`.
- Added canonical v0.1 documentation files for locked decisions, scope, architecture, data model, sprint plan, definition of done, testing strategy, and decisions log.
- Added canonical Sprint 1-6 Markdown files under `docs/sprints/`.
- Added canonical task Markdown files under `tasks/`.
- Added the minimal Sprint 1 monorepo directory skeleton: `apps/web`, `packages/db`, `packages/game`, `packages/config`, and `workers/tick-worker`.
- Added the Next.js 16 web app foundation in `apps/web` with TypeScript, Tailwind, ESLint, App Router, npm, and `src/`.
- Added root npm forwarding scripts for `dev`, `build`, `lint`, and `typecheck`.
- Added `apps/web/.env.example` with placeholders for app URL, database, auth, map, admin, and tick worker settings.
- Added `docs/ENVIRONMENT.md` for local environment setup and secret handling.
- Added `packages/db` Prisma/PostgreSQL/PostGIS foundation with package-local dependencies, config, schema, PostGIS migration, and environment example.
- Added root DB scripts for Prisma validation, generation, migrations, Studio, and DB package typecheck.
- Added `docs/DATABASE.md`.
- Added initial v0.1 Prisma enums and models for `User`, `Kingdom`, `District`, `ResourceStockpile`, `BuildingInstance`, `UnitStack`, `LandPurchaseCooldown`, and `Report`.
- Added `packages/db/prisma/migrations/000002_initial_v0_1_models/migration.sql`.

### Changed

- Clarified that Sprint 1 is the active sprint and v0.1 is the active release.
- Clarified that existing v0.2 material is future-only until v0.1 is complete.
- Marked Sprint 1 Task S1-002 complete in the active task files.
- Marked Sprint 1 Task S1-003 complete in the active task files.
- Marked Sprint 1 Task S1-004 complete in the active task files.
- Marked Sprint 1 Task S1-005 complete in the active task files.
- Marked Sprint 1 Task S1-006 complete in the active task files.
- Recorded npm as the current package manager convention.
- Clarified that real `.env*` files stay ignored while `.env.example` is trackable.
- Updated the data-model, architecture, database, sprint, and context documentation for the initial Prisma model foundation.

### Fixed

- Filled missing required repository memory files.

### Deferred

- Game code implementation is deferred until after the repository foundation is locked.
- Queue, tick, movement, combat, alliance, ranking, and full report-center models remain deferred to later v0.1 sprint tasks.

### Known issues

- No live database setup or automated test runner exists yet.
- Legacy unpadded sprint docs and generated JSON/CSV task files remain present as reference artifacts.
- `npm run build` currently emits a Node deprecation warning for `module.register()` under Node v26.1.0, but the build passes.
- Local `psql` and Docker are not available in the current environment, so the PostGIS migration has not been applied locally.
- `npm install` for the DB package reported three moderate npm audit findings.
- Prisma `migrate diff` did not emit SQL from the local schema in this toolchain, so the S1-006 model migration was added manually from the validated Prisma schema.
