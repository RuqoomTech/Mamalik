# 04 - Data Model

This is the canonical v0.1 data-model plan. Sprint 1 Task 6 added the first Prisma implementation in `packages/db/prisma/schema.prisma`.

## Implemented Prisma Enums

- `UserRole`: `PLAYER`, `ADMIN`
- `AuthProvider`: `EMAIL`, `GOOGLE`
- `AreaType`: `STANDARD`
- `DistrictType`: `ECONOMIC`, `MILITARY`, `RESIDENTIAL`, `RESEARCH`, `DEFENSIVE`
- `BuildingType`: `FARM`, `MARKET`, `TAX_OFFICE`, `PALACE`, `HOUSES`, `BARRACKS`, `STABLES`, `WATCHTOWER`, `WALL`, `SCHOLAR_HALL`
- `BuildingStatus`: `ACTIVE`, `CONSTRUCTING`, `UPGRADING`
- `UnitType`: `INFANTRY`, `ARCHERS`, `CAVALRY`, `SCOUTS`, `SIEGE`
- `UnitLocationType`: `GARRISON`, `MOVING`
- `ReportType`: `BATTLE`, `SCOUT`, `LAND_PURCHASE`, `DISTRICT_ALLOCATION`, `CONSTRUCTION`, `TRAINING`
- `TickLogStatus`: `STARTED`, `COMPLETED`, `FAILED`, `SKIPPED`
- `TrainingQueueStatus`: `ACTIVE`, `COMPLETED`, `CANCELLED`

## Implemented Prisma Models

### User

- `id`
- `email`
- `displayName`
- `passwordHash`
- `googleSubject`
- `authProvider`
- `role`
- `kingdom`
- `createdAt`
- `updatedAt`

Notes:

- `passwordHash` supports Sprint 1 email/password auth.
- `googleSubject` supports Sprint 1 Google login without adding a separate account-linking model yet.
- One user can own one kingdom in v0.1.

### Kingdom

- `id`
- `userId`
- `user`
- `name`
- `slug`
- `centerLat`
- `centerLng`
- `visibleBorderGeojson`
- `visibleAreaM2`
- `usableLandM2`
- `usedLandM2`
- `population`
- `protectionEndsAt`
- `areaType`
- `districts`
- `resourceStockpile`
- `buildings`
- `unitStacks`
- `trainingQueueItems`
- `landCooldowns`
- `reports`
- `createdAt`
- `updatedAt`

Notes:

- `usableLandM2` defaults to the locked 50,000 m2 starting land credit.
- `population` defaults to the locked 1,000 starting population.
- `visibleBorderGeojson` stores the visible map polygon separately from gameplay land credit.
- `centerLat` and `centerLng` are indexed for Sprint 1 temporary proximity checks.
- Sprint 1 Task 12 reads `centerLat` and `centerLng` for a temporary TypeScript distance check. Sprint 4 replaces this with dynamic buffer/PostGIS validation.
- Sprint 1 Task 14 creates the kingdom inside a transaction and stores the temporary preview polygon as `visibleBorderGeojson`.
- Sprint 4 Task S4-001 keeps `visibleBorderGeojson` as the storage source for the visible border and uses PostGIS raw SQL to generate new preview GeoJSON, measure visible area in m2, and check overlap by converting stored GeoJSON with `ST_GeomFromGeoJSON`.
- S4-001 does not add a native geometry column or spatial index. That remains a future hardening option if overlap checks become slow.
- S4-007 stores the selected server-generated dynamic preview polygon in `visibleBorderGeojson` and its measured selected area in `visibleAreaM2` during kingdom creation. The generator may attempt multiple radii, but only the chosen polygon/area is persisted.
- `visibleAreaM2` is an approximate visible-map area and can be `STRICT`, `LOOSE`, or `FALLBACK` relative to the 50,000 m2 target. It is intentionally separate from `usableLandM2`, which remains the exact gameplay land credit.
- `usedLandM2` starts as the sum of starter building footprints.
- `AreaType.STANDARD` is the only current persisted area type. S4-006 classifies valid locations as `STANDARD` with source `V0_1_DEFAULT` and low confidence, then kingdom creation stores that server-side value. More persisted area categories require a future enum migration and a real classifier; area-type bonuses remain post-v0.1.

### District

- `id`
- `kingdomId`
- `kingdom`
- `type`
- `allocatedLandM2`
- `usedLandM2`
- `buildings`
- `createdAt`
- `updatedAt`

Notes:

- District type is unique per kingdom.
- Starting district allocations remain locked in `docs/01_LOCKED_DECISIONS.md`.
- Sprint 1 Task 14 seeds all five districts and sets each district `usedLandM2` from the starter buildings assigned to that district.
- Sprint 3 Task S3-007 uses `District.usedLandM2` as the canonical dashboard source for district used/free land. `BuildingInstance` rows are used for per-district building counts and building detail display, not for recalculating or double-counting district used land.
- Sprint 3 Task S3-008 allows only increasing `District.allocatedLandM2` from unallocated usable kingdom land. It does not reduce district allocation or move land between districts.

### ResourceStockpile

- `id`
- `kingdomId`
- `kingdom`
- `money`
- `food`
- `manpower`
- `knowledge`
- `updatedAt`

Defaults:

- Money: 10,000
- Food: 5,000
- Manpower: 500
- Knowledge: 0

Sprint 2 resource generation and Food consumption:

- `workers/tick-worker` increments these stockpile values once per processed non-duplicate tick.
- Resource-generation formulas now expose named population-effect breakdowns, including `populationTax` for Money and `populationManpowerGrowth` for Manpower; these are worker output/read-model values and do not add stockpile columns.
- Food is updated as `max(0, current Food + generated Food - consumed Food)`.
- Food shortage means the available Food after generation did not cover consumption; S2-004 only counts the shortage and clamps Food to zero.
- Missing stockpiles are treated as data repair: the worker creates a stockpile with starting defaults before applying generation and includes a warning in the tick result.
- Starvation deaths, training pauses, and shortage penalties are deferred to later Sprint 2 tasks.

### BuildingInstance

- `id`
- `kingdomId`
- `kingdom`
- `districtId`
- `district`
- `type`
- `level`
- `status`
- `landUsedM2`
- `constructionRemainingTicks`
- `createdAt`
- `updatedAt`

Notes:

- Buildings consume land through districts, not manual map placement.
- Starter building footprints are simple 1,000 m2 constants per starter building in S1-014.
- S2-006 uses `BuildingInstance.status` and `constructionRemainingTicks` as the temporary v0.1 construction representation.
- Each processed non-duplicate tick decrements `CONSTRUCTING` and `UPGRADING` rows with positive `constructionRemainingTicks`.
- Rows that reach zero are set to `ACTIVE` with `constructionRemainingTicks = 0`.
- `CONSTRUCTING` or `UPGRADING` rows already at zero ticks are normalized to `ACTIVE`.
- `UPGRADING` rows are treated as already carrying the target `level`; completion only changes `status` to `ACTIVE` until a richer queue model exists.

### UnitStack

- `id`
- `kingdomId`
- `kingdom`
- `unitType`
- `quantity`
- `locationType`
- `createdAt`
- `updatedAt`

Notes:

- One stack per kingdom, unit type, and location type.
- Starting units remain locked at 100 Infantry and 25 Archers.
- S2-007 adds completed training quantities to `GARRISON` stacks, incrementing an existing stack or creating one if missing.
- Movement order tables are deferred until Sprint 5.

### TrainingQueueItem

- `id`
- `kingdomId`
- `kingdom`
- `unitType`
- `quantity`
- `remainingTicks`
- `status`
- `createdAt`
- `updatedAt`
- `completedAt`

Notes:

- Added in Sprint 2 Task S2-007 with migration `000004_training_queue_items`.
- The tick worker processes rows where `status = ACTIVE`.
- Active queues decrement `remainingTicks` once per processed non-duplicate tick.
- Active queues reaching zero are set to `COMPLETED`, receive `completedAt`, add their units to the kingdom's garrison, and create a `TRAINING` report.
- Active queues found with zero or negative remaining ticks normalize to `COMPLETED`.
- `COMPLETED` and `CANCELLED` rows do not progress.
- One-active-training-queue enforcement is deferred to the future start-training API; S2-007 does not add a partial unique index.

### LandPurchaseCooldown

- `id`
- `kingdomId`
- `kingdom`
- `packageSizeM2`
- `availableAt`
- `createdAt`
- `updatedAt`

Notes:

- Package size is unique per kingdom.
- Sprint 1 Task 14 creates initial cooldown records for 500, 1,000, 5,000, and 10,000 m2 packages with `availableAt = now`.
- S3-001 through S3-003 reuse this existing model for package cooldown checks; no duplicate cooldown table is added.
- S3-004 updates this model from the land purchase Server Action. The 500 m2 package has no blocking cooldown and stores `availableAt = now`; 1,000, 5,000, and 10,000 m2 packages store their next available timestamp using the locked 6-hour, 24-hour, and 48-hour cooldowns.
- Purchase history and price records remain represented by `LAND_PURCHASE` reports for v0.1; a separate `LandPurchase` table is deferred until reporting/query needs require it.

### Report

- `id`
- `kingdomId`
- `kingdom`
- `type`
- `title`
- `bodyJson`
- `readAt`
- `createdAt`

Notes:

- Sprint 1 only needs the storage foundation.
- S2-006 creates `CONSTRUCTION` reports when the tick worker completes a construction or upgrade timer.
- S2-007 creates `TRAINING` reports when the tick worker completes an active training queue.
- S3-004 creates `LAND_PURCHASE` reports from the purchase transaction. Report body JSON includes package key, package size, price paid, area type, previous/new usable land, cooldown timestamp if any, and price breakdown.
- S3-008 creates `DISTRICT_ALLOCATION` reports when unallocated usable land is assigned into a district. Report body JSON includes amount, district type, previous/new allocated land, and unallocated land before/after.
- Full report-center behavior is deferred until Sprint 6.

### TickLog

- `id`
- `tickKey`
- `status`
- `startedAt`
- `finishedAt`
- `processedKingdomCount`
- `errorMessage`
- `createdAt`
- `updatedAt`

Notes:

- Added in Sprint 2 Task S2-001/S2-002 as the tick execution foundation.
- `tickKey` is unique and represents a stable 10-minute slot, preventing the same tick from being processed twice.
- The first worker implementation records `STARTED`, `COMPLETED`, and `FAILED` rows; duplicate attempts return a `SKIPPED` worker result without creating a second row for the same key.
- `processedKingdomCount` is the number of kingdoms loaded for a completed tick.
- S2-003 adds resource generation before the TickLog is marked `COMPLETED`.
- S2-004 adds Food consumption before the TickLog is marked `COMPLETED`.
- S2-005 adds named population-effect breakdowns to formula and worker output without changing TickLog columns.
- S2-006 adds construction progress summary fields to worker output without changing TickLog columns.
- S2-007 adds training progress summary fields to worker output without changing TickLog columns.
- S2-009 reads recent TickLog rows in the admin panel for inspection. Failed historical rows remain visible and are not cleaned up automatically.
- Sprint 2 closure keeps failed TickLog rows as audit/debug records. Cleanup tooling is deferred unless the volume becomes operationally noisy.
- Population count growth is a future v0.1 or balancing task.

## Raw SQL Spatial Tables

### LandMaskPolygon

- `id`
- `source`
- `name`
- `geom`
- `createdAt`

Notes:

- Added in Sprint 4 Task S4-002 with migration `000006_land_mask_polygons`.
- `geom` is a PostGIS `geometry(MultiPolygon, 4326)` column with a GiST spatial index.
- Prisma does not model this table directly because geometry columns are handled through raw SQL helpers.
- `apps/web/src/lib/map/land-mask.ts` checks selected kingdom coordinates against this table with `ST_Covers`.
- The first v0.1 seed source is `MAMALIK_COARSE_V0_1`, loaded by `npm run db:seed-land-mask`.
- The coarse seed rejects obvious open ocean but is not coastline-accurate and should be replaced by a Natural Earth or equivalent licensed global land-mask import for production precision.
- Missing land-mask table or rows blocks kingdom validation by default. Local development can set `ALLOW_MISSING_LAND_MASK=true` to continue while seed data is unavailable.

### RestrictedZone

- `id`
- `source`
- `code`
- `name`
- `category`
- `reason`
- `blockMode`
- `enabled`
- `geom`
- `createdAt`
- `updatedAt`

Notes:

- Added in Sprint 4 Task S4-003 with migration `000007_restricted_zones`.
- `geom` is a PostGIS `geometry(MultiPolygon, 4326)` column with a GiST spatial index.
- Prisma does not model this table directly because geometry columns are handled through raw SQL helpers.
- The first v0.1 source is `MAMALIK_RESTRICTED_V0_1`, loaded by `npm run db:seed-restricted-zones`.
- The checked-in seed contains artificial no-start fixtures only. It is a validation foundation, not a production global restricted-zone dataset.
- `apps/web/src/lib/map/restricted-zones.ts` rejects a start if the selected point is inside an enabled zone or if the generated preview polygon intersects an enabled zone.
- If the table exists with zero active rows, validation treats restricted zones as clear. If the table is missing, validation returns `restricted-zone-data-missing` and blocks kingdom creation.
- Current categories are `AIRPORT`, `MILITARY`, `PROTECTED_AREA`, `ADMIN_BLOCK`, and `TEST_FIXTURE`.
- User-facing errors should stay generic so future sensitive restricted datasets do not leak detailed public information.

Sprint 4 closure:

- `LandMaskPolygon` and `RestrictedZone` are accepted as the v0.1 spatial validation foundation.
- They are managed through raw SQL migrations and seed scripts because Prisma does not model PostGIS geometry columns directly in this project.
- The current seed datasets are intentionally coarse/artificial. Production launch hardening needs reviewed, licensed, versioned imports before Mamalik claims coastline-accurate land validation or comprehensive restricted-zone coverage.

## Dashboard Read Model

Sprint 1 Task 16 adds a server-side dashboard read model in `apps/web/src/lib/kingdom/dashboard-data.ts`.

The dashboard reads:

- `Kingdom`
- `ResourceStockpile`
- `District`
- `BuildingInstance` with `District`
- `UnitStack`
- `TrainingQueueItem`
- `Report`
- `TickLog`
- `LandPurchaseCooldown`

The read model derives display-only values such as free land, district free land, enum labels, beginner-protection remaining time, per-tick economy estimates, Food status, queue remaining time, report summaries, and latest tick activity. It does not mutate game state.

Sprint 2 Task S2-008 expands the dashboard read model so per-tick Money, Food, Manpower, Knowledge, and Food consumption estimates reuse `packages/game` formulas. The dashboard does not store these estimates as new database columns.

Sprint 3 Task S3-006 expands the dashboard read model with server-computed land purchase options. Package prices, affordability, cooldown state, and disabled reasons are derived from `Kingdom`, `ResourceStockpile`, `LandPurchaseCooldown`, and `packages/game` helpers; the client UI does not compute or submit those values.

Sprint 3 Task S3-007 expands the dashboard read model with kingdom-level land totals and per-district allocated/used/free land. District free land is displayed as `max(allocatedLandM2 - usedLandM2, 0)`, usage percentage is derived from district allocation and used land, and unallocated usable land is `max(Kingdom.usableLandM2 - sum(District.allocatedLandM2), 0)`.

Sprint 3 Task S3-008 adds the allocation mutation that uses the same land totals server-side. The mutation accepts only a target district id and amount, then recomputes the unallocated land from database state before incrementing `District.allocatedLandM2`.

## Admin Read Model

Sprint 1 Task 17 adds a server-side admin read model in `apps/web/src/lib/admin/admin-data.ts`.

The admin panel reads limited rows from:

- `User`
- `Kingdom`
- `ResourceStockpile`
- `District`
- `BuildingInstance`
- `UnitStack`
- `Report`
- `TickLog`

The admin read model uses explicit `select` fields and row limits for inspection. It derives display-only values such as free land, enum labels, report read/unread state, and TickLog status labels. The S2-009 admin tick Server Action is the first admin mutation, and it only runs one tick through the existing worker core after re-checking admin authorization.

Sprint 2 closure does not add player-facing queue start models or mutation routes. Existing construction and training models support worker-side progress for rows that are already queued.

## Deferred Queue Models

These remain planned but are not part of the current implemented model:

### ConstructionQueueItem

- `id`
- `kingdomId`
- `buildingId`
- `buildingType`
- `actionType`: `BUILD | UPGRADE`
- `remainingTicks`
- `status`

## Deferred Land Models

### LandPurchase

- `id`
- `kingdomId`
- `packageSizeM2`
- `pricePaid`
- `createdAt`

### RestrictedZone

- `id`
- `name`
- `reason`
- `geometry`
- `enabled`

## Deferred Movement And Combat Models

### MovementOrder

- `id`
- `sourceKingdomId`
- `targetKingdomId`
- `orderType`: `SCOUT | ATTACK | RETURN`
- `unitsJson`
- `status`
- `distanceM`
- `travelTicks`
- `departureAt`
- `arrivalAt`

### Battle

- `id`
- `attackerKingdomId`
- `defenderKingdomId`
- `winnerKingdomId`
- `attackerPower`
- `defenderPower`
- `landCapturedM2`
- `resolvedAt`

### WarLandCapture

- `id`
- `winnerKingdomId`
- `loserKingdomId`
- `capturedLandM2`
- `capturedAt`

Used to enforce the 1,000 m2 per same enemy per 30 days rule.

## Deferred Alliances And Rankings

### Alliance

- `id`
- `name`
- `tag`
- `description`
- `leaderKingdomId`
- `memberLimit`
- `createdAt`

### AllianceMember

- `id`
- `allianceId`
- `kingdomId`
- `role`: `LEADER | MEMBER`
- `joinedAt`

### DiplomacyRelation

- `id`
- `sourceId`
- `targetId`
- `state`: `NEUTRAL | ALLY | WAR`
- `createdAt`

## Implementation Notes

- Prisma tooling lives in `packages/db`.
- The generated Prisma client output path is `packages/db/generated/prisma` and is ignored.
- PostGIS geometry fields may require raw SQL migration support.
- Shared starter-state constants now live in `packages/game/src/constants.ts`, including starting usable land, population, resources, district allocations, starter buildings and land footprints, starter units, land purchase packages, beginner protection, and temporary validation constants.
- Tick duration constants also live in `packages/game/src/constants.ts`; `workers/tick-worker` uses those constants to compute stable 10-minute tick keys.
- Initial resource-generation formulas live in `packages/game/src/economy/resource-generation.ts` and return named output breakdowns plus reusable flat totals for worker stockpile updates.
- Initial Food consumption formulas live in `packages/game/src/economy/food-consumption.ts`.
- Initial construction progress helpers live in `packages/game/src/buildings/construction-progress.ts`.
- Initial training progress helpers live in `packages/game/src/units/training-progress.ts`.
- Initial tick-duration display helpers live in `packages/game/src/time/tick-duration.ts`.
- Initial land package, pricing, cooldown, and validation helpers live under `packages/game/src/land`.
- Initial shared area-type parsing, defaulting, and display labels live in `packages/game/src/land/area-type.ts`.
- Initial district unused-land allocation validation lives in `packages/game/src/land/district-reassignment.ts`.
- Initial land purchase mutation logic lives in `apps/web/src/lib/kingdom/land-purchase.ts`, uses a Server Action entry point from `apps/web/src/app/dashboard/actions.ts`, and recomputes price/cooldown/area type from database state before mutating Money, usable land, cooldowns, and reports.
- Initial district allocation mutation logic lives in `apps/web/src/lib/kingdom/district-allocation.ts`, uses a Server Action entry point from `apps/web/src/app/dashboard/actions.ts`, and recomputes unallocated usable land from database state before incrementing the target district allocation.
- Initial PostGIS visible-border helpers live in `apps/web/src/lib/map`. They generate a geodesic buffer preview from selected coordinates, classify the measured area against locked tolerance bands, and reject overlap with existing kingdom visible borders.
- S4-007 extends the visible-border helpers with bounded dynamic radius attempts and best-result selection. The selected preview prefers strict tolerance, then loose tolerance, then fallback closest to the 50,000 m2 target.
- Initial land/water validation helpers live in `apps/web/src/lib/map/land-mask.ts` and query the raw SQL `LandMaskPolygon` table before border preview generation.
- Initial area-type classification lives in `apps/web/src/lib/map/area-type-classification.ts` and returns only `STANDARD` until a real land-use dataset/classifier is introduced.
- Kingdom creation server logic reuses the `packages/game` constants instead of duplicating locked starter values in route handlers or UI components.
