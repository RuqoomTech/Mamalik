# Sprint 3 — Land Buying + District Management

## Sprint goal

A player can buy virtual land packages using Money, obey package cooldowns, update usable land credit, and reassign unused land between districts.

## Scope

### 1. Land package definitions

Implement locked packages:

| Package | Cooldown |
|---|---:|
| 500 m² | none |
| 1,000 m² | 6 hours |
| 5,000 m² | 24 hours |
| 10,000 m² | 48 hours |

### 2. Land pricing formula

Implement:

```text
price = packageSizeM2 × basePricePerM2 × areaTypeMultiplier × kingdomSizeMultiplier
```

For Sprint 3, area type can use a placeholder from the kingdom record. Full map-driven area classification is Sprint 4.

### 3. Kingdom size multiplier

Add basic multiplier based on usable land size.

Suggested initial values:

| Kingdom usable land | Multiplier |
|---|---:|
| 50,000–100,000 m² | ×1.0 |
| 100,001–250,000 m² | ×1.4 |
| 250,001–500,000 m² | ×2.0 |
| 500,001–1,000,000 m² | ×3.0 |
| 1,000,000+ m² | ×5.0 |

### 4. Land purchase UI

Add dashboard section:

- current usable land
- used land
- free land
- package prices
- package cooldowns
- buy button per package

### 5. Land purchase API

Create endpoint:

- `POST /api/land/buy`

Checks:

- package exists
- player owns kingdom
- cooldown is ready
- enough Money
- package can be applied

Effects:

- subtract Money
- increase `usableLandM2`
- update cooldown
- create land purchase report
- optionally update visible border as placeholder

### 6. District reassignment

Allow moving unused land between districts.

Rules:

- only unused allocated land can move
- used building land cannot be moved
- total allocated district land must equal kingdom usable land
- reassignment can cost Money/time later, but Sprint 3 can start with simple instant reassignment plus validation

### 7. District UI

Show:

- allocated land
- used land
- free land
- reassign form
- validation errors

## Out of scope

- Real border expansion algorithm
- War land capture
- Area-type bonuses
- Complex district reassignment timers

## Acceptance criteria

- [ ] Land packages appear with correct sizes and cooldowns.
- [ ] Prices use package size, area multiplier, and kingdom size multiplier.
- [ ] A player can buy 500 m² without cooldown if they have enough Money.
- [ ] 1,000/5,000/10,000 m² packages enforce cooldowns.
- [ ] Usable land increases after successful purchase.
- [ ] Money decreases after successful purchase.
- [ ] A land purchase report is created.
- [ ] Player cannot buy if cooldown is active.
- [ ] Player cannot buy if Money is insufficient.
- [ ] Player can move unused land between districts.
- [ ] Used building land cannot be moved.

