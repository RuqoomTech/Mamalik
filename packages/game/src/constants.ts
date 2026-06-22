export { LAND_PURCHASE_PACKAGES } from "./land/land-packages";

export const STARTING_USABLE_LAND_M2 = 50_000;
export const TEMPORARY_VISIBLE_AREA_M2 = 50_000;
export const TEMPORARY_MIN_KINGDOM_DISTANCE_M = 250;
export const TICK_DURATION_MINUTES = 10;
export const TICK_DURATION_MS = TICK_DURATION_MINUTES * 60 * 1000;

export const STARTING_POPULATION = 1_000;
export const BEGINNER_PROTECTION_DAYS = 3;

export const STARTING_RESOURCES = {
  money: 10_000,
  food: 5_000,
  manpower: 500,
  knowledge: 0,
} as const;

export const STARTING_DISTRICTS = [
  { type: "ECONOMIC", label: "Economic", allocatedLandM2: 15_000 },
  { type: "RESIDENTIAL", label: "Residential", allocatedLandM2: 12_000 },
  { type: "MILITARY", label: "Military", allocatedLandM2: 8_000 },
  { type: "DEFENSIVE", label: "Defensive", allocatedLandM2: 8_000 },
  { type: "RESEARCH", label: "Research", allocatedLandM2: 7_000 },
] as const;

export const STARTER_BUILDINGS = [
  { type: "PALACE", label: "Palace", districtType: "RESIDENTIAL", landUsedM2: 1_000 },
  { type: "HOUSES", label: "Houses", districtType: "RESIDENTIAL", landUsedM2: 1_000 },
  { type: "MARKET", label: "Market", districtType: "ECONOMIC", landUsedM2: 1_000 },
  { type: "FARM", label: "Farm", districtType: "ECONOMIC", landUsedM2: 1_000 },
  { type: "BARRACKS", label: "Barracks", districtType: "MILITARY", landUsedM2: 1_000 },
  { type: "WATCHTOWER", label: "Watchtower", districtType: "DEFENSIVE", landUsedM2: 1_000 },
  { type: "SCHOLAR_HALL", label: "Scholar Hall", districtType: "RESEARCH", landUsedM2: 1_000 },
] as const;

export const STARTER_UNITS = [
  { type: "INFANTRY", label: "Infantry", quantity: 100 },
  { type: "ARCHERS", label: "Archers", quantity: 25 },
] as const;
