# 04 - Data Model

This is the canonical v0.1 data-model plan. It is not yet a final Prisma schema.

## Core Models

### User

- `id`
- `email`
- `displayName`
- `authProvider`
- `role`
- `createdAt`
- `updatedAt`

### Kingdom

- `id`
- `userId`
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
- `createdAt`
- `updatedAt`

### District

- `id`
- `kingdomId`
- `type`: `ECONOMIC | MILITARY | RESIDENTIAL | RESEARCH | DEFENSIVE`
- `allocatedLandM2`
- `usedLandM2`

### ResourceStockpile

- `id`
- `kingdomId`
- `money`
- `food`
- `manpower`
- `knowledge`
- `updatedAt`

### BuildingInstance

- `id`
- `kingdomId`
- `districtId`
- `type`
- `level`
- `status`: `ACTIVE | CONSTRUCTING | UPGRADING`
- `landUsedM2`
- `constructionRemainingTicks`

### UnitStack

- `id`
- `kingdomId`
- `unitType`: `INFANTRY | ARCHERS | CAVALRY | SCOUTS | SIEGE`
- `quantity`
- `locationType`: `GARRISON | MOVING`

## Queue Models

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

## Land Models

### LandPurchaseCooldown

- `id`
- `kingdomId`
- `packageSizeM2`
- `availableAt`

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

## Movement And Combat Models

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

## Reports, Alliances, Rankings

### Report

- `id`
- `kingdomId`
- `type`: `BATTLE | SCOUT | LAND_PURCHASE | CONSTRUCTION | TRAINING`
- `title`
- `bodyJson`
- `readAt`
- `createdAt`

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

- Final Prisma model names and field types should be locked during Sprint 1 database setup.
- PostGIS geometry fields may require raw SQL migration support.
- Domain constants should live in `packages/game` once the project is initialized.
