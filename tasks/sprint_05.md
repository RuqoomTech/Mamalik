# Sprint 5 Tasks - Movement + Scouting + Combat

## Goal

Players can scout and attack valid targets with distance-based travel and reports.

## Tasks

- [x] S5-001: Add movement order model.
- [x] S5-002: Implement distance-based travel time formula.
- [x] S5-003: Implement scout order validation.
- [x] S5-004: Implement approximate scout reports.
- [ ] S5-005: Implement attack order validation.
- [ ] S5-006: Implement basic battle formula.
- [ ] S5-007: Implement defender bonuses.
- [ ] S5-008: Implement siege requirement.
- [ ] S5-009: Implement war land capture limit.
- [ ] S5-010: Create battle reports.

## Acceptance Criteria

- [ ] Protected kingdoms cannot be attacked or scouted.
- [ ] Alliance members cannot attack each other.
- [x] Movement uses distance-based travel time.
- [x] Scout reports are approximate.
- [ ] Battles resolve with the simple formula.
- [ ] Defender bonuses and siege rules are applied.
- [ ] Battle reports are created.

## Status Notes

- S5-003 (complete): added the shared scout order validator in `packages/game/src/movement/scout-order-validation.ts`, the server-side order-creation mutation in `apps/web/src/lib/kingdom/scout-orders.ts`, the bounded scout target read model in `apps/web/src/lib/kingdom/scout-target-options.ts`, and the `/army` `ScoutOrderPanel` UI. A dispatch reserves `SCOUTS` from the `SCOUTS`/`GARRISON` `UnitStack` with a conditional atomic decrement and writes a `MovementOrder` row with `orderType: "SCOUT"` and `status: "IN_TRANSIT"`.
- S5-003 deliberately did NOT ship arrival resolution. No `Report` row is written at dispatch, nothing transitions the order past `IN_TRANSIT`, no return leg is created, and the tick worker still has no movement processing. That gap is now closed by S5-004 below.
- S5-004 (complete): added the shared band approximation in `packages/game/src/movement/scout-report.ts` (`approximateScoutObservation`, `buildScoutReportBody`, `SCOUT_BAND_LABELS`), the tick-worker movement arrival pass in `workers/tick-worker/src/movement-arrival.ts` (`processMovementArrivals`), the null-safe display parser in `apps/web/src/lib/kingdom/scout-report-display.ts`, and scout report rendering in `ReportsPanel` plus the `/army` and `/reports` copy.
- The tick worker now resolves movement arrivals inside the existing `prisma.$transaction` (30s timeout), at the start of the transaction before the per-kingdom loop, as TWO ORDERED PASSES: PASS 1 completes `RETURN` legs (upsert-increment the source garrison `UnitStack`, then `COMPLETED` with `returnAt`), THEN PASS 2 handles arriving `SCOUT` orders (write the `SCOUT` `Report` on the SOURCE kingdom, set the outbound order `RESOLVED` with `resolvedAt`, create the `RETURN` leg). The ordering is load-bearing so a unit coming home this tick is back in the garrison before the economy loop reads Food consumption and army totals.
- `resolvedAt`, `returnAt`, and `parentOrderId` are now actually written. The return leg REUSES the outbound order's own `travelTicks` rather than recomputing it, so the trip home is symmetric, and its `arrivalAt` is `getMovementReturnAt(now, travelTicks)`. `parentOrderId` is UNIQUE and the worker checks for an existing leg first, so re-runs are no-ops.
- The report is APPROXIMATE BY DESIGN and deliberately leaks NO exact enemy value: no exact unit counts, no exact Food, no exact land, no building levels. Only coarse bands (army `SMALL/MEDIUM/LARGE` at 50/200 units, food `LOW/MEDIUM/HIGH` at 1,000/5,000, wall `NONE/LOW/MEDIUM/HIGH` at levels 1/3, defence `WEAK/NORMAL/STRONG` from `wallLevel*3 + watchtowerLevel*2 + floor(defensiveLandM2/2000)` cut at 6/16) plus a land band rounded to the nearest 10,000 m2 with a 10,000 m2 floor. `approximateScoutObservation` is deterministic (no `Math.random`, no clock reads) so a retried tick cannot change a report.
- Every band threshold is a v0.1 BALANCE PLACEHOLDER, not a locked decision, and needs retuning against playtest data — the same status as `MOVEMENT_BASE_METERS_PER_TICK` from S5-002.
- Failure isolation is per order: each order is processed in its own `try`/`catch` and failures become `warnings` on `MovementArrivalSummary`, so one poisoned row cannot abort the tick or lose other arrivals. A failed report write still resolves the order and still creates the return leg, and a vanished target kingdom still returns the scouts, so no arrival is ever left stuck `IN_TRANSIT` past its `arrivalAt` and no scouts are stranded off-map. Malformed `unitsJson` entries (zero, negative, fractional, `NaN`, unknown unit type) are dropped and counted rather than written through, which is what guarantees a bad manifest can never drive a garrison below zero.
- "Scout reports are approximate" is ticked. The sprint-doc criteria `Scout report is created on arrival` and `Scout report shows approximate information` are also now satisfiable and are ticked there. "Protected kingdoms cannot be attacked or scouted" stays unchecked because the combined criterion also requires attacks, which do not exist.
- Reports appear on the NEXT TICK after arrival, not instantly, and the `/army` and `/reports` copy now says so plainly.
- Still outstanding and untouched: attack orders, the battle formula, defender bonuses, the siege requirement, war land capture, and battle reports (S5-005 through S5-010). No alliance check exists because Sprint 6 still has no `Alliance` schema.
- No live database smoke and no browser smoke were performed for S5-004. Migration `000008_movement_orders` still has never been applied to a real PostgreSQL/PostGIS database, so the whole arrival path is unverified against real rows, and the repo has no component test runner, so `ReportsPanel` scout rendering is manual smoke only.
