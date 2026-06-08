# 05 — Data Model Draft

This is a first-pass model list. It is not the final Prisma schema, but it is enough to guide implementation.

## Core models

### User

- id
- email
- displayName
- authProvider
- createdAt
- updatedAt

### Kingdom

- id
- userId
- name
- slug
- centerLat
- centerLng
- visibleBorderGeojson
- visibleAreaM2
- usableLandM2
- usedLandM2
- population
- protectionEndsAt
- areaType
- createdAt
- updatedAt

### District

- id
- kingdomId
- type: ECONOMIC | MILITARY | RESIDENTIAL | RESEARCH | DEFENSIVE
- allocatedLandM2
- usedLandM2

### ResourceStockpile

- id
- kingdomId
- money
- food
- manpower
- knowledge
- updatedAt

### BuildingInstance

- id
- kingdomId
- districtId
- type
- level
- status: ACTIVE | CONSTRUCTING | UPGRADING
- landUsedM2
- constructionRemainingTicks

### UnitStack

- id
- kingdomId
- unitType
- quantity
- locationType: GARRISON | MOVING

### ConstructionQueueItem

- id
- kingdomId
- buildingId nullable
- buildingType
- actionType: BUILD | UPGRADE
- remainingTicks
- status

### TrainingQueueItem

- id
- kingdomId
- unitType
- quantity
- remainingTicks
- status

### LandPurchaseCooldown

- id
- kingdomId
- packageSizeM2
- availableAt

### LandPurchase

- id
- kingdomId
- packageSizeM2
- pricePaid
- createdAt

### MovementOrder

- id
- sourceKingdomId
- targetKingdomId
- orderType: SCOUT | ATTACK | RETURN
- unitsJson
- status
- distanceM
- travelTicks
- departureAt
- arrivalAt

### Battle

- id
- attackerKingdomId
- defenderKingdomId
- winnerKingdomId nullable
- attackerPower
- defenderPower
- landCapturedM2
- resolvedAt

### Report

- id
- kingdomId
- type: BATTLE | SCOUT | LAND_PURCHASE | CONSTRUCTION | TRAINING
- title
- bodyJson
- readAt nullable
- createdAt

### Alliance

- id
- name
- tag
- description
- leaderKingdomId
- memberLimit
- createdAt

### AllianceMember

- id
- allianceId
- kingdomId
- role: LEADER | MEMBER
- joinedAt

### DiplomacyRelation

- id
- sourceKingdomId or allianceId later
- targetKingdomId or allianceId later
- state: NEUTRAL | ALLY | WAR
- createdAt

### TickLog

- id
- tickStartedAt
- tickFinishedAt
- status
- processedKingdomCount
- errorMessage nullable

