# Sprint 2 - Tick Engine + Economy

## Goal

The world updates every 10-minute tick.

## Scope

- Separate tick worker process.
- Tick log model.
- Resource generation.
- Food consumption.
- Population effects.
- Construction queue progress.
- Training queue progress.
- Dashboard economy updates.
- Admin test tick.

## Rules

- Resources generate every 10 minutes.
- Population and army consume Food every tick.
- Construction/upgrades are measured in ticks.
- Unit training is measured in ticks.
- 1 active construction slot at start.
- 1 active training queue at start.

## Out Of Scope

- Land buying.
- District reassignment.
- Combat tick processing.
- Army movement tick processing.
- Advanced starvation complexity.

## Acceptance Criteria

- [x] A tick can be run manually in development.
- [x] A kingdom produces Money, Food, Manpower, and Knowledge every tick.
- [x] Population and army consume Food every processed non-duplicate tick.
- [x] Population tax and population-driven Manpower effects are named, tested, and included in tick output.
- [x] The same tick cannot be processed twice.
- [x] Worker-side construction/upgrade progress works for queued buildings.
- [x] Construction and upgrade timers progress and complete correctly once a building is already queued.
- [x] Worker-side training progress works for queued training items.
- [x] Training timers progress and complete correctly once a queue already exists.
- [x] Dashboard shows resources, queues, and per-tick numbers.
- [x] Admin can run a test tick and view tick logs.

## Task Status

- [x] S2-001: Tick worker package and manual one-tick command foundation.
- [x] S2-002: TickLog model, migration, and duplicate tick-key protection.
- [x] S2-003: Resource generation formulas.
- [x] S2-004: Food consumption for population and army.
- [x] S2-005: Population effects on taxes and manpower.
- [x] S2-006: Construction queue progress.
- [x] S2-007: Training queue progress.
- [x] S2-008: Dashboard economy/tick display.
- [x] S2-009: Admin test tick action and TickLog inspection.
- [x] Sprint 2 QA, stabilization, and closure review.

## Closure Status

- Sprint 2 is complete for the implemented manual/admin tick engine, economy processing, construction/training progress, dashboard visibility, and TickLog inspection scope.
- Player-facing start-construction/start-upgrade actions are deferred to a future v0.1 API/UI task because they require cost validation, slot enforcement, and build/upgrade request handling.
- Player-facing start-training actions are deferred to a future v0.1 API/UI task because they require cost validation, one-active-queue enforcement, and training request handling.
- Automatic scheduling is deferred until the production worker hosting strategy is chosen. The stable manual command and admin one-tick action are the Sprint 2 closure boundary.
- Failed TickLog cleanup is deferred; failed rows remain visible in admin as audit records.

## Implementation Notes

- `workers/tick-worker` is a separate TypeScript worker package.
- `npm run tick:once` computes the current 10-minute tick key, writes a `STARTED` TickLog row, generates resources for each processed kingdom, and marks the row `COMPLETED`.
- Duplicate tick keys are protected by the `TickLog.tickKey` unique index and return a `SKIPPED` worker result.
- S2-003 resource formulas per tick:
  - Money: `floor(population * 0.05) + MARKET level * 40 + TAX_OFFICE level * 60 + PALACE level * 25`
  - Food: `FARM level * 120`
  - Manpower: `floor(population * 0.01) + HOUSES level * 15`
  - Knowledge: `SCHOLAR_HALL level * 20`
- S2-005 keeps those totals unchanged while exposing named formula breakdowns:
  - Money population effect: `populationTax = floor(population * 0.05)`
  - Manpower population effect: `populationManpowerGrowth = floor(population * 0.01)`
  - Starter kingdom breakdown: 50 population tax, 40 Market bonus, 25 Palace bonus, 10 population Manpower, 15 Houses bonus.
- Tick output includes total generated Money/Manpower plus the named population tax and population Manpower totals.
- Only `ACTIVE` buildings generate resources; `CONSTRUCTING` and `UPGRADING` buildings do not.
- S2-004 Food consumption formulas per tick:
  - Population Food: `floor(population * 0.02)`
  - Army Food: `ceil(INFANTRY * 0.03 + ARCHERS * 0.035 + CAVALRY * 0.06 + SCOUTS * 0.025 + SIEGE * 0.12)`
  - Starter kingdom consumption: 24 Food per tick.
- Food is updated as `max(0, current Food + generated Food - total Food consumption)`.
- Food shortages are counted and clamp Food to zero; starvation death, training pauses, and shortage penalties are deferred.
- S2-006 construction progress rules:
  - `CONSTRUCTING` and `UPGRADING` buildings with positive `constructionRemainingTicks` decrement by 1 after this tick's generation/consumption.
  - Buildings that reach zero ticks become `ACTIVE` with `constructionRemainingTicks = 0`.
  - `CONSTRUCTING` or `UPGRADING` buildings already at zero ticks are normalized to `ACTIVE`.
  - `UPGRADING` rows are treated as already carrying their target `level`; completion only changes `status` until a richer queue model exists.
  - Completed construction/upgrades create `CONSTRUCTION` reports.
- S2-007 training progress rules:
  - Active `TrainingQueueItem` rows decrement `remainingTicks` by 1 after this tick's generation/consumption/construction progress.
  - Active queues that reach zero become `COMPLETED`, receive `completedAt`, and add completed units to the kingdom's `GARRISON` stack.
  - Active queues already at zero or negative ticks normalize to `COMPLETED`.
  - `COMPLETED` and `CANCELLED` queues do not progress.
  - Completed training creates `TRAINING` reports.
  - One-active-training-queue enforcement remains deferred to the future start-training API.
- S2-008 dashboard display rules:
  - `/dashboard` remains read-only and server-rendered.
  - Current stockpiles, per-tick generation, Food consumption, net Food, Food status, active construction, active training, latest TickLog rows, and latest kingdom reports are loaded through `apps/web/src/lib/kingdom/dashboard-data.ts`.
  - Per-tick estimates reuse `packages/game` resource-generation and Food-consumption formulas instead of duplicating calculations in UI components.
  - Remaining queue time uses the shared `formatTicksAsDuration` helper based on the locked 10-minute tick duration.
- S2-009 admin tick rules:
  - `/admin` includes a server-action-backed "Run one tick" control and a recent TickLog table.
  - The mutation re-checks admin authorization inside the action path before calling `runOneTick`.
  - The admin action reuses `workers/tick-worker/src/run-one-tick.ts`; it does not duplicate tick logic or add a public tick API.
  - Duplicate same-slot clicks return `SKIPPED` through the `TickLog.tickKey` unique guard and do not double-apply resources, construction, or training.
- Player-facing start-construction/start-upgrade and start-training actions are intentionally deferred to separate v0.1 tasks.
- Live `tick:once` smoke testing passed after applying migration `000003_tick_logs`; the first run completed and the second run in the same 10-minute slot returned `SKIPPED`.
