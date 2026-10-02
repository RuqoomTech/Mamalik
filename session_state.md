# Session State

## Current Session

- Current date/time: 2026-10-02 15:00:00 +03:00
- Current sprint: Sprint 5 is active. S5-001 through S5-006 complete; S5-007 is next.
- Current sprint file: `docs/sprints/SPRINT_05_COMBAT_SCOUTING.md`
- Current task: S5-006 base battle formula complete via agents (research + plan + implement) and fully checked. Attacks now resolve with base-power casualties and survivors return; bonuses/siege/land/reports still deferred.
- Working branch: `sprint-5-movement-scouting`. S5-005 and S5-006 are UNCOMMITTED on top of prior commits. All Sprint 5 work lives on this branch, not on the default branch.

## Last Completed Task

- S5-005: added the SHARED movement target module `packages/game/src/movement/target-eligibility.ts` (`validateMovementTarget`, plus the `isKingdomUnderBeginnerProtection` implementation that moved here from the scout validator), the shared attack validator `packages/game/src/movement/attack-order-validation.ts` (`validateAttackOrder`), the dispatch mutation `apps/web/src/lib/kingdom/attack-orders.ts` (`createAttackOrderForUser`, `getCreateAttackOrderResultMessage`), the read models `apps/web/src/lib/kingdom/attack-target-options.ts` (`getAttackTargetOptionsForUser`, `getAttackArmyStacksForUser`), `AttackOrderActionState` / `createAttackOrderAction` / `createAttackOrderFormAction` in `apps/web/src/app/dashboard/actions.ts`, and `AttackOrderPanel` on `/army`.
- **A dispatched attack HAS NO EFFECT.** The order is written `orderType: "ATTACK"`, `status: "IN_TRANSIT"` and the mixed army is reserved, but nothing happens at the target: no battle, no casualties, no land capture, no battle report. The tick worker has no `ATTACK` arrival branch, no return leg is created, and the reserved units stay decremented. Battle resolution is S5-006, defender bonuses S5-007, siege S5-008, war land capture S5-009, battle report S5-010.
- The four target rules S5-003 inlined in the scout validator now live ONCE in `target-eligibility.ts` and both validators delegate to them. The reason is a real drift hazard: the protection boundary is `protectionEndsAt > now` STRICTLY, so an expiry exactly equal to `now` is already over. Two copies of that comparison would eventually disagree, and a drift there is a gameplay AND security bug. All 25 pre-existing scout tests pass UNCHANGED, which is the evidence the refactor was behaviour-preserving.
- The `isKingdomUnderBeginnerProtection` implementation MOVED into `target-eligibility.ts`. The first pass had the shared module importing it back from `scout-order-validation.ts`, a circular dependency between a shared base and one of its consumers; it happened to work only because the call occurred at call time rather than module-evaluation time, which is a bundling-order hazard. The scout validator keeps a backwards-compatible re-export. The dependency is now one-way and nothing imports the scout module except its test.
- An attack army is MIXED. An unrecognized unit type is REJECTED with `INVALID_UNIT_TYPE` rather than dropped, because dropping would silently shrink the attacker's declared army. Duplicate manifest entries are AGGREGATED against supply (60 + 60 `INFANTRY` against a garrison of 100 fails; 40 + 40 succeeds with totalUnits 80), and the garrison side clamps non-finite/negative/fractional quantities to zero rather than propagating `NaN`.
- Multi-unit reservation is ALL-OR-NOTHING: one conditional atomic `updateMany` guarded by `quantity: { gte }` per unit type, and any single miss throws so the whole transaction rolls back. An attacker never loses some units and gains no order. Tested for a LATER unit type failing and for the FIRST one failing, with the fake snapshotting writable state to model real transaction behaviour.
- The manifest is re-validated and re-normalized against database state inside the `Serializable` transaction, and `unitsJson` stores the NORMALIZED manifest, never the raw client input. Travel speed uses the existing slowest-unit rule, so a manifest containing `SIEGE` travels far slower than one of only `SCOUTS`.
- Beginner protection gates the TARGET only; a protected SOURCE kingdom may still attack an unprotected target, matching the S5-003 locked-decision reading. Pinned by tests.
- The read model runs the SAME validator as the mutation, so the UI can never offer a target the mutation rejects. A caller with no army sees every target un-targetable with `INSUFFICIENT_UNITS` rather than a misleading `INVALID_ARMY`.
- The `/army` panel composes the manifest from one numeric field per unit type and drops blank/zero/negative/fractional values, but a fully empty manifest is still submitted so the SERVER rejects it with `INVALID_ARMY` — the client never short-circuits that rule.
- DELIBERATELY ABSENT: no alliance check (Sprint 6 has no `Alliance` schema, so "alliance members cannot attack each other" is STILL unenforceable — a live locked-rule gap S5-005 does not close), no min/max army-size rule (one unit is a legal attack; deferred like `SCOUT_ORDER_MAX_SCOUTS`), and nothing from S5-006 through S5-010.
- Web tests grew 157/157 -> 201/201 with 44 new; game tests grew 123/123 -> 153/153 with 30 new; tick tests unchanged at 23/23 (S5-005 adds no worker code).

## Files Changed Recently

Code agent files (this task):

- `packages/game/src/movement/target-eligibility.ts` (new)
- `packages/game/src/movement/attack-order-validation.ts` (new)
- `packages/game/src/movement/attack-order-validation.test.ts` (new)
- `packages/game/src/movement/scout-order-validation.ts` (delegates to the shared helper; re-exports the protection helper)
- `packages/game/src/index.ts`
- `apps/web/src/lib/kingdom/attack-orders.ts` (new)
- `apps/web/src/lib/kingdom/attack-orders.test.ts` (new)
- `apps/web/src/lib/kingdom/attack-target-options.ts` (new)
- `apps/web/src/lib/kingdom/attack-target-options.test.ts` (new)
- `apps/web/src/app/dashboard/actions.ts` (additive only)
- `apps/web/src/components/kingdom/AttackOrderPanel.tsx` (new)
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

Final verification for this task, run by the S5-005 logic lead against the merged code and recorded here:

- `apps\web` `tsc --noEmit` (passed), `apps\web` `eslint` (passed)
- `npm --prefix apps/web run test` (201/201), `npm run game:test` (153/153), `npm run tick:test` (23/23)
- `npm run game:typecheck` (passed), `npm run tick:typecheck` (passed)
- `npm run db:validate` (passed; S5-005 adds no migration)
- `git --no-pager diff --stat` to confirm this batch touched only its owned documentation files

`apps\web` `next build` was NOT run for S5-005, unlike S5-003 and S5-004. That gap is recorded rather than implied as checked.

## Test And Check Status

- Web typecheck and lint: passed. Web test: 201/201 passed (was 157/157; 44 new). Web build: NOT run.
- Game test: 153/153 passed (was 123/123; 30 new). Game typecheck: passed. Tick test: 23/23 passed (unchanged). Tick typecheck: passed.
- `db:validate`: passed. No Prisma schema change and no new migration in S5-005.
- New tests: the shared-target extraction leaving all 25 scout tests green, the four delegated reasons from both consumers, `INVALID_ARMY` / `INVALID_UNIT_TYPE` / `INSUFFICIENT_UNITS` and their rule precedence, duplicate-manifest aggregation on both the request and garrison sides, mixed-army slowest-unit travel with `SIEGE` slower than `SCOUTS`, the all-or-nothing rollback when a later unit type fails its conditional update and when the first one fails, the "no transaction opened when unauthenticated" assertion, `unitsJson` holding the normalized manifest, and the read model's agreement with the validator including the no-army `INSUFFICIENT_UNITS` case.

## Manual Smoke Status

- None. NO live PostgreSQL/PostGIS database was available, so migration `000008_movement_orders` was NOT applied and no real order row, unit-stack decrement, or rollback was exercised against real data. NO browser session was opened, so neither `/army` nor `AttackOrderPanel` was ever rendered or clicked. Migration `000008_movement_orders` still has NEVER been applied to a real database, and the ENTIRE movement path — scout dispatch, arrival resolution, and now attack dispatch — is unverified against real rows.

## Tracker Updates

- Marked S5-005 complete in `tasks/sprint_05.md` and `tasks/backlog.md`, and added an S5-005 status note to both, leading with the fact that a dispatched attack has no effect. S5-006 through S5-010 remain unchecked.
- Ticked `Protected kingdoms cannot be attacked or scouted` in `tasks/sprint_05.md` because BOTH halves are genuinely enforced and pinned by tests: the scout half since S5-003 and the attack half since S5-005 (`beginner-protected targets cannot be attacked`, plus the read-model test asserting a protected target is listed but un-attackable).
- Ticked `Player can send attack order to valid target`, `Attack order uses distance-based travel time`, and `Protected kingdoms cannot be attacked` in the sprint doc. Everything about alliances, battles, defender bonuses, siege, war land capture, and battle reports remains unchecked.
- Added an `### S5-005 - Attack order validation (complete)` subsection and rewrote `### Remaining` in the sprint doc.
- Added new dated sections to `CHANGELOG.md` and `docs/DECISIONS_LOG.md`, an `ATTACK` manifest shape plus the one-way validation dependency to `docs/04_DATA_MODEL.md`, and the shared module, mutation, read model, and `/army` surface to `docs/03_TECH_ARCHITECTURE.md`.

## Known Issues

- The whole movement path has NEVER been exercised against a real database. Migration `000008_movement_orders` is still unapplied to a live PostgreSQL/PostGIS database, so the scout reservation and arrival, and now the mixed-army attack reservation, its all-or-nothing rollback, and the `ATTACK` insert, are all verified only against hand-rolled fake clients. **The accumulated live-database gap is now FIVE sprints deep and is the largest outstanding risk in the project** — S5-001 through S5-005 have all shipped movement code that has never touched real rows.
- `AttackOrderPanel`, `ScoutOrderPanel`, and the `ReportsPanel` scout rendering have zero automated UI coverage. The repo has no component test runner.
- A dispatched attack has NO EFFECT and stays that way until S5-006 onward. Reserved units remain decremented for the life of an `IN_TRANSIT` attack with nothing resolving them.
- The alliance rule "alliance members cannot attack each other" is a live locked-rule gap that remains unenforceable until Sprint 6 adds the `Alliance` schema.
- All scout band thresholds and `MOVEMENT_BASE_METERS_PER_TICK` remain unretuned v0.1 balance placeholders.
- `ARRIVED`, `RETURNING`, and `CANCELLED` `MovementOrder` statuses remain unused, and no `Battle` or `WarLandCapture` model exists.
- `prisma migrate diff` still emits no SQL in this toolchain; migrations are hand-written from the validated schema.
- Previously deferred foundation items remain open: tick STARTED lease/retry, per-kingdom isolation, login rate-limit, session revocation, Google PKCE, polygon water checks, visible-border expansion, and the Sprint 6 Alliance schema.

## Open Questions

- Should `unitsJson` stay an opaque JSON payload in v0.1, or become a normalized `MovementOrderUnit` child table once battle reporting needs per-unit-type queries? S5-004 reads it defensively and drops malformed entries; S5-005 writes a normalized but still-unmerged mixed manifest for attacks. That parsing layer would be duplicated or removed by a child table, and S5-006 onward must query the manifest to resolve a battle, which sharpens the question.
- Should the base travel pace stay linear in distance, or gain a long-distance compression curve so cross-world orders are less punishing? S5-005 makes this more visible in practice, because a mixed army's pace is set by its heaviest unit, so adding siege to an army can multiply its travel time.

## Next Recommended Task

- Start S5-006, the basic battle formula. It is the first task that makes a dispatched attack DO anything, so decide explicitly whether S5-006 owns attack-arrival resolution in the tick worker's `processMovementArrivals` (a third branch after the existing RETURN and SCOUT passes) or whether that stays a separate concern. The attack path currently reserves units and writes an `IN_TRANSIT` row that nothing ever resolves, so S5-006 must close that loop: read the arriving `ATTACK` order, apply the simple power formula from the sprint doc, and decide the disposition of the attacking army. Defender bonuses are S5-007 and must not be pulled forward; the formula should read the attacker's and defender's raw unit attack/defense values and let S5-007 layer bonuses on top.
- Be careful about the arrival-pass invariants S5-004 established, because an `ATTACK` arrival interacts with them: per-order `try`/`catch` isolation so one poisoned order cannot abort the tick, no order left `IN_TRANSIT` past its `arrivalAt`, and the existing two-phase ordering where RETURN completes before outbound arrivals.
- Carry forward the still-open questions: `unitsJson` as opaque JSON versus a normalized child table, and whether travel pace should stay linear or gain compression.
- Carry forward the still-open foundation-hardening items: tick STARTED lease/retry, per-kingdom isolation, login rate-limit, session revocation, Google PKCE, polygon water checks, visible-border expansion, and the Sprint 6 Alliance schema.
- The five-sprint-deep live-database gap is the largest outstanding risk. If a PostgreSQL/PostGIS database can be made reachable, applying `000008_movement_orders` and smoke-testing a real dispatched scout and attack order is worth more than another feature task.
- Before starting S5-006, commit S5-005 on `sprint-5-movement-scouting` so the attack dispatch path has a reviewable checkpoint.
