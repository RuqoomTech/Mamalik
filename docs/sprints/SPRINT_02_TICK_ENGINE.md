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
- [ ] A kingdom produces Money, Food, Manpower, and Knowledge every tick.
- [ ] Population and army consume Food every tick.
- [x] The same tick cannot be processed twice.
- [ ] A player can start one construction/upgrade.
- [ ] Construction progresses and completes correctly.
- [ ] A player can start one unit training queue.
- [ ] Training progresses and completes correctly.
- [ ] Dashboard shows resources, queues, and per-tick numbers.
- [ ] Admin can run a test tick and view tick logs.

## Task Status

- [x] S2-001: Tick worker package and manual one-tick command foundation.
- [x] S2-002: TickLog model, migration, and duplicate tick-key protection.
- [ ] S2-003: Resource generation formulas.

## Implementation Notes

- `workers/tick-worker` is a separate TypeScript worker package.
- `npm run tick:once` computes the current 10-minute tick key, writes a `STARTED` TickLog row, counts kingdoms, and marks the row `COMPLETED`.
- Duplicate tick keys are protected by the `TickLog.tickKey` unique index and return a `SKIPPED` worker result.
- Resource generation, Food consumption, population effects, construction progress, and training progress are intentionally not implemented yet.
- Live `tick:once` smoke testing passed after applying migration `000003_tick_logs`; the first run completed and the second run in the same 10-minute slot returned `SKIPPED`.
