# Sprint 5 Tasks - Movement + Scouting + Combat

## Goal

Players can scout and attack valid targets with distance-based travel and reports.

## Tasks

- [x] S5-001: Add movement order model.
- [x] S5-002: Implement distance-based travel time formula.
- [x] S5-003: Implement scout order validation.
- [ ] S5-004: Implement approximate scout reports.
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
- [ ] Scout reports are approximate.
- [ ] Battles resolve with the simple formula.
- [ ] Defender bonuses and siege rules are applied.
- [ ] Battle reports are created.

## Status Notes

- S5-003 (complete): added the shared scout order validator in `packages/game/src/movement/scout-order-validation.ts`, the server-side order-creation mutation in `apps/web/src/lib/kingdom/scout-orders.ts`, the bounded scout target read model in `apps/web/src/lib/kingdom/scout-target-options.ts`, and the `/army` `ScoutOrderPanel` UI. A dispatch reserves `SCOUTS` from the `SCOUTS`/`GARRISON` `UnitStack` with a conditional atomic decrement and writes a `MovementOrder` row with `orderType: "SCOUT"` and `status: "IN_TRANSIT"`.
- S5-003 deliberately did NOT ship arrival resolution. No `Report` row is written at dispatch, nothing transitions the order past `IN_TRANSIT`, no return leg is created, and the tick worker still has no movement processing. `Scout report is created on arrival` and `Scout report shows approximate information` stay unchecked until S5-004 lands.
- "Protected kingdoms cannot be attacked or scouted" stays unchecked even though the scouting half is now enforced. Scout validation rejects `TARGET_PROTECTED` for a beginner-protected target, but no attack orders exist at all yet, so the combined criterion is not satisfied.
- "Movement uses distance-based travel time" is ticked: scout dispatch computes `distanceM` / `travelTicks` / `arrivalAt` through the shared `packages/game` distance and travel-time formulas and stores them server-side.
- No live database smoke and no browser smoke were performed for S5-003. Migration `000008_movement_orders` still has never been applied to a real PostgreSQL/PostGIS database, and the repo has no component test runner, so `ScoutOrderPanel` has zero automated UI coverage.
