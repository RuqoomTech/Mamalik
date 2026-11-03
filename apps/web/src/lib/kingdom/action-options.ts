import {
  BUILDING_CATALOG,
  BUILDING_TYPES,
  calculateMaxAffordableUnits,
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

// Options for the Buildings and Army tables. Reasons are codes; the UI localizes them.

export type BuildOption = {
  buildingType: string;
  districtType: string;
  money: number;
  manpower: number;
  ticks: number;
  blockedReason: ConstructionFailureReason | null;
};

export type UpgradeOption = {
  buildingId: string;
  targetLevel: number;
  money: number;
  manpower: number;
  ticks: number;
  blockedReason: ConstructionFailureReason | null;
};

export type TrainOption = {
  unitType: string;
  attack: number;
  defense: number;
  money: number;
  manpower: number;
  ticks: number;
  maxAffordable: number;
  blockedReason: TrainingFailureReason | null;
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
      districtType: definition.districtType,
      money: definition.baseCost.money,
      manpower: definition.baseCost.manpower,
      ticks: definition.baseTicks,
      blockedReason: plan.ok ? null : plan.reason,
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
      ticks: definition.baseTicks * targetLevel,
      blockedReason: plan.ok ? null : plan.reason,
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
      attack: definition.attack,
      defense: definition.defense,
      money: definition.costPerUnit.money,
      manpower: definition.costPerUnit.manpower,
      ticks: definition.trainingTicks,
      maxAffordable: calculateMaxAffordableUnits(state.stockpile, type),
      blockedReason: plan.ok ? null : plan.reason,
    };
  });
}
