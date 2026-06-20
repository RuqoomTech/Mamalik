export type UnitTypeLike = "INFANTRY" | "ARCHERS" | "CAVALRY" | "SCOUTS" | "SIEGE";

export type FoodConsumptionInput = {
  population: number;
  units: Array<{
    unitType: UnitTypeLike;
    quantity: number;
  }>;
};

export type FoodConsumptionResult = {
  populationFoodConsumption: number;
  armyFoodConsumption: number;
  totalFoodConsumption: number;
};

export type FoodAfterTickInput = {
  currentFood: number;
  generatedFood: number;
  totalFoodConsumption: number;
};

export type FoodAfterTickResult = {
  food: number;
  foodShortage: boolean;
};

export const FOOD_CONSUMPTION_RATES = {
  populationFoodPerPerson: 0.02,
  infantryFoodPerUnit: 0.03,
  archersFoodPerUnit: 0.035,
  cavalryFoodPerUnit: 0.06,
  scoutsFoodPerUnit: 0.025,
  siegeFoodPerUnit: 0.12,
} as const;

export function calculateFoodConsumption(input: FoodConsumptionInput): FoodConsumptionResult {
  const population = toNonNegativeInteger(input.population);
  const populationFoodConsumption = Math.floor(population * FOOD_CONSUMPTION_RATES.populationFoodPerPerson);
  let rawArmyFoodConsumption = 0;

  for (const unit of input.units) {
    rawArmyFoodConsumption += toNonNegativeInteger(unit.quantity) * getUnitFoodRate(unit.unitType);
  }

  const armyFoodConsumption = toNonNegativeInteger(Math.ceil(rawArmyFoodConsumption));
  const totalFoodConsumption = populationFoodConsumption + armyFoodConsumption;

  return {
    populationFoodConsumption,
    armyFoodConsumption,
    totalFoodConsumption,
  };
}

export function calculateFoodAfterTick(input: FoodAfterTickInput): FoodAfterTickResult {
  const currentFood = toNonNegativeInteger(input.currentFood);
  const generatedFood = toNonNegativeInteger(input.generatedFood);
  const totalFoodConsumption = toNonNegativeInteger(input.totalFoodConsumption);
  const availableFood = currentFood + generatedFood;
  const nextFood = availableFood - totalFoodConsumption;

  return {
    food: Math.max(0, nextFood),
    foodShortage: availableFood < totalFoodConsumption,
  };
}

function getUnitFoodRate(unitType: UnitTypeLike): number {
  switch (unitType) {
    case "INFANTRY":
      return FOOD_CONSUMPTION_RATES.infantryFoodPerUnit;
    case "ARCHERS":
      return FOOD_CONSUMPTION_RATES.archersFoodPerUnit;
    case "CAVALRY":
      return FOOD_CONSUMPTION_RATES.cavalryFoodPerUnit;
    case "SCOUTS":
      return FOOD_CONSUMPTION_RATES.scoutsFoodPerUnit;
    case "SIEGE":
      return FOOD_CONSUMPTION_RATES.siegeFoodPerUnit;
    default:
      throw new Error(`Unknown unit type for Food consumption: ${String(unitType)}`);
  }
}

function toNonNegativeInteger(value: number): number {
  if (!Number.isFinite(value) || value <= 0) {
    return 0;
  }

  return Math.floor(value);
}
