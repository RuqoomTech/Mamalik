# 04 — Data Model Draft

This is a first draft, not the final Prisma schema.

## Core models

### User

```ts
User {
  id: string
  email: string
  displayName: string
  authProvider: "email" | "google"
  createdAt: Date
  updatedAt: Date
}
```

### Kingdom

```ts
Kingdom {
  id: string
  ownerId: string

  name: string
  slug: string

  centerLat: number
  centerLng: number

  visibleBorderGeojson: Json
  visibleAreaM2: number
  usableLandM2: number // starts at 50,000
  usedLandM2: number

  areaType: "dense_city" | "suburb" | "town" | "rural" | "desert" | "commercial" | "industrial" | "unknown"
  bufferM: number

  population: number
  protectionEndsAt: Date

  createdAt: Date
  updatedAt: Date
}
```

### District

```ts
District {
  id: string
  kingdomId: string
  type: "economic" | "military" | "residential" | "research" | "defensive"
  allocatedLandM2: number
  usedLandM2: number
}
```

### ResourceStockpile

```ts
ResourceStockpile {
  kingdomId: string
  money: number
  food: number
  manpower: number
  knowledge: number
  updatedAt: Date
}
```

### BuildingInstance

```ts
BuildingInstance {
  id: string
  kingdomId: string
  districtId: string
  type: "palace" | "houses" | "farm" | "market" | "tax_office" | "barracks" | "stables" | "watchtower" | "wall" | "scholar_hall"
  level: number
  landUsedM2: number
  status: "active" | "constructing" | "upgrading"
  createdAt: Date
  updatedAt: Date
}
```

### ConstructionJob

```ts
ConstructionJob {
  id: string
  kingdomId: string
  buildingId: string?
  buildingType: string
  action: "build" | "upgrade"
  startedAtTick: number
  endsAtTick: number
  status: "queued" | "active" | "complete" | "cancelled"
}
```

### UnitStack

```ts
UnitStack {
  id: string
  kingdomId: string
  unitType: "infantry" | "archer" | "cavalry" | "scout" | "siege"
  quantity: number
  location: "home" | "moving" | "garrisoned"
}
```

### TrainingJob

```ts
TrainingJob {
  id: string
  kingdomId: string
  unitType: string
  quantity: number
  startedAtTick: number
  endsAtTick: number
  status: "queued" | "active" | "complete" | "cancelled"
}
```

### ArmyMovement

```ts
ArmyMovement {
  id: string
  sourceKingdomId: string
  targetKingdomId: string?
  missionType: "attack" | "scout" | "return"
  unitPayload: Json
  departTick: number
  arrivalTick: number
  status: "moving" | "arrived" | "returning" | "resolved"
}
```

### LandPurchaseCooldown

```ts
LandPurchaseCooldown {
  id: string
  kingdomId: string
  packageM2: 500 | 1000 | 5000 | 10000
  availableAt: Date
}
```

### WarLandCaptureLedger

```ts
WarLandCaptureLedger {
  id: string
  attackerKingdomId: string
  defenderKingdomId: string
  capturedM2: number
  capturedAt: Date
  cooldownEndsAt: Date
}
```

### Alliance

```ts
Alliance {
  id: string
  name: string
  tag: string
  description: string
  leaderKingdomId: string
  memberLimit: number // 20 in v0.1
  createdAt: Date
}
```

### AllianceMember

```ts
AllianceMember {
  allianceId: string
  kingdomId: string
  role: "leader" | "member"
  joinedAt: Date
}
```

### DiplomacyRelation

```ts
DiplomacyRelation {
  id: string
  sourceKingdomId: string
  targetKingdomId: string
  state: "neutral" | "ally" | "war"
}
```

### Report

```ts
Report {
  id: string
  kingdomId: string
  type: "battle" | "scout" | "land_purchase" | "construction" | "training"
  title: string
  body: Json
  readAt: Date?
  createdAt: Date
}
```

### Notification

```ts
Notification {
  id: string
  kingdomId: string
  type: string
  title: string
  body: string
  readAt: Date?
  createdAt: Date
}
```

## Seed values

### Starting kingdom

```ts
usableLandM2 = 50000
population = 1000
money = 10000
food = 5000
manpower = 500
knowledge = 0
protectionDays = 3
```

### Districts

```ts
economic = 15000
residential = 12000
military = 8000
defensive = 8000
research = 7000
```

### Starter units

```ts
infantry = 100
archer = 25
```
