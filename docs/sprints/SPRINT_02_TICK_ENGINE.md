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
- [x] S2-003: Resource generation formulas.
- [x] S2-004: Food consumption for population and army.

## Implementation Notes

- `workers/tick-worker` is a separate TypeScript worker package.
- `npm run tick:once` computes the current 10-minute tick key, writes a `STARTED` TickLog row, generates resources for each processed kingdom, and marks the row `COMPLETED`.
- Duplicate tick keys are protected by the `TickLog.tickKey` unique index and return a `SKIPPED` worker result.
- S2-003 resource formulas per tick:
  - Money: `floor(population * 0.05) + MARKET level * 40 + TAX_OFFICE level * 60 + PALACE level * 25`
  - Food: `FARM level * 120`
  - Manpower: `floor(population * 0.01) + HOUSES level * 15`
  - Knowledge: `SCHOLAR_HALL level * 20`
- Only `ACTIVE` buildings generate resources; `CONSTRUCTING` and `UPGRADING` buildings do not.
- S2-004 Food consumption formulas per tick:
  - Population Food: `floor(population * 0.02)`
  - Army Food: `ceil(INFANTRY * 0.03 + ARCHERS * 0.035 + CAVALRY * 0.06 + SCOUTS * 0.025 + SIEGE * 0.12)`
  - Starter kingdom consumption: 24 Food per tick.
- Food is updated as `max(0, current Food + generated Food - total Food consumption)`.
- Food shortages are counted and clamp Food to zero; starvation death, training pauses, and shortage penalties are deferred.
- Construction progress and training progress are intentionally not implemented yet.
- Live `tick:once` smoke testing passed after applying migration `000003_tick_logs`; the first run completed and the second run in the same 10-minute slot returned `SKIPPED`.
