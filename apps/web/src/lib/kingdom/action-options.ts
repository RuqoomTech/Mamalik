import {
  BUILDING_CATALOG,
  BUILDING_TYPES,
  calculateMaxAffordableUnits,
  formatTicksAsDuration,
  planBuildingUpgrade,
  planNewBuilding,
  planTraining,
  UNIT_CATALOG,
  UNIT_TYPES,
  type BuildingStatusLike,
  type BuildingTypeLike,
  type ConstructionFailureReason,
  type KingdomActionState,
  type TrainingFailureReason,
} from "@mamalik/game";
import type { KingdomDashboardData } from "@/lib/kingdom/dashboard-data";

export type BuildOption = {
  buildingType: string;
  label: string;
  description: string;
  districtLabel: string;
  money: number;
  manpower: number;
  duration: string;
  blockedReason: string | null;
};

export type UpgradeOption = {
  buildingId: string;
  targetLevel: number;
  money: number;
  manpower: number;
  duration: string;
  blockedReason: string | null;
};

export type TrainOption = {
  unitType: string;
  label: string;
  description: string;
  attack: number;
  defense: number;
  money: number;
  manpower: number;
  duration: string;
  maxAffordable: number;
  blockedReason: string | null;
};

const SHORT_CONSTRUCTION_REASONS: Record<ConstructionFailureReason, string> = {
  INVALID_BUILDING: "Unavailable",
  NOT_BUILDABLE: "Coming later",
  MAX_INSTANCES: "Already built",
  MAX_LEVEL: "Max level",
  BUILDING_NOT_FOUND: "Unavailable",
  BUILDING_BUSY: "In progress",
  SLOT_BUSY: "Builders busy",
  MISSING_STOCKPILE: "Unavailable",
  NOT_ENOUGH_LAND: "Needs district land",
  INSUFFICIENT_MONEY: "Not enough Money",
  INSUFFICIENT_MANPOWER: "Not enough Manpower",
};

const SHORT_TRAINING_REASONS: Partial<Record<TrainingFailureReason, string>> = {
  NO_BARRACKS: "Needs Barracks",
  BARRACKS_LEVEL_TOO_LOW: "Needs better Barracks",
  QUEUE_BUSY: "Barracks busy",
  INSUFFICIENT_MONEY: "Not enough Money",
  INSUFFICIENT_MANPOWER: "Not enough Manpower",
};

const districtLabels: Record<string, string> = {
  ECONOMIC: "Economic",
  RESIDENTIAL: "Residential",
  MILITARY: "Military",
  DEFENSIVE: "Defensive",
  RESEARCH: "Research",
};

export function toActionState(data: KingdomDashboardData): KingdomActionState {
  return {
    stockpile: { money: data.resources.money, manpower: data.resources.manpower },
    buildings: data.buildings.map((building) => ({
      id: building.id,
      type: building.type as BuildingTypeLike,
      level: building.level,
      status: building.status as BuildingStatusLike,
      districtType: building.districtType,
    })),
    districts: data.districts.map((district) => ({
      type: district.type,
      allocatedLandM2: district.allocatedLandM2,
      usedLandM2: district.usedLandM2,
    })),
    activeTrainingQueues: data.trainingQueues.length,
  };
}

export function createBuildOptions(data: KingdomDashboardData): BuildOption[] {
  const state = toActionState(data);

  return BUILDING_TYPES.filter((type) => BUILDING_CATALOG[type].buildable).map((type) => {
    const definition = BUILDING_CATALOG[type];
    const plan = planNewBuilding(state, type);

    return {
      buildingType: type,
      label: definition.label,
      description: definition.description,
      districtLabel: districtLabels[definition.districtType] ?? definition.districtType,
      money: definition.baseCost.money,
      manpower: definition.baseCost.manpower,
      duration: formatTicksAsDuration(definition.baseTicks),
      blockedReason: plan.ok ? null : SHORT_CONSTRUCTION_REASONS[plan.reason],
    };
  });
}

export function createUpgradeOptions(data: KingdomDashboardData): Map<string, UpgradeOption> {
  const state = toActionState(data);
  const options = new Map<string, UpgradeOption>();

  for (const building of state.buildings) {
    const plan = planBuildingUpgrade(state, building.id);
    const targetLevel = building.level + 1;
    const definition = BUILDING_CATALOG[building.type];

    options.set(building.id, {
      buildingId: building.id,
      targetLevel,
      money: definition.baseCost.money * targetLevel,
      manpower: definition.baseCost.manpower * targetLevel,
      duration: formatTicksAsDuration(definition.baseTicks * targetLevel),
      blockedReason: plan.ok ? null : SHORT_CONSTRUCTION_REASONS[plan.reason],
    });
  }

  return options;
}

export function createTrainOptions(data: KingdomDashboardData): TrainOption[] {
  const state = toActionState(data);

  return UNIT_TYPES.map((type) => {
    const definition = UNIT_CATALOG[type];
    const plan = planTraining(state, type, 1);

    return {
      unitType: type,
      label: definition.label,
      description: definition.description,
      attack: definition.attack,
      defense: definition.defense,
      money: definition.costPerUnit.money,
      manpower: definition.costPerUnit.manpower,
      duration: formatTicksAsDuration(definition.trainingTicks),
      maxAffordable: calculateMaxAffordableUnits(state.stockpile, type),
      blockedReason: plan.ok ? null : (SHORT_TRAINING_REASONS[plan.reason] ?? "Unavailable"),
    };
  });
}
