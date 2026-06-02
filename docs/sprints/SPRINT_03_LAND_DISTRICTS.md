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

- [ ] Land packages appear with correct sizes and cooldowns.
- [ ] Prices use package size, area multiplier, and kingdom size multiplier.
- [ ] 500 m2 can be bought without cooldown if the player has enough Money.
- [ ] 1,000/5,000/10,000 m2 packages enforce cooldowns.
- [ ] Usable land increases after successful purchase.
- [ ] Money decreases after successful purchase.
- [ ] A land purchase report is created.
- [ ] Player cannot buy if cooldown is active.
- [ ] Player cannot buy if Money is insufficient.
- [ ] Player can move unused land between districts.
- [ ] Used building land cannot be moved.
