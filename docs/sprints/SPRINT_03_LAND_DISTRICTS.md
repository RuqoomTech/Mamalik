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
- Allocate unallocated usable land into existing districts.

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
- [x] 500 m2 can be bought without cooldown if the player has enough Money.
- [x] 1,000/5,000/10,000 m2 packages enforce cooldowns.
- [x] Usable land increases after successful purchase.
- [x] Money decreases after successful purchase.
- [x] A land purchase report is created.
- [x] Player cannot buy if cooldown is active.
- [x] Player cannot buy if Money is insufficient.
- [x] Player can view land package options and buy available packages from the dashboard.
- [x] Player can view allocated, used, free, and unallocated land from the dashboard.
- [x] Player can allocate unallocated usable land into an existing district.
- [x] Used building land cannot be moved by the Sprint 3 allocation flow.

## Task Status

- [x] S3-001: Land purchase package constants.
- [x] S3-002: Hybrid land price formula.
- [x] S3-003: Land package cooldown and validation helpers.
- [x] S3-004: Land purchase API.
- [x] S3-005: Land purchase report.
- [x] S3-006: Land package dashboard UI.
- [x] S3-007: District allocated/used/free land view.
- [x] S3-008: Unused land reassignment flow.

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
- S3-004 adds an authenticated Server Action backed by a transaction-safe land purchase helper. It accepts only a package key, reloads the current kingdom/stockpile/cooldown rows server-side, recalculates price and area type server-side, subtracts Money, increments `Kingdom.usableLandM2`, updates package cooldown, and creates a `LAND_PURCHASE` report.
- S3-004 also adds a read-only purchase-options helper for the future dashboard UI. The helper derives price, affordability, cooldown state, and disabled reasons from database state plus `packages/game` formulas.
- S3-004 does not recalculate real map borders or visible polygons; Sprint 4 still owns real spatial validation and border expansion.
- S3-005 is complete because the S3-004 transaction creates the land purchase report with package key, package size, price paid, area type, previous/new usable land, cooldown, and price breakdown.
- S3-006 adds a dashboard `Buy land` section. The dashboard read model computes all package prices, cooldown states, affordability, and disabled reasons server-side through `createLandPurchaseOptions`.
- The S3-006 client component submits only `packageKey` to the existing Server Action and displays success/failure state from the action result.
- After a successful purchase, `/dashboard` is revalidated so Money, usable land, cooldowns, and latest `LAND_PURCHASE` report display update on refresh/re-render.
- S3-007 adds a read-only dashboard `District land` section with kingdom-level usable, allocated, used, free, and unallocated land totals.
- S3-007 uses `District.usedLandM2` as the canonical source for district used/free land and uses `BuildingInstance` rows only for per-district building counts and building detail display.
- S3-008 adds an allocation-only dashboard flow that assigns unallocated usable land into one existing district.
- The S3-008 Server Action accepts only `districtId` and `amountM2`, reloads kingdom and district state server-side, recomputes unallocated land from `Kingdom.usableLandM2 - sum(District.allocatedLandM2)`, and updates the target district inside a transaction.
- S3-008 does not move allocated land out of a district, does not reduce district allocations, and does not add construction or building placement actions.
- S3-008 creates `DISTRICT_ALLOCATION` reports with the allocated amount, district type, previous/new allocation, and unallocated land before/after. Migration `000005_district_allocation_report_type` adds that report enum value.
