# Sprint 5 - Movement + Scouting + Combat

## Goal

Players can scout and attack non-protected enemy kingdoms with distance-based travel, basic battle resolution, and reports.

## Scope

- Army movement orders.
- Distance-based travel time.
- Scout orders.
- Approximate scout reports.
- Attack orders.
- Basic battle formula.
- Defender bonuses.
- Siege requirement.
- War land capture limit.
- Battle reports.

## Combat Rules

- Protected kingdoms cannot attack players.
- Protected kingdoms cannot be attacked.
- Protected kingdoms cannot be scouted by players.
- Alliance members cannot attack each other.
- Global attacks are allowed but far attacks are slow and expensive.
- Defenders get bonuses from Wall, Watchtower, Defensive District, Defense tech, and garrisoned units.
- Siege is required to seriously damage high-level walls.

## Battle Formula

```text
Attacker Power = unit attack * count * military tech bonuses
Defender Power = unit defense * count * wall/watchtower/defensive district/defense tech/garrison bonuses
```

## War Land Capture

- Winner can gain 1,000 m2 usable land credit from the same enemy once per 30 days.
- Loser loses 1,000 m2 usable land credit when capture applies.
- Do not reduce a kingdom below a safe minimum once that minimum is defined.

## Out Of Scope

- Advanced tactics.
- Formations.
- Heroes/generals.
- Morale.
- Supply lines.
- Multi-army battles.
- Alliance war coordination.

## Acceptance Criteria

- [x] Player can send scout order to valid target.
- [x] Scout order uses distance-based travel time.
- [x] Scout report is created on arrival.
- [x] Scout report shows approximate information.
- [x] Protected kingdoms cannot be scouted.
- [x] Player can send attack order to valid target.
- [x] Attack order uses distance-based travel time.
- [x] Protected kingdoms cannot be attacked.
- [ ] Alliance members cannot be attacked.
- [ ] Battle resolves with simple power formula.
- [ ] Defender bonuses are applied.
- [ ] Siege requirement works for high-level walls.
- [ ] War land capture limit is enforced per enemy per 30 days.
- [ ] Battle report is created.

## Implementation Status

### S5-001 - Movement order model (complete)

- `MovementOrder` model with `MovementOrderType` (`SCOUT`, `ATTACK`, `RETURN`) and `MovementOrderStatus` (`IN_TRANSIT`, `ARRIVED`, `RESOLVED`, `RETURNING`, `COMPLETED`, `CANCELLED`) enums.
- Migration `000008_movement_orders`, hand-written because `prisma migrate diff` emits no SQL in this toolchain.
- Two named `Kingdom` relations plus `Kingdom.outgoingMovementOrders` / `Kingdom.incomingMovementOrders`.
- A return leg is a separate `MovementOrder` row with `orderType = RETURN`, linked by a unique nullable `parentOrderId` using `onDelete: SetNull`.
- Indexes cover per-kingdom order reads and the future pending-arrival worker scan (`status` + `arrivalAt`).
- The status lifecycle is stored and now partly driven by code: S5-003 writes `IN_TRANSIT` at dispatch and S5-004 drives `RESOLVED`, `COMPLETED`, and the `RETURN` leg. `ARRIVED`, `RETURNING`, and `CANCELLED` remain unused and arrive with S5-005 through S5-010.

### S5-002 - Distance-based travel time (complete)

- Shared great-circle math lives in `packages/game/src/map/distance.ts`; `apps/web/src/lib/kingdom/location-validation.ts` now delegates to it instead of duplicating haversine.
- `packages/game/src/movement/travel-time.ts` provides order/unit type guards, `calculateMovementDistanceMeters`, `getMovementSpeedMetersPerTick`, `calculateTravelTime`, and `getMovementArrivalAt` / `getMovementReturnAt`.
- An order travels at the pace of its slowest recognized unit; unknown or empty unit lists fall back to `INFANTRY` pace.
- Travel time is whole 10-minute ticks with a 1-tick minimum, and distance is stored in whole meters.
- `MOVEMENT_BASE_METERS_PER_TICK` is a v0.1 balance placeholder, not a locked decision. It is compressed relative to real-world marching speed so a half-world order takes a couple of days rather than a couple of weeks, while far targets stay clearly slower than near ones. It should be retuned against playtest data.
- Covered by 19 new tests; game tests grew 59/59 -> 78/78 at that point, and `npm run game:test` is 123/123 after S5-004.

### S5-003 - Scout order validation (complete)

- `packages/game/src/movement/scout-order-validation.ts` adds `validateScoutOrder`, the single source of truth for "may this kingdom scout this target right now". Both the mutation (`apps/web/src/lib/kingdom/scout-orders.ts`) and the target read model (`apps/web/src/lib/kingdom/scout-target-options.ts`) call it, so the dropdown's disabled state can never disagree with what the mutation accepts.
- Rules run in a fixed order so the returned reason is stable and the earliest blocking rule wins: `INVALID_TARGET`, `SELF_TARGET`, `TARGET_NOT_FOUND`, `TARGET_PROTECTED`, `INVALID_SCOUT_COUNT`, `NOT_ENOUGH_SCOUTS`, else success. On success the validator returns the server-computed `distanceM`, `travelTicks`, and `arrivalAt` by reusing the S5-002 movement formulas with a scouts-only unit list.
- Beginner protection is active only while `protectionEndsAt > now` strictly, so a timestamp exactly equal to `now` is already expired and allowed. That boundary is pinned by tests.
- Protection gates the TARGET only. A beginner-protected source kingdom may still scout an unprotected target, because `docs/01_LOCKED_DECISIONS.md` keeps protected kingdoms able to "build/train/buy land/prepare" and preparing includes sending scouts. This is also pinned by a test.
- The mutation `createScoutOrderForUser` returns `UNAUTHENTICATED` and a blank-target `INVALID_TARGET` before opening any transaction, then runs the rest inside a `Serializable` Prisma transaction with a 30-second timeout.
- Scouts are reserved by a conditional atomic `updateMany` on the `SCOUTS`/`GARRISON` `UnitStack` guarded by `quantity: { gte: scoutCount }`. A `count !== 1` result throws an internal `KnownScoutOrderError` with reason `NOT_ENOUGH_SCOUTS`, so the transaction rolls back and the caller still receives a typed reason instead of a generic failure.
- The created `MovementOrder` row uses `orderType: "SCOUT"`, `status: "IN_TRANSIT"`, and `unitsJson: [{ unitType: "SCOUTS", quantity: N }]`. `returnAt`, `parentOrderId`, `resolvedAt`, and `cancelledAt` are all null at creation.
- The target read model is bounded by `SCOUT_TARGET_OPTION_LIMIT = 10`, excludes the caller's own kingdom in the query, orders deterministically by `createdAt` asc, and evaluates each option at `SCOUT_ORDER_MIN_SCOUTS` — the smallest dispatch the UI can produce, with the mutation re-validating against the count actually chosen.
- The `/army` surface renders `ScoutOrderPanel`, which submits through a Server Action and revalidates `/army` and `/dashboard` on success. At the time of S5-003 the page copy stated that orders are recorded on dispatch and that nothing resolves yet; S5-004 rewrote that copy because arrival handling now exists.
- 25 validator tests in `packages/game`, 15 mutation tests and 11 read-model tests in `apps/web` (146 web tests at the close of S5-003; 157 after S5-004).

### S5-004 - Approximate scout reports (complete)

- `packages/game/src/movement/scout-report.ts` holds the whole approximation contract. `approximateScoutObservation` reduces exact observed enemy state to coarse bands, `buildScoutReportBody` is the only place those bands become a `Report.bodyJson` payload, and `SCOUT_BAND_LABELS` is the single source of truth for player-facing band wording on every surface.
- Bands: army `SMALL` / `MEDIUM` / `LARGE` below 50 and below 200 garrison units; food `LOW` / `MEDIUM` / `HIGH` below 1,000 and below 5,000; wall `NONE` / `LOW` / `MEDIUM` / `HIGH` from the highest `WALL` building level (`<= 0`, `<= 1`, `<= 3`, otherwise); defence `WEAK` / `NORMAL` / `STRONG` from the combined score `wallLevel * 3 + watchtowerLevel * 2 + floor(defensiveDistrictLandM2 / 2000)`, cut at 6 and 16. Land is coarsened to the nearest 10,000 m2 with a 10,000 m2 floor.
- The approximation is APPROXIMATE BY DESIGN and deliberately leaks NO exact enemy value: no exact unit counts, no exact Food, no exact land, no building levels. Only the coarse bands and the coarse land figure are written. A test asserts the exact input garrison count, Food stockpile, defensive district land, wall level, and usable land are all absent from the serialized report body.
- Collapsing wall, watchtower, and defensive district into one `WEAK` / `NORMAL` / `STRONG` label is intentional rather than a shortcut. Three fortifications that mean very different things collapse into one number, so a scout cannot read an exact defence, cannot tell which single fortification is strong, and cannot solve for one input from the others.
- `approximateScoutObservation` is fully deterministic: no `Math.random()`, no `Date.now()`, no clock reads, no external state. A tick can be retried, and a report must not change on replay. Pinned by tests.
- Every threshold above is a v0.1 BALANCE PLACEHOLDER, not a locked decision, and is expected to be retuned against real playtest data. That is the same status as `MOVEMENT_BASE_METERS_PER_TICK` from S5-002.
- The tick worker now resolves the movement-arrival pass inside the existing `prisma.$transaction` (30-second timeout) via `processMovementArrivals` in `workers/tick-worker/src/movement-arrival.ts`, as TWO ORDERED PASSES. The call sits at the START of the transaction, BEFORE the per-kingdom loop. PASS 1 completes `RETURN` legs that reached `arrivalAt`, upsert-incrementing the source garrison `UnitStack` and setting the order `COMPLETED` with `returnAt`. PASS 2 then handles arriving `SCOUT` orders, writing the `SCOUT` `Report` on the SOURCE kingdom, setting the outbound order `RESOLVED` with `resolvedAt`, and creating the `RETURN` leg. The ordering is load-bearing so a unit coming home this tick is back in its garrison before the economy loop reads army totals.
- `resolvedAt`, `returnAt`, and `parentOrderId` are now actually written; they were documented as null-at-creation. The return leg REUSES the outbound order's own `travelTicks` rather than recomputing it, so the trip home is symmetric, and its `arrivalAt` is `getMovementReturnAt(now, travelTicks)`.
- Failure isolation is per order. Each order is processed in its own `try`/`catch` and failures become `warnings` on `MovementArrivalSummary`, so one poisoned movement order cannot abort the whole tick or take other arrivals down with it. A failed report write still resolves the order and still creates the return leg, and a vanished target kingdom also still returns the scouts, because losing scouts off-map is far worse than losing one report. No arrival is left stuck `IN_TRANSIT` past its `arrivalAt`.
- Malformed `unitsJson` entries — zero, negative, fractional, `NaN`, unknown unit type — are dropped and counted rather than written through, which is what guarantees a bad manifest can never drive a garrison below zero.
- `parentOrderId` is UNIQUE, so return-leg creation is single-shot by schema. The worker also checks for an existing return leg first, so re-runs are no-ops rather than a unique-constraint crash.
- `apps/web/src/lib/kingdom/scout-report-display.ts` parses the untyped `bodyJson` defensively and never throws: a missing, non-object, or out-of-union band degrades to a title-only report row instead of crashing a page. `ReportsPanel` renders the target name, the four band rows, and the coarse land figure prefixed with `≈` so it can never read as a precise measurement.
- Reports appear on the NEXT TICK after arrival, not instantly. The `/army` and `/reports` copy was rewritten to say exactly that, without promising instant results and without implying attack or battle functionality exists.
- 20 tests in `packages/game/src/movement/scout-report.test.ts` (band boundaries, the no-leak property, determinism, hostile-input normalization), 15 in `workers/tick-worker/src/movement-arrival.test.ts` (arrival resolution, pass ordering, idempotency, warning isolation, missing target, non-negative garrisons), and 11 in `apps/web/src/lib/kingdom/scout-report-display.test.ts` (shared-label rendering and hostile body shapes).

### S5-005 - Attack order validation (complete)

**A dispatched attack currently has NO EFFECT.** S5-005 is the dispatch half only. The order is written and the army is reserved, but nothing happens at the target: no battle is fought, no casualties are dealt, no land is captured, and no battle report is written. Nothing in this section may be read as implying an attack resolves.

- The four target-eligibility rules that S5-003 inlined in the scout validator (`INVALID_TARGET`, `SELF_TARGET`, `TARGET_NOT_FOUND`, `TARGET_PROTECTED`) now live ONCE in `packages/game/src/movement/target-eligibility.ts` as `validateMovementTarget`, and both `validateScoutOrder` and `validateAttackOrder` delegate to them. The extraction removes a real drift hazard: the protection boundary is `protectionEndsAt > now` STRICTLY, so a timestamp exactly equal to `now` has already expired. Two independent copies of that comparison would eventually disagree, and a drift there is a genuine gameplay and security bug rather than a cosmetic inconsistency. All 25 pre-existing scout tests pass unchanged, which is what evidences that the refactor was behaviour-preserving.
- `isKingdomUnderBeginnerProtection` is now DEFINED in `target-eligibility.ts` rather than imported from the scout validator. S5-003 defined it in `scout-order-validation.ts`, and the first pass of this task had the shared module import it back from there — a circular dependency between the shared base and one of its consumers. It happened to work only because the call occurred at call time rather than module-evaluation time, which is a bundling-order hazard rather than a safe design. Moving the implementation into the shared module makes the dependency one-way: both validators depend on `target-eligibility`, and nothing imports the scout module except its test. A backwards-compatible re-export stays in `scout-order-validation.ts`.
- `packages/game/src/movement/attack-order-validation.ts` adds `validateAttackOrder`, the single source of truth for "may this kingdom send this army against that target right now". Rules run in a fixed order so the returned reason is stable and the earliest blocking rule wins: the four shared target reasons, then `INVALID_ARMY` (empty manifest), `INVALID_UNIT_TYPE` (unrecognized unit type), `INVALID_ARMY` (quantity is not a positive whole number), `INSUFFICIENT_UNITS` (garrison cannot cover the aggregated request), else success. On success it returns the normalized manifest, `totalUnits`, `slowestUnitType`, `distanceM`, `travelTicks`, and `arrivalAt` from the shared movement formulas, so the mutation never recomputes movement math a second way.
- An attack army is MIXED and may carry several unit types, unlike the scouts-only scout manifest. Because of that, the mutation loads every `GARRISON` unit stack rather than selecting a single stack the way the scout mutation does; selecting one would make a legal mixed manifest fail against a garrison the kingdom actually holds.
- An UNRECOGNIZED unit type is rejected outright with `INVALID_UNIT_TYPE` rather than dropped. Silently discarding a bad entry would shrink the attacker's declared army without telling anyone, so the order would arrive with fewer units than the player asked for and the stored manifest would disagree with what was validated. A non-object entry is treated the same way.
- Duplicate manifest entries for the same unit type are AGGREGATED against supply rather than each checked independently. Checking each entry independently would let a client split one request into two halves that each fit the garrison and together exceed it — 60 + 60 `INFANTRY` against a garrison of 100 would pass and then drive the garrison negative at reservation time. The garrison side is aggregated defensively too, with a non-finite, negative, or fractional quantity contributing zero rather than propagating `NaN` into the comparison.
- Multi-unit reservation is ALL-OR-NOTHING. Every unit type gets its own conditional atomic `updateMany` guarded by `quantity: { gte }`, and if any single one matches zero rows the transaction throws and rolls back entirely, so an attacker never loses some units and gains no order. A read-then-write guard would let two concurrent attacks both pass validation and both spend the same units. The rollback is tested both for a LATER unit type failing its conditional update and for the FIRST one failing, with the test fake snapshotting writable state to model real transaction behaviour. A single-unit-type attack needs only one guarded update and remains as safe as the S5-003 scout reservation.
- The manifest is re-validated and re-normalized against database state inside the transaction, and `unitsJson` stores the NORMALIZED manifest returned by the validator, never the raw client payload. The manifest is deliberately not merged in the validator: request order is preserved and duplicate entries stay separate, so the normalized stored form stays comparable to what the player composed. Reservation aggregates separately, because a client that splits one unit type into 60 + 60 must still be reserved against a single 120-unit requirement.
- Travel speed uses the existing "an order moves at the pace of its slowest unit" rule, so a mixed army is paced by its heaviest unit and a manifest containing `SIEGE` travels far slower than one of only `SCOUTS` at the same distance. The UI deliberately does not re-derive this: it shows totals only and lets the server report the slowest unit type, travel time, and arrival.
- Beginner protection gates the TARGET only; a protected SOURCE kingdom may still attack an unprotected target. This matches the S5-003 locked-decision reading that a protected kingdom keeps build/train/buy land/prepare, and preparation includes sending an army out. Both halves are pinned by tests.
- `createAttackOrderForUser` returns `UNAUTHENTICATED` and a blank-target `INVALID_TARGET` before opening any transaction, then runs the rest inside a `Serializable` Prisma transaction with a 30-second timeout. An unknown target is reported THROUGH the shared validator rather than a bespoke error path, so the read model and the mutation cannot disagree about the outcome.
- The created `MovementOrder` row uses `orderType: "ATTACK"`, `status: "IN_TRANSIT"`, the normalized manifest in `unitsJson`, and server-computed `distanceM` / `travelTicks` / `departureAt` / `arrivalAt`. `returnAt`, `parentOrderId`, `resolvedAt`, and `cancelledAt` are all null: there is no return leg and no resolution at dispatch time, because the arrival branch for an `ATTACK` order does not exist yet. The reserved units stay decremented while the order is in transit.
- The attack read model in `apps/web/src/lib/kingdom/attack-target-options.ts` is bounded by `ATTACK_TARGET_OPTION_LIMIT = 10`, excludes the caller's own kingdom in the query, and orders deterministically by `createdAt` asc. Each option runs the SAME `validateAttackOrder` the mutation runs, so the UI can never offer a target the mutation rejects. When the caller has no army at all, every target is marked un-targetable with `INSUFFICIENT_UNITS` rather than a misleading `INVALID_ARMY`, and a target-specific reason still wins over it so the player can see why a specific kingdom is closed.
- The `/army` surface renders `AttackOrderPanel`, which composes a mixed army from one numeric field per unit type and submits through a Server Action, revalidating `/army` and `/dashboard` on success. Blank, zero, negative, and fractional field values are dropped client-side, but a fully empty manifest is still submitted so the SERVER rejects it with `INVALID_ARMY` — the client never short-circuits that rule, because the server must remain the authority. The panel's labels come from the shared validator's own failure reasons, and un-attackable kingdoms stay visible in the dropdown with the reason shown, so a player can see that the kingdom exists and why it cannot be attacked. The panel copy states plainly that a dispatched attack has no effect yet.
- DELIBERATELY ABSENT: no alliance check (Sprint 6 has no `Alliance` schema, so "alliance members cannot attack each other" still cannot be enforced and this remains a live locked-rule gap), no minimum or maximum army-size rule (one unit is a legal attack; a bound is a balance decision, deferred exactly as `SCOUT_ORDER_MAX_SCOUTS` was in S5-003), no battle resolution, no defender bonuses, no siege, no war land capture, and no battle report.
- 30 tests in `packages/game/src/movement/attack-order-validation.test.ts` (123 -> 153 game tests), 24 in `apps/web/src/lib/kingdom/attack-orders.test.ts` and 20 in `apps/web/src/lib/kingdom/attack-target-options.test.ts` (157 -> 201 web tests). `npm run tick:test` is unchanged at 23/23 because S5-005 adds no worker code.

### Remaining


- Attack DISPATCH now exists: a player can pick a valid target, compose a mixed army, and the server validates it, reserves the units, and writes an `ATTACK` `MovementOrder` in `IN_TRANSIT`.
- A dispatched attack has NO EFFECT. The order sits in transit. No battle is fought, no casualties are dealt, no land is captured, and no battle report is written. The tick worker still has no `ATTACK` arrival branch. Battle resolution is S5-006, defender bonuses S5-007, siege S5-008, war land capture S5-009, and the battle report S5-010.
- Arrival handling for scout orders is code-complete: a dispatched scout order resolves on arrival, writes a `SCOUT` `Report` on the source kingdom, and gets a `RETURN` leg that brings the scouts home. The scout round trip works; the attack round trip does not exist yet.
- The whole movement path is still UNVERIFIED against a real database. No live PostgreSQL/PostGIS database was available for S5-003, S5-004, or S5-005, no browser session was opened, and migration `000008_movement_orders` still has never been applied to a real database. Dispatch and arrival are covered only by unit tests against hand-rolled fake clients.
- The alliance-dependent rule "alliance members cannot attack each other" still cannot be enforced: Sprint 6 has no `Alliance` schema, so there is nothing authoritative to check. Both validators document that the check belongs as one extra rule after the protection rule and before the army and supply rules, addable later without rewriting either validator or its callers.
- No `SCOUT_ORDER_MAX_SCOUTS` cap and no attack army-size minimum or maximum exist. Only correctness floors are enforced: a scout order needs at least one scout, an attack needs a non-empty manifest of whole units. An upper bound is a balance decision and is deliberately deferred.
- The repo has no component test runner, so `ScoutOrderPanel`, `AttackOrderPanel`, and the `ReportsPanel` scout rendering have zero automated UI coverage.
- All scout band thresholds and `MOVEMENT_BASE_METERS_PER_TICK` remain unretuned v0.1 balance placeholders.
