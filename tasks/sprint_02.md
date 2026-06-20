# Sprint 2 Tasks - Tick Engine + Economy

## Goal

The world updates every 10-minute tick.

## Tasks

- [x] S2-001: Create tick worker skeleton.
- [x] S2-002: Add TickLog model and duplicate tick protection.
- [x] S2-003: Implement resource generation formulas.
- [x] S2-004: Implement Food consumption for population and army.
- [x] S2-005: Implement population effects on taxes and manpower.
- [ ] S2-006: Implement construction queue progress.
- [ ] S2-007: Implement training queue progress.
- [ ] S2-008: Add dashboard economy/tick display.
- [ ] S2-009: Add admin test tick action.

## Acceptance Criteria

- [x] A tick can run manually.
- [x] Resources update every processed non-duplicate tick.
- [x] Food consumption is applied every processed non-duplicate tick.
- [x] Population tax and population-driven Manpower effects are named in formula output and tick summaries.
- [ ] Construction and training progress correctly.
- [ ] Admin can inspect tick logs.

## Notes

- S2-001/S2-002 added `workers/tick-worker`, root tick scripts, a stable 10-minute tick key helper, TickLog persistence, duplicate tick-key protection, and unit tests.
- The manual `tick:once` command was smoke-tested against the configured migrated database; a second run in the same 10-minute slot returned `SKIPPED`.
- S2-003 adds resource generation for Money, Food, Manpower, and Knowledge.
- S2-004 subtracts Food consumption for population and army, clamps Food to zero, and counts Food shortages without applying starvation penalties.
- S2-005 makes population tax and population-driven Manpower generation explicit in `packages/game` formula breakdowns and worker output without changing starter totals.
