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
- `ReportType`: `BATTLE`, `SCOUT`, `LAND_PURCHASE`, `CONSTRUCTION`, `TRAINING`

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
- `usedLandM2` starts as the sum of starter building footprints.
- `AreaType.STANDARD` is the only initial area type. More area categories may be added when land pricing needs them; area-type bonuses remain post-v0.1.

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
- Construction and upgrade queue tables are deferred until Sprint 2.

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
- Movement order tables are deferred until Sprint 5.

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
- Purchase history and price records are deferred until Sprint 3.

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
- Report center behavior is deferred until Sprint 6.

## Dashboard Read Model

Sprint 1 Task 16 adds a server-side dashboard read model in `apps/web/src/lib/kingdom/dashboard-data.ts`.

The dashboard reads:

- `Kingdom`
- `ResourceStockpile`
- `District`
- `BuildingInstance` with `District`
- `UnitStack`

The read model derives display-only values such as free land, district free land, enum labels, and beginner-protection remaining time. It does not mutate game state.

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

The admin read model uses explicit `select` fields and row limits for Sprint 1 inspection. It derives display-only values such as free land, enum labels, and report read/unread state. It does not mutate game state and does not expose admin write actions.

## Deferred Queue Models

These remain planned but are not part of Sprint 1 Task 6:

### ConstructionQueueItem

- `id`
- `kingdomId`
- `buildingId`
- `buildingType`
- `actionType`: `BUILD | UPGRADE`
- `remainingTicks`
- `status`

### TrainingQueueItem

- `id`
- `kingdomId`
- `unitType`
- `quantity`
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

## Deferred Alliances, Rankings, And Tick Logs

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

### TickLog

- `id`
- `tickStartedAt`
- `tickFinishedAt`
- `status`
- `processedKingdomCount`
- `errorMessage`

## Implementation Notes

- Prisma tooling lives in `packages/db`.
- The generated Prisma client output path is `packages/db/generated/prisma` and is ignored.
- PostGIS geometry fields may require raw SQL migration support.
- Shared starter-state constants now live in `packages/game/src/constants.ts`, including starting usable land, population, resources, district allocations, starter buildings and land footprints, starter units, land purchase packages, beginner protection, and temporary validation constants.
- Kingdom creation server logic reuses the `packages/game` constants instead of duplicating locked starter values in route handlers or UI components.
