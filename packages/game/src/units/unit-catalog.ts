import type { UnitTypeLike } from "../economy/food-consumption";

export type UnitCost = {
  money: number;
  manpower: number;
};

export type UnitDefinition = {
  type: UnitTypeLike;
  label: string;
  description: string;
  costPerUnit: UnitCost;
  trainingTicks: number;
  requiredBarracksLevel: number;
  attack: number;
  defense: number;
};

export const MAX_TRAINING_BATCH = 500;
export const ACTIVE_TRAINING_QUEUES = 1;

// v0.1 balance baseline. Attack/defense values are display stats for now; combat uses them in Sprint 5.
export const UNIT_CATALOG: Record<UnitTypeLike, UnitDefinition> = {
  INFANTRY: {
    type: "INFANTRY",
    label: "Infantry",
    description: "Cheap, steady defenders.",
    costPerUnit: { money: 20, manpower: 1 },
    trainingTicks: 2,
    requiredBarracksLevel: 1,
    attack: 4,
    defense: 6,
  },
  ARCHERS: {
    type: "ARCHERS",
    label: "Archers",
    description: "Strong behind walls.",
    costPerUnit: { money: 30, manpower: 1 },
    trainingTicks: 3,
    requiredBarracksLevel: 1,
    attack: 5,
    defense: 8,
  },
  SCOUTS: {
    type: "SCOUTS",
    label: "Scouts",
    description: "Fast riders that gather intelligence.",
    costPerUnit: { money: 40, manpower: 1 },
    trainingTicks: 2,
    requiredBarracksLevel: 1,
    attack: 1,
    defense: 1,
  },
  CAVALRY: {
    type: "CAVALRY",
    label: "Cavalry",
    description: "Hard-hitting attackers. Needs Barracks level 2.",
    costPerUnit: { money: 80, manpower: 2 },
    trainingTicks: 4,
    requiredBarracksLevel: 2,
    attack: 12,
    defense: 5,
  },
  SIEGE: {
    type: "SIEGE",
    label: "Siege",
    description: "Breaks high-level walls. Needs Barracks level 3.",
    costPerUnit: { money: 250, manpower: 5 },
    trainingTicks: 6,
    requiredBarracksLevel: 3,
    attack: 20,
    defense: 2,
  },
};

export const UNIT_TYPES = Object.keys(UNIT_CATALOG) as UnitTypeLike[];

export function getUnitDefinition(type: string): UnitDefinition | null {
  return Object.prototype.hasOwnProperty.call(UNIT_CATALOG, type)
    ? UNIT_CATALOG[type as UnitTypeLike]
    : null;
}

export function getUnitLabel(type: string): string {
  return getUnitDefinition(type)?.label ?? type;
}

export function calculateTrainingCost(type: UnitTypeLike, quantity: number): UnitCost {
  const definition = UNIT_CATALOG[type];

  return {
    money: definition.costPerUnit.money * quantity,
    manpower: definition.costPerUnit.manpower * quantity,
  };
}
