export const STARTING_USABLE_LAND_M2 = 50_000;
export const TEMPORARY_VISIBLE_AREA_M2 = 50_000;
export const TEMPORARY_MIN_KINGDOM_DISTANCE_M = 250;

export const STARTING_POPULATION = 1_000;
export const BEGINNER_PROTECTION_DAYS = 3;

export const STARTING_RESOURCES = {
  money: 10_000,
  food: 5_000,
  manpower: 500,
  knowledge: 0,
} as const;

export const STARTING_DISTRICTS = [
  { type: "Economic", allocatedLandM2: 15_000 },
  { type: "Residential", allocatedLandM2: 12_000 },
  { type: "Military", allocatedLandM2: 8_000 },
  { type: "Defensive", allocatedLandM2: 8_000 },
  { type: "Research", allocatedLandM2: 7_000 },
] as const;

export const STARTER_BUILDINGS = [
  "Palace",
  "Houses",
  "Market",
  "Farm",
  "Barracks",
  "Watchtower",
  "Scholar Hall",
] as const;

export const STARTER_UNITS = [
  { type: "Infantry", quantity: 100 },
  { type: "Archers", quantity: 25 },
] as const;
