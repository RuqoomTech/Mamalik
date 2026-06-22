# Sprint 3 - Land Buying + District Management

## Goal

A player can buy virtual land packages using Money, obey package cooldowns, update usable land credit, and reassign unused land between districts.

## Scope

- Land package definitions.
- Hybrid price formula.
- Kingdom size multiplier.
- Area type multiplier placeholder.
- Land purchase UI.
- Land purchase API.
- Land purchase reports.
- District land view.
- Reassign unused district land.

## Locked Packages

| Package | Cooldown |
|---|---:|
| 500 m2 | none |
| 1,000 m2 | 6 hours |
| 5,000 m2 | 24 hours |
| 10,000 m2 | 48 hours |

## Pricing Formula

```text
price = packageSizeM2 * basePricePerM2 * areaTypeMultiplier * kingdomSizeMultiplier
```

Sprint 3 may use a placeholder area type from the kingdom record. Full map-driven classification is Sprint 4.

## Out Of Scope

- Real border expansion algorithm.
- War land capture.
- Area-type bonuses.
- Complex district reassignment timers.

## Acceptance Criteria

- [x] Shared land package definitions exist with correct sizes and cooldowns.
- [x] Shared prices use package size, area multiplier, and kingdom size multiplier.
- [ ] 500 m2 can be bought without cooldown if the player has enough Money.
- [ ] 1,000/5,000/10,000 m2 packages enforce cooldowns.
- [ ] Usable land increases after successful purchase.
- [ ] Money decreases after successful purchase.
- [ ] A land purchase report is created.
- [ ] Player cannot buy if cooldown is active.
- [ ] Player cannot buy if Money is insufficient.
- [ ] Player can move unused land between districts.
- [ ] Used building land cannot be moved.

## Task Status

- [x] S3-001: Land purchase package constants.
- [x] S3-002: Hybrid land price formula.
- [x] S3-003: Land package cooldown and validation helpers.
- [ ] S3-004: Land purchase API.
- [ ] S3-005: Land purchase report.
- [ ] S3-006: Land package dashboard UI.
- [ ] S3-007: District allocated/used/free land view.
- [ ] S3-008: Unused land reassignment flow.

## Implementation Notes

- S3-001 through S3-003 added shared land helpers under `packages/game/src/land`.
- Package keys are `LAND_500`, `LAND_1000`, `LAND_5000`, and `LAND_10000`.
- Package cooldowns remain locked at 0, 6, 24, and 48 hours.
- The v0.1 price formula is `ceil(packageSizeM2 * 2 * kingdomSizeMultiplier * areaMultiplier)`.
- Kingdom size multipliers:
  - below 100,000 m2: `1.0`
  - 100,000-499,999 m2: `1.25`
  - 500,000-999,999 m2: `1.5`
  - 1,000,000+ m2: `2.0`
- Area multipliers:
  - `STANDARD`: `1.0`
  - `RURAL`: `0.8`
  - `URBAN`: `1.5`
  - `STRATEGIC`: `2.0`
- v0.1 currently stores `AreaType.STANDARD`; unknown area values default to `STANDARD` in the pricing helper.
- The validation helper checks package key, kingdom presence, stockpile presence, cooldown, and Money before allowing a purchase.
- S3-001 did not add purchase mutation/UI, did not mutate the database, and did not add a new cooldown model.
- The prompt referenced `docs/sprints/SPRINT_03_LAND_AND_DISTRICTS.md`, but the canonical active Sprint 3 doc remains `docs/sprints/SPRINT_03_LAND_DISTRICTS.md` per `AGENTS.md`.
