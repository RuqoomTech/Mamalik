# Mamalik v0.2 Data Model Extensions

This document adds v0.2 data model concepts without replacing the v0.1 data model.

## Area classification

Add fields or related model:

```ts
KingdomAreaProfile {
  id
  kingdomId
  areaType: "DENSE_CITY" | "URBAN" | "RESIDENTIAL" | "COMMERCIAL" | "INDUSTRIAL" | "FARMLAND" | "DESERT" | "COASTAL" | "MIXED" | "UNKNOWN"
  confidence: number
  source: "OSM" | "ADMIN" | "FALLBACK"
  moneyMultiplier: number
  foodMultiplier: number
  populationGrowthMultiplier: number
  landPriceMultiplier: number
  updatedAt
}
```

## NPC / wild areas

```ts
WildArea {
  id
  type: "BANDIT_CAMP" | "ABANDONED_VILLAGE" | "RUINS" | "TRADE_CARAVAN" | "WILD_FARMLAND"
  name
  centerLat
  centerLng
  visibleBorderGeojson
  difficultyLevel
  resourceRewardMoney
  resourceRewardFood
  resourceRewardManpower
  resourceRewardKnowledge
  respawnAt
  createdAt
}
```

## Technology tree extensions

```ts
TechnologyDefinition {
  id
  key
  category: "ECONOMY" | "AGRICULTURE" | "MILITARY" | "DEFENSE" | "SCOUTING" | "EXPANSION"
  level
  name
  description
  knowledgeCost
  moneyCost
  durationTicks
  prerequisitesJson
  effectsJson
}

KingdomTechnology {
  id
  kingdomId
  technologyKey
  level
  status: "LOCKED" | "AVAILABLE" | "RESEARCHING" | "COMPLETE"
  remainingTicks
  completedAt
}
```

## Scouting intelligence

```ts
ScoutMission {
  id
  originKingdomId
  targetType: "KINGDOM" | "WILD_AREA"
  targetKingdomId
  targetWildAreaId
  scoutCount
  status: "TRAVELING" | "RESOLVING" | "RETURNING" | "COMPLETE" | "FAILED"
  reportId
  createdAt
  resolvesAt
}
```

## Map layer preferences

```ts
PlayerMapPreference {
  id
  userId
  showKingdomBorders: boolean
  showAllianceColors: boolean
  showWarZones: boolean
  showProtectedKingdoms: boolean
  showWildAreas: boolean
  showAvailableExpansionHints: boolean
  updatedAt
}
```

## Alliance announcements

```ts
AllianceAnnouncement {
  id
  allianceId
  authorKingdomId
  title
  body
  pinned: boolean
  createdAt
  updatedAt
}
```

## Tutorial / onboarding quests

```ts
QuestDefinition {
  id
  key
  title
  description
  triggerType
  targetJson
  rewardJson
  orderIndex
  active
}

KingdomQuestProgress {
  id
  kingdomId
  questKey
  status: "LOCKED" | "ACTIVE" | "COMPLETE" | "CLAIMED"
  progressJson
  completedAt
  claimedAt
}
```

## Notification delivery

v0.2 may add realtime delivery, but notification storage remains database-first:

```ts
NotificationDeliveryState {
  id
  notificationId
  userId
  channel: "IN_APP" | "REALTIME"
  deliveredAt
  readAt
}
```
