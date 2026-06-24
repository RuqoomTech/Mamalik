# Sprint 3 Review - Land Buying + District Management

## Completed Scope

Sprint 3 is complete for the v0.1 land-credit and district-allocation slice.

- Shared land package constants are exported from `packages/game`.
- Locked package keys exist: `LAND_500`, `LAND_1000`, `LAND_5000`, and `LAND_10000`.
- Locked cooldowns are implemented: no blocking cooldown for 500 m2, then 6, 24, and 48 hours.
- Deterministic v0.1 pricing is implemented as `ceil(packageSizeM2 * 2 * kingdomSizeMultiplier * areaMultiplier)`.
- Unknown or unavailable area values default server-side to `STANDARD`.
- Land purchase validation rejects invalid package keys, missing kingdoms, missing stockpiles, insufficient Money, and active cooldowns.
- The land purchase Server Action accepts only `packageKey` and recomputes price, package size, cooldown, area type, Money, and land values server-side.
- Successful purchases subtract Money, increase `Kingdom.usableLandM2`, update cooldowns, and create `LAND_PURCHASE` reports.
- The dashboard shows all four package options with server-computed price, cooldown, affordability, availability, disabled reason, and action state.
- The dashboard shows kingdom-level usable, allocated, used, free, and unallocated land totals.
- The dashboard shows per-district allocated, used, free, usage percentage, building count, and status.
- District used/free land uses `District.usedLandM2` as the source of truth.
- The allocation flow assigns unallocated usable land into one existing district, recomputes totals from the database, rejects invalid amounts, and creates `DISTRICT_ALLOCATION` reports.

## Acceptance Criteria Status

| Criteria | Status |
|---|---|
| Land package constants and exports exist | Complete |
| Package cooldowns match locked values | Complete |
| Pricing formula is deterministic and documented | Complete |
| Area type defaults server-side to `STANDARD` for current v0.1 behavior | Complete |
| Purchase validation covers invalid package, insufficient Money, cooldown, and missing stockpile | Complete |
| Purchase mutation accepts only package key and recomputes server-side | Complete |
| Purchase mutation changes Money, usable land, cooldown, and reports | Complete |
| Dashboard land package UI shows all four packages and disabled reasons | Complete |
| District land dashboard shows allocated, used, free, and unallocated land | Complete |
| Unused land allocation increases only target district allocation | Complete |
| Invalid or excessive allocation amounts are rejected | Complete |
| `DISTRICT_ALLOCATION` report type and reports exist | Complete |

## Checks Run

- `npm run test`: passed outside the sandbox after the sandbox run hit `spawn EPERM`; 77 web tests, 55 game tests, and 8 worker tests passed.
- `npm run typecheck`: passed.
- `npm run lint`: passed.
- `npm run build`: passed outside the sandbox after the sandbox run hit `spawn EPERM`; existing Node `module.register()` deprecation warning remains non-blocking.
- `npm run db:validate`: passed outside the sandbox after the sandbox run could not access the Prisma engine binary.
- `npm run db:typecheck`: passed.
- `npm run db:migrate:deploy`: passed outside the sandbox after the sandbox run could not access the Prisma engine binary; configured PostgreSQL database reported 5 migrations and no pending migrations.
- `npm run game:test`: passed outside the sandbox after the sandbox run hit `spawn EPERM`; 55 tests passed.
- `npm run game:typecheck`: passed.
- `npm run tick:test`: passed outside the sandbox after the sandbox run hit `spawn EPERM`; 8 tests passed.
- `npm run tick:typecheck`: passed.
- `git diff --check`: passed with CRLF normalization warnings only.
- `git status --short`: completed and shows only Sprint 3 closure documentation/state changes.

## Manual Smoke Status

Full browser visual smoke for the dashboard land purchase and district allocation UI was not rerun during this closure review. Sprint 3 closure accepts the existing helper/action coverage and database migration verification as the baseline. Browser smoke remains recommended before or during Sprint 4 environment validation.

## Schema And Migration Status

Sprint 3 uses the existing `LandPurchaseCooldown`, `Kingdom`, `District`, `ResourceStockpile`, and `Report` models.

Confirmed migrations:

- `000003_tick_logs`
- `000004_training_queue_items`
- `000005_district_allocation_report_type`

Migration `000005_district_allocation_report_type` adds `DISTRICT_ALLOCATION` to `ReportType`.

## Explicit Closure Decisions

- Moving allocated land out of districts is deferred. Sprint 3 only allocates unallocated usable land into existing districts, which satisfies the v0.1 district-management slice without introducing reduction/move safety rules yet.
- A separate land purchase history table is deferred. `LAND_PURCHASE` reports are enough for v0.1 purchase history until query/reporting needs require a dedicated `LandPurchase` model.
- Row-level locking is deferred. v0.1 uses transactions, server-side rechecks, conditional stockpile/cooldown updates, and a serializable allocation transaction; stronger locking can be revisited if production contention appears.
- Browser smoke is not a blocker for Sprint 4 start because helper/action tests and migration verification cover the core Sprint 3 behavior. Browser smoke remains recommended.
- Visible-border expansion and polygon recalculation remain Sprint 4 work.
- Real map-driven area type classification remains Sprint 4 work. Current pricing defaults to `STANDARD`.
- Mutation safety for Sprint 3 is based on authenticated Server Actions, server-side ownership checks, server-side formula recomputation, and rejecting client-submitted prices, cooldowns, totals, and area values.

## Known Issues

- Browser smoke for the latest Sprint 3 dashboard UI was not rerun in this closure task.
- Moving land out of districts or between districts is not implemented.
- Land purchase history is stored through reports, not a dedicated history table.
- Real visible-border expansion and map validation remain Sprint 4.
- Node/pg deprecation warnings remain non-blocking dependency/toolchain maintenance items.

## Deferred Items

- Move/reduce district allocation flow.
- Dedicated `LandPurchase` persistence table if reports become insufficient.
- Stronger row-level locking if production contention requires it.
- Real visible-border expansion and dynamic border recalculation.
- Real map validation, water rejection, restricted-zone placeholders, overlap checks, and PostGIS spatial helpers.

## Readiness For Sprint 4

Sprint 3 is ready for Sprint 4 from the documented feature, schema, and automated-test standpoint. Sprint 4 should start with map validation and border work, not more Sprint 3 land-credit mutation work.
