import type { BuildingStatusLike, BuildingTypeLike } from "../economy/resource-generation";
import type { UnitTypeLike } from "../economy/food-consumption";
import {
  ACTIVE_CONSTRUCTION_SLOTS,
  BUILDING_CATALOG,
  calculateBuildingCost,
  calculateBuildingTicks,
  getBuildingDefinition,
  MAX_BUILDING_LEVEL,
  type BuildingCost,
} from "./building-catalog";
import {
  ACTIVE_TRAINING_QUEUES,
  calculateTrainingCost,
  getUnitDefinition,
  MAX_TRAINING_BATCH,
  type UnitCost,
} from "../units/unit-catalog";

export type KingdomBuildingState = {
  id: string;
  type: BuildingTypeLike;
  level: number;
  status: BuildingStatusLike;
  districtType: string;
};

export type KingdomActionState = {
  stockpile: { money: number; manpower: number } | null;
  buildings: KingdomBuildingState[];
  districts: Array<{ type: string; allocatedLandM2: number; usedLandM2: number }>;
  activeTrainingQueues: number;
};

export type ConstructionFailureReason =
  | "INVALID_BUILDING"
  | "NOT_BUILDABLE"
  | "MAX_INSTANCES"
  | "MAX_LEVEL"
  | "BUILDING_NOT_FOUND"
  | "BUILDING_BUSY"
  | "SLOT_BUSY"
  | "MISSING_STOCKPILE"
  | "NOT_ENOUGH_LAND"
  | "INSUFFICIENT_MONEY"
  | "INSUFFICIENT_MANPOWER";

export type ConstructionPlan =
  | {
      ok: true;
      buildingType: BuildingTypeLike;
      targetLevel: number;
      cost: BuildingCost;
      ticks: number;
      landFootprintM2: number;
      districtType: string;
    }
  | { ok: false; reason: ConstructionFailureReason };

export type TrainingFailureReason =
  | "INVALID_UNIT"
  | "INVALID_QUANTITY"
  | "NO_BARRACKS"
  | "BARRACKS_LEVEL_TOO_LOW"
  | "QUEUE_BUSY"
  | "MISSING_STOCKPILE"
  | "INSUFFICIENT_MONEY"
  | "INSUFFICIENT_MANPOWER";

export type TrainingPlan =
  | { ok: true; unitType: UnitTypeLike; quantity: number; cost: UnitCost; ticks: number }
  | { ok: false; reason: TrainingFailureReason };

export function countActiveConstruction(buildings: KingdomBuildingState[]): number {
  return buildings.filter((building) => building.status !== "ACTIVE").length;
}

// The level a building is effectively running at. Upgrading rows already carry their target level.
export function getEffectiveBuildingLevel(building: Pick<KingdomBuildingState, "level" | "status">): number {
  switch (building.status) {
    case "ACTIVE":
      return building.level;
    case "UPGRADING":
      return Math.max(0, building.level - 1);
    case "CONSTRUCTING":
      return 0;
  }
}

export function getHighestBarracksLevel(buildings: KingdomBuildingState[]): number {
  return buildings
    .filter((building) => building.type === "BARRACKS")
    .reduce((highest, building) => Math.max(highest, getEffectiveBuildingLevel(building)), 0);
}

export function planNewBuilding(state: KingdomActionState, buildingType: string): ConstructionPlan {
  const definition = getBuildingDefinition(buildingType);

  if (!definition) {
    return { ok: false, reason: "INVALID_BUILDING" };
  }

  if (!definition.buildable) {
    return { ok: false, reason: "NOT_BUILDABLE" };
  }

  if (
    definition.maxInstances !== null &&
    state.buildings.filter((building) => building.type === definition.type).length >= definition.maxInstances
  ) {
    return { ok: false, reason: "MAX_INSTANCES" };
  }

  if (countActiveConstruction(state.buildings) >= ACTIVE_CONSTRUCTION_SLOTS) {
    return { ok: false, reason: "SLOT_BUSY" };
  }

  const district = state.districts.find((candidate) => candidate.type === definition.districtType);

  if (!district || district.allocatedLandM2 - district.usedLandM2 < definition.landFootprintM2) {
    return { ok: false, reason: "NOT_ENOUGH_LAND" };
  }

  const cost = calculateBuildingCost(definition.type, 1);
  const resourceFailure = checkResources(state.stockpile, cost);

  if (resourceFailure) {
    return { ok: false, reason: resourceFailure };
  }

  return {
    ok: true,
    buildingType: definition.type,
    targetLevel: 1,
    cost,
    ticks: calculateBuildingTicks(definition.type, 1),
    landFootprintM2: definition.landFootprintM2,
    districtType: definition.districtType,
  };
}

export function planBuildingUpgrade(state: KingdomActionState, buildingId: string): ConstructionPlan {
  const building = state.buildings.find((candidate) => candidate.id === buildingId);

  if (!building) {
    return { ok: false, reason: "BUILDING_NOT_FOUND" };
  }

  if (building.status !== "ACTIVE") {
    return { ok: false, reason: "BUILDING_BUSY" };
  }

  if (building.level >= MAX_BUILDING_LEVEL) {
    return { ok: false, reason: "MAX_LEVEL" };
  }

  if (countActiveConstruction(state.buildings) >= ACTIVE_CONSTRUCTION_SLOTS) {
    return { ok: false, reason: "SLOT_BUSY" };
  }

  const targetLevel = building.level + 1;
  const cost = calculateBuildingCost(building.type, targetLevel);
  const resourceFailure = checkResources(state.stockpile, cost);

  if (resourceFailure) {
    return { ok: false, reason: resourceFailure };
  }

  return {
    ok: true,
    buildingType: building.type,
    targetLevel,
    cost,
    ticks: calculateBuildingTicks(building.type, targetLevel),
    landFootprintM2: 0,
    districtType: BUILDING_CATALOG[building.type].districtType,
  };
}

export function planTraining(state: KingdomActionState, unitType: string, quantity: number): TrainingPlan {
  const definition = getUnitDefinition(unitType);

  if (!definition) {
    return { ok: false, reason: "INVALID_UNIT" };
  }

  if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_TRAINING_BATCH) {
    return { ok: false, reason: "INVALID_QUANTITY" };
  }

  const barracksLevel = getHighestBarracksLevel(state.buildings);

  if (barracksLevel < 1) {
    return { ok: false, reason: "NO_BARRACKS" };
  }

  if (barracksLevel < definition.requiredBarracksLevel) {
    return { ok: false, reason: "BARRACKS_LEVEL_TOO_LOW" };
  }

  if (state.activeTrainingQueues >= ACTIVE_TRAINING_QUEUES) {
    return { ok: false, reason: "QUEUE_BUSY" };
  }

  const cost = calculateTrainingCost(definition.type, quantity);
  const resourceFailure = checkResources(state.stockpile, cost);

  if (resourceFailure) {
    return { ok: false, reason: resourceFailure };
  }

  return { ok: true, unitType: definition.type, quantity, cost, ticks: definition.trainingTicks };
}

// Largest batch the stockpile can afford right now, capped by the batch limit.
export function calculateMaxAffordableUnits(
  stockpile: { money: number; manpower: number } | null,
  unitType: UnitTypeLike,
): number {
  const definition = getUnitDefinition(unitType);

  if (!stockpile || !definition) {
    return 0;
  }

  return Math.max(
    0,
    Math.min(
      MAX_TRAINING_BATCH,
      Math.floor(stockpile.money / definition.costPerUnit.money),
      Math.floor(stockpile.manpower / definition.costPerUnit.manpower),
    ),
  );
}

function checkResources(
  stockpile: { money: number; manpower: number } | null,
  cost: { money: number; manpower: number },
): "MISSING_STOCKPILE" | "INSUFFICIENT_MONEY" | "INSUFFICIENT_MANPOWER" | null {
  if (!stockpile) {
    return "MISSING_STOCKPILE";
  }

  if (stockpile.money < cost.money) {
    return "INSUFFICIENT_MONEY";
  }

  if (stockpile.manpower < cost.manpower) {
    return "INSUFFICIENT_MANPOWER";
  }

  return null;
}
