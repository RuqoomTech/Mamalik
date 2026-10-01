# Session State

## Current Session

- Current date/time: 2026-10-01 14:40:00 +03:00
- Current sprint: Sprint 5 is active. S5-001, S5-002, S5-003, and S5-004 complete; S5-005 is next.
- Current sprint file: `docs/sprints/SPRINT_05_COMBAT_SCOUTING.md`
- Current task: S5-004 approximate scout reports complete and fully checked.
- Working branch: `sprint-5-movement-scouting`. It carries two prior commits, `5e7093b` (S5-001/S5-002) and `55754a1` (S5-003). S5-004 is currently UNCOMMITTED on top of them. All Sprint 5 work lives on this branch, not on the default branch.

## Last Completed Task

- S5-004: added the shared band approximation in `packages/game/src/movement/scout-report.ts` (`approximateScoutObservation`, `buildScoutReportBody`, `SCOUT_BAND_LABELS`), the tick-worker movement arrival pass in `workers/tick-worker/src/movement-arrival.ts` (`processMovementArrivals`), the `MovementArrivalSummary` plus tick-log formatting in `workers/tick-worker/src/tick-log.ts`, the null-safe display parser in `apps/web/src/lib/kingdom/scout-report-display.ts`, and scout report rendering in `ReportsPanel`, `dashboard-data.ts`, `/army`, and `/reports`.
- Bands: army `SMALL`/`MEDIUM`/`LARGE` (50/200 units), food `LOW`/`MEDIUM`/`HIGH` (1,000/5,000), wall `NONE`/`LOW`/`MEDIUM`/`HIGH` (levels 1/3), defence `WEAK`/`NORMAL`/`STRONG` from `wallLevel*3 + watchtowerLevel*2 + floor(defensiveDistrictLandM2/2000)` cut at 6/16, and land rounded to the nearest 10,000 m2 with a 10,000 m2 floor.
- The report is APPROXIMATE BY DESIGN and leaks NO exact enemy value: no exact unit counts, no exact Food, no exact land, no building levels. Only coarse bands plus the coarse land band. A test asserts every exact input value is absent from the serialized body.
- Every band threshold is a v0.1 BALANCE PLACEHOLDER, not a locked decision, and needs playtest retuning — the same status as `MOVEMENT_BASE_METERS_PER_TICK`. `approximateScoutObservation` is fully deterministic (no `Math.random`, no clock reads) so a retried tick cannot change a report.
- `runOneTick` now calls `processMovementArrivals(tx, { now, tickKey })` inside the existing `prisma.$transaction` (30s timeout), at the START of the transaction before the per-kingdom loop. It runs TWO ORDERED PASSES: PASS 1 completes `RETURN` legs (upsert-increment the source garrison `UnitStack`, order `COMPLETED` with `returnAt`), THEN PASS 2 resolves arriving `SCOUT` orders (`SCOUT` `Report` on the SOURCE kingdom, outbound order `RESOLVED` with `resolvedAt`, `RETURN` leg created). The ordering is load-bearing so a returning unit is in its garrison before the per-kingdom economy loop reads Food consumption and army totals.
- `resolvedAt`, `returnAt`, and `parentOrderId` are now actually written. The return leg REUSES the outbound order's `travelTicks` and copies `distanceM`/`unitsJson` verbatim, with `arrivalAt = getMovementReturnAt(now, travelTicks)`. `parentOrderId` is UNIQUE and the worker checks for an existing leg, so re-runs are no-ops.
- Failure isolation is per order into `warnings`. A failed report write still resolves the order and still creates the return leg; a vanished target kingdom also still returns the scouts. No arrival is ever left stuck `IN_TRANSIT` past its `arrivalAt`. Malformed `unitsJson` entries (zero, negative, fractional, `NaN`, unknown unit type) are dropped and counted, which guarantees a bad manifest can never drive a garrison below zero.
- Reports appear on the NEXT TICK after arrival, not instantly. The `/army` and `/reports` copy now says so plainly without promising instant results or attack/battle functionality.
- `SCOUT_BAND_LABELS` in `packages/game` is the single source of truth for band display wording, and the web parser is null-safe, so a malformed `bodyJson` degrades to a title-only row and can never crash a page.
- Web tests grew 146/146 -> 157/157 with 11 new; game tests grew 103/103 -> 123/123 with 20 new; tick tests grew 8/8 -> 23/23 with 15 new.

## Last Completed Task

- S5-003: added the shared scout order validator `validateScoutOrder` in `packages/game/src/movement/scout-order-validation.ts` (exported from `packages/game`), the server-side `createScoutOrderForUser` mutation in `apps/web/src/lib/kingdom/scout-orders.ts`, the bounded `getScoutTargetOptionsForUser` read model, `ScoutOrderActionState` / `createScoutOrderAction` / `createScoutOrderFormAction` in `apps/web/src/app/dashboard/actions.ts`, and the `ScoutOrderPanel` on `/army`.
- Validation runs a fixed rule order (`INVALID_TARGET`, `SELF_TARGET`, `TARGET_NOT_FOUND`, `TARGET_PROTECTED`, `INVALID_SCOUT_COUNT`, `NOT_ENOUGH_SCOUTS`, else success); the earliest blocking rule wins.
- Beginner protection is active only while `protectionEndsAt > now` strictly, and it gates the target only. A protected source kingdom may still scout an unprotected target, per `docs/01_LOCKED_DECISIONS.md`. Both are pinned by tests.
- Dispatch reserves scouts with a conditional atomic `updateMany` guarded by `quantity: { gte: scoutCount }` inside a `Serializable` transaction; a `count !== 1` result rolls back and returns typed `NOT_ENOUGH_SCOUTS`.
- The created row is `orderType: "SCOUT"`, `status: "IN_TRANSIT"`, `unitsJson: [{ unitType: "SCOUTS", quantity: N }]`, with `returnAt` / `parentOrderId` / `resolvedAt` / `cancelledAt` null.
- No report is written at dispatch, no return leg is created, and nothing resolves on arrival. No alliance check and no `SCOUT_ORDER_MAX_SCOUTS` cap exist, both deliberately.
- Web tests grew 120/120 -> 146/146 with 26 new tests; game tests grew 78/78 -> 103/103 with 25 new tests.

## Files Changed Recently

Code agent files (this task):

- `packages/game/src/movement/scout-report.ts` (new)
- `packages/game/src/movement/scout-report.test.ts` (new)
- `packages/game/src/index.ts`
- `workers/tick-worker/src/movement-arrival.ts` (new)
- `workers/tick-worker/src/movement-arrival.test.ts` (new)
- `workers/tick-worker/src/run-one-tick.ts`
- `workers/tick-worker/src/tick-log.ts`
- `apps/web/src/lib/kingdom/scout-report-display.ts` (new)
- `apps/web/src/lib/kingdom/scout-report-display.test.ts` (new)
- `apps/web/src/lib/kingdom/dashboard-data.ts`
- `apps/web/src/components/kingdom/KingdomPagePanels.tsx`
- `apps/web/src/app/reports/page.tsx`
- `apps/web/src/app/army/page.tsx`

Documentation/tracking files (this batch):

- `docs/sprints/SPRINT_05_COMBAT_SCOUTING.md`
- `docs/04_DATA_MODEL.md`
- `docs/03_TECH_ARCHITECTURE.md`
- `docs/TESTING_STRATEGY.md`
- `docs/DECISIONS_LOG.md`
- `tasks/sprint_05.md`
- `tasks/backlog.md`
- `CHANGELOG.md`
- `session_state.md`
- `context.md`

## Commands Run

Final verification for this task, run by the session owner against the merged code and recorded here:

- `apps\web` `tsc --noEmit` (passed), `apps\web` `eslint` (passed), `apps\web` `next build` (passed)
- `npm --prefix apps/web run test` (157/157), `npm run game:test` (123/123), `npm run tick:test` (23/23)
- `npm run game:typecheck` (passed), `npm run tick:typecheck` (passed)
- `npm run db:validate` (passed; schema unchanged by S5-004, no new migration)
- `git --no-pager diff --stat` to confirm this batch touched only its owned documentation files

## Test And Check Status

- Web typecheck, lint, build: passed. Web test: 157/157 passed (was 146/146).
- Game test: 123/123 passed (was 103/103). Game typecheck: passed. Tick test: 23/23 passed (was 8/8). Tick typecheck: passed.
- `db:validate`: passed with a dummy `DATABASE_URL`. No Prisma schema change and no new migration in S5-004.
- New tests: band boundaries on both sides of every threshold, the land-band coarsening and its 10,000 m2 floor, the no-leak property of the report body, determinism of the approximation, hostile-input normalization, full arrival resolution, pass ordering (return before scout arrival), idempotency on a second pass, no duplicate return leg, per-order warning isolation, the missing-target path, the failed-report-still-returns path, negative-garrison safety from a bad manifest, exact counters for a mixed tick, and display parsing of shared labels plus hostile body shapes.

## Manual Smoke Status

- None. NO live PostgreSQL/PostGIS database was available, so migration `000008_movement_orders` was not applied and no real order row, report row, or return leg was written. NO browser session was opened, so neither `/army`, `/reports`, nor the `ReportsPanel` scout rendering was ever rendered or clicked. Migration `000008_movement_orders` still has never been applied to a real database, and the ENTIRE arrival path is unverified against real rows.

## Tracker Updates

- Marked S5-004 complete in `tasks/sprint_05.md` and `tasks/backlog.md`, and added an S5-004 status note to both.
- Ticked `Scout reports are approximate` in `tasks/sprint_05.md`, alongside the already-ticked `Movement uses distance-based travel time`. `Protected kingdoms cannot be attacked or scouted` stays unchecked because the combined criterion also requires attacks, which do not exist.
- Ticked `Scout report is created on arrival` and `Scout report shows approximate information` in the sprint doc. Everything about attacking, battles, defender bonuses, siege, alliances, war land capture, and battle reports remains unchecked.
- Added an `### S5-004 - Approximate scout reports (complete)` subsection and rewrote `### Remaining` in the sprint doc.
- Added new dated sections to `CHANGELOG.md` and `docs/DECISIONS_LOG.md`, and a live `MovementOrder` lifecycle plus `SCOUT` report body shape to `docs/04_DATA_MODEL.md`.

## Known Issues

- The arrival path has NEVER been exercised against a real database. Migration `000008_movement_orders` is still unapplied to a live PostgreSQL/PostGIS database, so the reservation decrement, the arrival scan, the `UnitStack` upsert, the report write, and the return-leg insert are all verified only against a hand-rolled fake transaction client.
- `ReportsPanel` scout rendering and the `/army` and `/reports` copy have zero automated UI coverage. The repo has no component test runner.
- All scout band thresholds and `MOVEMENT_BASE_METERS_PER_TICK` remain unretuned v0.1 balance placeholders.
- `ARRIVED`, `RETURNING`, and `CANCELLED` `MovementOrder` statuses remain unused. S5-004 resolves straight to `RESOLVED` and closes the return leg straight to `COMPLETED`.
- Attack orders, the battle formula, defender bonuses, the siege requirement, war land capture, and battle reports do not exist yet (S5-005 through S5-010). No `Battle` or `WarLandCapture` model exists.
- No alliance check exists and cannot exist until Sprint 6 adds the `Alliance` schema.
- `prisma migrate diff` still emits no SQL in this toolchain; migrations are hand-written from the validated schema.
- Previously deferred foundation items remain open: tick STARTED lease/retry, per-kingdom isolation, login rate-limit, session revocation, Google PKCE, polygon water checks, visible-border expansion, and the Sprint 6 Alliance schema.

## Open Questions

- Should `unitsJson` stay an opaque JSON payload in v0.1, or become a normalized `MovementOrderUnit` child table once battle reporting needs per-unit-type queries? S5-004 reads it defensively and drops malformed entries, but that parsing layer would be duplicated or removed by a child table.
- Should the base travel pace stay linear in distance, or gain a long-distance compression curve so cross-world orders are less punishing?

## Next Recommended Task

- Start S5-005 attack order validation. It should reuse the S5-003 validator pattern: extend or add an attack-specific validator in `packages/game`, add a server-side `createAttackOrderForUser` mutation in `apps/web`, a bounded attack target read model, and an `/army` attack panel. It needs the same beginner-protection gate on the target, and it must reserve a MIXED army manifest rather than the scouts-only manifest S5-003 writes. S5-004's arrival pass already handles `SCOUT` and `RETURN`; an `ATTACK` order arriving needs a third branch, so decide early whether S5-005 or S5-006 owns the attack-arrival resolution.
- Carry forward the still-open questions: `unitsJson` as opaque JSON versus a normalized child table, and whether travel pace should stay linear or gain compression.
- Carry forward the still-open foundation-hardening items: tick STARTED lease/retry, per-kingdom isolation, login rate-limit, session revocation, Google PKCE, polygon water checks, visible-border expansion, and the Sprint 6 Alliance schema.
- Before starting S5-005, commit S5-004 on `sprint-5-movement-scouting` so the movement round trip has a reviewable checkpoint.
