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
- [ ] Scout report is created on arrival.
- [ ] Scout report shows approximate information.
- [x] Protected kingdoms cannot be scouted.
- [ ] Player can send attack order to valid target.
- [ ] Attack order uses distance-based travel time.
- [ ] Protected kingdoms cannot be attacked.
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
- The status lifecycle is stored but not yet driven by any code; transitions arrive with S5-003 through S5-010.

### S5-002 - Distance-based travel time (complete)

- Shared great-circle math lives in `packages/game/src/map/distance.ts`; `apps/web/src/lib/kingdom/location-validation.ts` now delegates to it instead of duplicating haversine.
- `packages/game/src/movement/travel-time.ts` provides order/unit type guards, `calculateMovementDistanceMeters`, `getMovementSpeedMetersPerTick`, `calculateTravelTime`, and `getMovementArrivalAt` / `getMovementReturnAt`.
- An order travels at the pace of its slowest recognized unit; unknown or empty unit lists fall back to `INFANTRY` pace.
- Travel time is whole 10-minute ticks with a 1-tick minimum, and distance is stored in whole meters.
- `MOVEMENT_BASE_METERS_PER_TICK` is a v0.1 balance placeholder, not a locked decision. It is compressed relative to real-world marching speed so a half-world order takes a couple of days rather than a couple of weeks, while far targets stay clearly slower than near ones. It should be retuned against playtest data.
- Covered by 19 new tests; `npm run game:test` is 78/78.

### S5-003 - Scout order validation (complete)

- `packages/game/src/movement/scout-order-validation.ts` adds `validateScoutOrder`, the single source of truth for "may this kingdom scout this target right now". Both the mutation (`apps/web/src/lib/kingdom/scout-orders.ts`) and the target read model (`apps/web/src/lib/kingdom/scout-target-options.ts`) call it, so the dropdown's disabled state can never disagree with what the mutation accepts.
- Rules run in a fixed order so the returned reason is stable and the earliest blocking rule wins: `INVALID_TARGET`, `SELF_TARGET`, `TARGET_NOT_FOUND`, `TARGET_PROTECTED`, `INVALID_SCOUT_COUNT`, `NOT_ENOUGH_SCOUTS`, else success. On success the validator returns the server-computed `distanceM`, `travelTicks`, and `arrivalAt` by reusing the S5-002 movement formulas with a scouts-only unit list.
- Beginner protection is active only while `protectionEndsAt > now` strictly, so a timestamp exactly equal to `now` is already expired and allowed. That boundary is pinned by tests.
- Protection gates the TARGET only. A beginner-protected source kingdom may still scout an unprotected target, because `docs/01_LOCKED_DECISIONS.md` keeps protected kingdoms able to "build/train/buy land/prepare" and preparing includes sending scouts. This is also pinned by a test.
- The mutation `createScoutOrderForUser` returns `UNAUTHENTICATED` and a blank-target `INVALID_TARGET` before opening any transaction, then runs the rest inside a `Serializable` Prisma transaction with a 30-second timeout.
- Scouts are reserved by a conditional atomic `updateMany` on the `SCOUTS`/`GARRISON` `UnitStack` guarded by `quantity: { gte: scoutCount }`. A `count !== 1` result throws an internal `KnownScoutOrderError` with reason `NOT_ENOUGH_SCOUTS`, so the transaction rolls back and the caller still receives a typed reason instead of a generic failure.
- The created `MovementOrder` row uses `orderType: "SCOUT"`, `status: "IN_TRANSIT"`, and `unitsJson: [{ unitType: "SCOUTS", quantity: N }]`. `returnAt`, `parentOrderId`, `resolvedAt`, and `cancelledAt` are all null at creation.
- The target read model is bounded by `SCOUT_TARGET_OPTION_LIMIT = 10`, excludes the caller's own kingdom in the query, orders deterministically by `createdAt` asc, and evaluates each option at `SCOUT_ORDER_MIN_SCOUTS` — the smallest dispatch the UI can produce, with the mutation re-validating against the count actually chosen.
- The `/army` surface renders `ScoutOrderPanel`, which submits through a Server Action and revalidates `/army` and `/dashboard` on success. The page copy states plainly that orders are recorded on dispatch and that nothing resolves yet.
- 25 validator tests in `packages/game`, 15 mutation tests and 11 read-model tests in `apps/web`.

### Remaining

- A dispatched scout order does NOT resolve. It stays `IN_TRANSIT` with no report, no return leg, no status transition, and no tick-worker movement processing. That is S5-004 work, so `Scout report is created on arrival` and `Scout report shows approximate information` remain unchecked.
- No attack order, battle formula, defender bonus, siege rule, war land capture, or battle report exists yet. S5-004 through S5-010 are untouched.
- The alliance-dependent rule "alliance members cannot attack each other" still cannot be enforced: Sprint 6 has no `Alliance` schema, so there is nothing authoritative to check. The validator documents that the check belongs as one extra rule between the protection rule and the scout-count rule, addable later without rewriting the validator or its callers.
- No `SCOUT_ORDER_MAX_SCOUTS` cap exists. Only the `SCOUT_ORDER_MIN_SCOUTS` correctness floor is enforced; an upper bound is a balance decision and is deliberately deferred.
- No live database or browser smoke was performed for S5-003, and `000008_movement_orders` still has never been applied to a real PostgreSQL/PostGIS database.
- The repo has no component test runner, so `ScoutOrderPanel` has zero automated UI coverage.
