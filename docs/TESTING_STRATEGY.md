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
| Public marketing UI | `npm run typecheck`, `npm run lint`, `npm run build`, plus browser smoke for `/`, `/features`, `/about`, `/how-to-play`, `/roadmap`, `/updates`, `/careers`, and `/contact` when a browser is available |

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
- Kingdom UI navigation smoke after S4-010 should verify `/dashboard` stays an overview, focused pages `/world`, `/economy`, `/land`, `/buildings`, `/army`, and `/reports` load for a player kingdom, and the stored kingdom border renders on dashboard/world map previews.
- Water rejection smoke should seed the land mask, validate a known land point such as Riyadh, validate an obvious ocean point such as `lat: 0`, `lng: -30`, and confirm kingdom creation rejects water server-side.
- Restricted-zone smoke should apply migration `000007_restricted_zones`, run `npm run db:seed-restricted-zones`, validate a coordinate inside the artificial fixture, confirm `restricted-zone` rejection, then re-check a known land point and an ocean point for regressions.
- Route/API smoke for `/api/kingdom/validate-location` requires a signed-in no-kingdom user because the endpoint enforces authentication and one-kingdom-per-user behavior.
- Kingdom creation smoke should confirm the server reruns PostGIS validation and stores the server-generated `visibleBorderGeojson`; client-submitted preview polygons remain untrusted.
- Water and restricted-zone checks must not be marked complete until their datasets/checks exist.
- Sprint 4 closure can use helper-level PostGIS smoke when a no-kingdom browser session is not available. The helper smoke should validate safe land, ocean, restricted fixture, existing-kingdom overlap, and at least one returned suggestion through `validateKingdomLocationWithPostgis`.
- Create-kingdom browser smoke remains recommended before public launch, especially for MapLibre layer rendering and stale-preview clearing, but a blocked browser automation session should be documented rather than worked around unsafely.

## Sprint 5 Testing Priorities

- Great-circle distance tests should verify identical points, a known short distance, a known long inter-city distance, symmetry, and an antipodal half-circumference case.
- Travel-time tests should verify order/unit type guards, per-unit speed multipliers, slowest-unit pacing, empty and unknown unit fallbacks, more ticks for longer trips, scouts outpacing siege, whole-meter distance, whole-tick travel time, clamping of zero/negative/non-finite distance to the 1-tick minimum, arrival/return date math on 10-minute ticks, and rejection of invalid dates.
- Travel-time tests should also pin the documented balance placeholder so an unintended retune of `MOVEMENT_BASE_METERS_PER_TICK` is a deliberate, reviewed change.
- After S5-001, `npm run db:validate` and `npm run db:generate` must pass so the new model and enums compile into the generated Prisma client.
- S5-003 validator tests should pin the fixed rule order and its boundaries, because the returned reason is part of the contract the UI renders: `INVALID_TARGET` over `SELF_TARGET`, `SELF_TARGET` over `TARGET_PROTECTED`, `TARGET_PROTECTED` over `INVALID_SCOUT_COUNT`, and `INVALID_SCOUT_COUNT` over `NOT_ENOUGH_SCOUTS`. Each precedence pair has its own test.
- S5-003 validator tests should pin the beginner-protection boundary: protection is active only while `protectionEndsAt > now` strictly, so an expiry exactly equal to `now` (and one millisecond in the past) is already expired and allowed. The boundary must stay pinned because an off-by-one here decides whether a legal scout order is rejected.
- S5-003 validator tests should pin that protection gates the target only. A beginner-protected source kingdom must still be allowed to scout an unprotected target, per `docs/01_LOCKED_DECISIONS.md`. This is a deliberate rule, not an oversight, so it is locked by test.
- S5-003 validator tests should also cover normalization of hostile input: blank/whitespace/missing target ids, non-finite coordinates, missing or invalid protection dates, non-positive or fractional scout counts, and fractional/negative/`NaN` garrison counts.
- S5-003 mutation tests should assert the transactional no-write-on-failure rule: every rejected path must leave both the `SCOUTS`/`GARRISON` stack quantity and the `MovementOrder` row count unchanged. The unauthenticated and blank-target paths must additionally assert that no transaction was opened at all.
- S5-003 mutation tests should cover the atomic reservation guard by forcing the conditional `updateMany` to report a lost race, then asserting the caller still receives the typed `NOT_ENOUGH_SCOUTS` reason and that nothing was written.
- S5-003 mutation tests should cover the happy path end to end: exact reserved quantity, `orderType: "SCOUT"`, `status: "IN_TRANSIT"`, the `unitsJson` manifest shape, null `returnAt`/`parentOrderId`/`resolvedAt`/`cancelledAt`, and a server-computed great-circle `distanceM`.
- S5-003 read-model tests should assert agreement between the target read model and the validator: every rendered option's `canTarget`/`disabledReason` must match what `createScoutOrderForUser` would accept for that target, and the bounded limit, the deterministic `createdAt` ordering, and the pushed-down own-kingdom exclusion should be pinned.
- The repo has no component test runner, so `ScoutOrderPanel` has zero automated UI coverage. Its verification is manual smoke only under this strategy, and that gap must be recorded rather than implied as tested.
- After S5-003, `npm run game:test` and `npm --prefix apps/web run test` must both pass so the shared validator, the mutation, and the read model stay in agreement.
- S5-006 through S5-010 still have no automated coverage for the battle formula, defender bonuses, siege, war land capture, or battle resolution until those tasks land; those checks are documented as gaps rather than assumed. Attack dispatch itself is covered as of S5-005.
- S5-004 band tests should pin every boundary on both sides, not just the typical case, because a band edge is a balance decision a later retune must be forced to revisit deliberately: army at and around 50 and 200 garrison units, food at and around 1,000 and 5,000, wall levels at and around 0, 1, 3, and 4 (including a negative level treated as no wall at all), the combined defence score at and around 6 and 16, and the defensive-district sub-2000 m2 remainder that earns no score point.
- S5-004 land-band tests should pin that land is coarsened to the nearest 10,000 m2 with a 10,000 m2 floor, and specifically that a grown kingdom's exact usable land does NOT appear as the reported band.
- The no-leak property of the scout report body is a CONTRACT, not a nice-to-have, so it needs a dedicated test that serializes the built body and asserts the exact input garrison count, Food stockpile, defensive district land, wall level, and usable land are all absent, while asserting a real coarse band is still present. A scout report that is empty of information is also a failure, so the test must check both directions.
- Determinism of `approximateScoutObservation` should be pinned by a test that runs the same input twice and asserts deeply identical output, because a tick can be retried and a retried tick must not produce a different report. Any future change that introduces `Math.random()`, `Date.now()`, or another clock/external read into the approximation should fail that test.
- Hostile-input normalization should stay pinned: negative, fractional, `NaN`, and `Infinity` inputs must never produce `NaN` or a non-finite number anywhere in the approximation or the report body, fractional quantities must floor rather than round up, and an invalid `arrivedAt` date must be rejected rather than persisted.
- S5-004 arrival-pass tests should assert the full happy-path resolution in one shot: one `SCOUT` report on the SOURCE kingdom, the outbound order `RESOLVED` with `resolvedAt`, exactly one `RETURN` leg with `parentOrderId` pointing at it, and the return leg's `travelTicks` copied from the outbound order rather than recomputed.
- S5-004 arrival-pass tests should pin the two-phase ordering explicitly: a `RETURN` leg that comes home in the same tick as an arriving `SCOUT` order must be credited into the garrison before the scout arrival is processed. That ordering is load-bearing for the per-kingdom economy loop, and a silent reorder would not fail any other test.
- S5-004 arrival-pass tests should assert idempotency: a second pass over already resolved and completed orders must be a no-op on every summary counter, and an outbound order that already has a return leg must never get a second one. `parentOrderId` is UNIQUE in the schema, so this is also the guard against a unique-constraint crash on a re-run.
- S5-004 arrival-pass tests should cover per-order warning isolation: force one order to fail and assert that every other arrival is still processed and reported, that the failure becomes a `warnings` entry rather than a thrown error, and that the tick continues.
- S5-004 arrival-pass tests should cover the missing-target path (a vanished target kingdom writes no report, but the order is still resolved and the scouts still come home) and the failed-report path (the order is still resolved and the return leg is still created). Losing scouts off-map is worse than losing one report, so both paths are load-bearing.
- S5-004 arrival-pass tests should assert that a bad `unitsJson` manifest can NEVER produce a negative garrison: zero, negative, fractional, `NaN`, and unknown-unit-type entries must be dropped and counted, and a wholly corrupt non-array manifest must complete the leg while crediting nothing.
- S5-004 arrival-pass tests should also assert that orders whose `arrivalAt` is still in the future are ignored, and that an invalid `now` is rejected rather than writing wrong arrival timestamps into every order it touches.
- S5-004 display tests should assert that band rows use the shared `SCOUT_BAND_LABELS` wording rather than locally authored strings, that the coarse land figure is formatted as approximate with the `≈` prefix, and that `parseScoutReportBody` returns `null` — and never throws — for a missing body, a non-object body, a band outside the shared unions, a non-numeric land band, or a stringified JSON body.
- End-to-end arrival — a real dispatched order, a real tick resolving it, a real report row and return leg against real rows — still requires a reachable PostgreSQL/PostGIS database. The arrival pass is exercised only against a hand-rolled fake transaction client, so the whole path is unverified against a real database and that gap must be recorded rather than implied as tested.
- The repo has no component test runner, so the `ReportsPanel` scout report rendering remains manual smoke only under this strategy. That gap must be recorded rather than implied as tested.
- After S5-003, `npm run game:test` and `npm --prefix apps/web run test` must both pass so the shared validator, the mutation, and the read model stay in agreement.
- After S5-004, `npm run game:test` (123/123), `npm run tick:test` (23/23), and `npm --prefix apps/web run test` (157/157) must all pass, so the shared banding, the arrival pass, and the display parser stay in agreement about what a scout report may contain.
- Applying `000008_movement_orders` and smoke-testing a real dispatched order row — including the conditional decrement against real rows — requires a reachable PostgreSQL/PostGIS database and is not covered by unit tests. End-to-end scout dispatch is therefore still unverified end to end.
- S5-005 mutation tests should assert the transactional no-write-on-failure rule for every rejected path: the garrison must be untouched and no `MovementOrder` row written. The unauthenticated and blank-target paths must additionally assert that NO transaction was opened at all, and the same for a kingdom with no garrison rows.
- S5-005 mutation tests should cover the ALL-OR-NOTHING reservation specifically for a multi-unit-type manifest: a later unit type whose conditional `updateMany` matches zero rows must roll back the earlier decrements and write no order row, and a lost race on the FIRST unit type must also write nothing. The test fake must model real transaction behaviour by snapshotting writable state, otherwise "rollback" is only asserted in the fake's own bookkeeping and proves nothing. A separate test must assert that duplicate entries reserve a single aggregated quantity rather than two decrements.
- S5-005 mutation tests should cover the happy path in one shot: every unit type reserved by exactly its aggregated amount, `orderType: "ATTACK"`, `status: "IN_TRANSIT"`, a server-computed great-circle `distanceM`, travel ticks set by the slowest unit, null `returnAt`/`parentOrderId`/`resolvedAt`/`cancelledAt`, and `unitsJson` holding the NORMALIZED manifest the validator returned rather than the raw client payload.
- S5-005 read-model tests should assert agreement between the read model and the validator: every rendered option's `canTarget`/`disabledReason` must match what `createAttackOrderForUser` would accept for that target, and the bounded limit, the deterministic `createdAt` ordering, and the pushed-down own-kingdom exclusion should be pinned. A caller with NO army must mark every target un-targetable with `INSUFFICIENT_UNITS` rather than `INVALID_ARMY`, since the truth is that the player has nothing to send, and a target-specific reason must still win over that. The unit picker should be asserted to offer only positive-quantity `GARRISON` stacks and only stacks the mutation can actually reserve.
- The repo has no component test runner, so `AttackOrderPanel` has zero automated UI coverage. Its verification is manual smoke only under this strategy, and that gap must be recorded rather than implied as tested. In particular, the client-side decision to submit an empty manifest so the server answers `INVALID_ARMY` is NOT covered by any test, because it lives in the form action's plumbing rather than in the validator.
- After S5-005, `npm run game:test` (153/153), `npm --prefix apps/web run test` (201/201), and `npm run tick:test` (23/23, unchanged because S5-005 adds no worker code) must all pass, so the shared target rules, the attack validator, the mutation, and the read model stay in agreement. `npm run db:validate` must also pass: S5-005 adds no migration.
- End-to-end attack dispatch — a real mixed manifest reserved against real rows, a real `ATTACK` `MovementOrder` written, and the all-or-nothing rollback failing for real — still requires a reachable PostgreSQL/PostGIS database. The mutation is exercised only against a hand-rolled fake client, so the whole path is unverified against a real database and that gap must be recorded rather than implied as tested.
- A dispatched attack currently has NO EFFECT: there is no battle, no casualty, no land capture, and no battle report, and no test in this sprint can assert one. Any future test claiming an attack "resolves" would be testing behaviour that does not exist until S5-006 through S5-010.
- S5-005's first requirement is a REGRESSION requirement: because S5-003 inlined the four target rules inside the scout validator and S5-005 moved them into the shared `validateMovementTarget`, the 25 pre-existing scout validator tests must pass UNCHANGED. Editing them to accommodate the refactor would destroy the only evidence that it was behaviour-preserving. The delegation must be visible in the code, but the scout test file must not be touched.
- S5-005 tests should pin that the shared helper produces all four delegated reasons (`INVALID_TARGET`, `SELF_TARGET`, `TARGET_NOT_FOUND`, `TARGET_PROTECTED`) from both consumers, so the extraction cannot quietly narrow what either validator rejects. The protection boundary itself must stay pinned on both sides: `protectionEndsAt > now` strictly, so an expiry exactly equal to `now` is already over, and a protected SOURCE kingdom may still attack or scout an unprotected target.
- S5-005 validator tests should cover the attack-specific army rules: `INVALID_ARMY` for an empty manifest, `INVALID_UNIT_TYPE` for an unrecognized unit type, and `INSUFFICIENT_UNITS` when the garrison cannot cover the request. The unknown-unit-type test must assert REJECTION rather than silent dropping, because dropping a bad entry would shrink the attacker's declared army without telling anyone. Rule precedence should be pinned the same way S5-003 pinned its own, including `INVALID_UNIT_TYPE` winning over an invalid quantity and `TARGET_PROTECTED` winning over an invalid army.
- S5-005 validator tests should assert duplicate-manifest AGGREGATION against supply: 60 + 60 of one unit type against a garrison of 100 must fail with `INSUFFICIENT_UNITS`, 40 + 40 against 100 must succeed with a total of 80, and a mixed duplicate manifest must aggregate each unit type separately. The garrison side should be asserted to clamp non-finite, negative, and fractional quantities to zero rather than propagating `NaN` into the comparison, and to ignore unusable entries entirely so a caller with no army gets an empty map.
- S5-005 validator tests should assert that a MIXED army travels at the pace of its slowest unit by reusing the shared movement helpers, so a manifest containing `SIEGE` is strictly slower than one of only `SCOUTS` at the same distance, and that the returned travel output is identical to what `calculateTravelTime` produces for the same unit list. One unit must be accepted as a legal attack, pinning the absence of a minimum army size.


## Documentation Requirement

Every task must record:

- Commands run.
- Result of each check.
- Why any expected check could not run.
- Known issues and residual risk.
