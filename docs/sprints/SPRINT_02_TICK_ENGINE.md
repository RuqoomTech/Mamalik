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

- [ ] A tick can be run manually in development.
- [ ] A kingdom produces Money, Food, Manpower, and Knowledge every tick.
- [ ] Population and army consume Food every tick.
- [ ] The same tick cannot be processed twice.
- [ ] A player can start one construction/upgrade.
- [ ] Construction progresses and completes correctly.
- [ ] A player can start one unit training queue.
- [ ] Training progresses and completes correctly.
- [ ] Dashboard shows resources, queues, and per-tick numbers.
- [ ] Admin can run a test tick and view tick logs.
