import type { BuildingTypeLike } from "../economy/resource-generation";

export type DistrictTypeLike = "ECONOMIC" | "MILITARY" | "RESIDENTIAL" | "RESEARCH" | "DEFENSIVE";

export type BuildingCost = {
  money: number;
  manpower: number;
};

export type BuildingDefinition = {
  type: BuildingTypeLike;
  label: string;
  description: string;
  districtType: DistrictTypeLike;
  landFootprintM2: number;
  baseCost: BuildingCost;
  baseTicks: number;
  buildable: boolean;
  maxInstances: number | null;
};

export const MAX_BUILDING_LEVEL = 10;
export const ACTIVE_CONSTRUCTION_SLOTS = 1;

// v0.1 balance baseline. Cost and duration scale linearly with the target level.
// New buildings consume their footprint from the district; upgrades reuse the same land.
export const BUILDING_CATALOG: Record<BuildingTypeLike, BuildingDefinition> = {
  FARM: {
    type: "FARM",
    label: "Farm",
    description: "Produces Food every tick.",
    districtType: "ECONOMIC",
    landFootprintM2: 1_000,
    baseCost: { money: 1_200, manpower: 40 },
    baseTicks: 3,
    buildable: true,
    maxInstances: null,
  },
  MARKET: {
    type: "MARKET",
    label: "Market",
    description: "Adds Money every tick.",
    districtType: "ECONOMIC",
    landFootprintM2: 1_000,
    baseCost: { money: 1_500, manpower: 40 },
    baseTicks: 3,
    buildable: true,
    maxInstances: null,
  },
  TAX_OFFICE: {
    type: "TAX_OFFICE",
    label: "Tax Office",
    description: "Adds more Money every tick than a Market.",
    districtType: "ECONOMIC",
    landFootprintM2: 1_000,
    baseCost: { money: 2_500, manpower: 60 },
    baseTicks: 4,
    buildable: true,
    maxInstances: null,
  },
  PALACE: {
    type: "PALACE",
    label: "Palace",
    description: "Seat of the kingdom. Adds Money every tick. One per kingdom.",
    districtType: "RESIDENTIAL",
    landFootprintM2: 1_000,
    baseCost: { money: 4_000, manpower: 100 },
    baseTicks: 6,
    buildable: true,
    maxInstances: 1,
  },
  HOUSES: {
    type: "HOUSES",
    label: "Houses",
    description: "Adds Manpower every tick.",
    districtType: "RESIDENTIAL",
    landFootprintM2: 1_000,
    baseCost: { money: 1_000, manpower: 20 },
    baseTicks: 2,
    buildable: true,
    maxInstances: null,
  },
  BARRACKS: {
    type: "BARRACKS",
    label: "Barracks",
    description: "Required to train units. Higher levels unlock Cavalry and Siege.",
    districtType: "MILITARY",
    landFootprintM2: 1_000,
    baseCost: { money: 2_000, manpower: 60 },
    baseTicks: 4,
    buildable: true,
    maxInstances: null,
  },
  STABLES: {
    type: "STABLES",
    label: "Stables",
    description: "Planned for a later release.",
    districtType: "MILITARY",
    landFootprintM2: 1_000,
    baseCost: { money: 2_500, manpower: 60 },
    baseTicks: 4,
    buildable: false,
    maxInstances: null,
  },
  WATCHTOWER: {
    type: "WATCHTOWER",
    label: "Watchtower",
    description: "Strengthens kingdom defense.",
    districtType: "DEFENSIVE",
    landFootprintM2: 1_000,
    baseCost: { money: 1_500, manpower: 50 },
    baseTicks: 3,
    buildable: true,
    maxInstances: null,
  },
  WALL: {
    type: "WALL",
    label: "Wall",
    description: "Major defensive bonus. Siege is needed to break high-level walls.",
    districtType: "DEFENSIVE",
    landFootprintM2: 1_000,
    baseCost: { money: 3_000, manpower: 120 },
    baseTicks: 5,
    buildable: true,
    maxInstances: null,
  },
  SCHOLAR_HALL: {
    type: "SCHOLAR_HALL",
    label: "Scholar Hall",
    description: "Produces Knowledge every tick.",
    districtType: "RESEARCH",
    landFootprintM2: 1_000,
    baseCost: { money: 2_000, manpower: 40 },
    baseTicks: 4,
    buildable: true,
    maxInstances: null,
  },
};

export const BUILDING_TYPES = Object.keys(BUILDING_CATALOG) as BuildingTypeLike[];

export function getBuildingDefinition(type: string): BuildingDefinition | null {
  return Object.prototype.hasOwnProperty.call(BUILDING_CATALOG, type)
    ? BUILDING_CATALOG[type as BuildingTypeLike]
    : null;
}

export function getBuildingLabel(type: string): string {
  return getBuildingDefinition(type)?.label ?? type;
}

export function calculateBuildingCost(type: BuildingTypeLike, targetLevel: number): BuildingCost {
  const definition = BUILDING_CATALOG[type];
  const level = clampLevel(targetLevel);

  return {
    money: definition.baseCost.money * level,
    manpower: definition.baseCost.manpower * level,
  };
}

export function calculateBuildingTicks(type: BuildingTypeLike, targetLevel: number): number {
  return BUILDING_CATALOG[type].baseTicks * clampLevel(targetLevel);
}

function clampLevel(level: number): number {
  if (!Number.isFinite(level) || level < 1) {
    return 1;
  }

  return Math.min(MAX_BUILDING_LEVEL, Math.floor(level));
}
