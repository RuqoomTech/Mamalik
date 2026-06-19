export type BuildingTypeLike =
  | "FARM"
  | "MARKET"
  | "TAX_OFFICE"
  | "PALACE"
  | "HOUSES"
  | "BARRACKS"
  | "STABLES"
  | "WATCHTOWER"
  | "WALL"
  | "SCHOLAR_HALL";

export type BuildingStatusLike = "ACTIVE" | "CONSTRUCTING" | "UPGRADING";

export type ResourceGenerationInput = {
  population: number;
  buildings: Array<{
    type: BuildingTypeLike;
    level: number;
    status: BuildingStatusLike;
  }>;
};

export type ResourceGenerationResult = {
  money: number;
  food: number;
  manpower: number;
  knowledge: number;
};

export const RESOURCE_GENERATION_RATES = {
  moneyPerPopulation: 0.05,
  manpowerPerPopulation: 0.01,
  marketMoneyPerLevel: 40,
  taxOfficeMoneyPerLevel: 60,
  palaceMoneyPerLevel: 25,
  farmFoodPerLevel: 120,
  housesManpowerPerLevel: 15,
  scholarHallKnowledgePerLevel: 20,
} as const;

export function calculateResourceGeneration(input: ResourceGenerationInput): ResourceGenerationResult {
  const population = toNonNegativeInteger(input.population);
  const result: ResourceGenerationResult = {
    money: Math.floor(population * RESOURCE_GENERATION_RATES.moneyPerPopulation),
    food: 0,
    manpower: Math.floor(population * RESOURCE_GENERATION_RATES.manpowerPerPopulation),
    knowledge: 0,
  };

  for (const building of input.buildings) {
    if (building.status !== "ACTIVE") {
      continue;
    }

    const level = toNonNegativeInteger(building.level);

    switch (building.type) {
      case "MARKET":
        result.money += level * RESOURCE_GENERATION_RATES.marketMoneyPerLevel;
        break;
      case "TAX_OFFICE":
        result.money += level * RESOURCE_GENERATION_RATES.taxOfficeMoneyPerLevel;
        break;
      case "PALACE":
        result.money += level * RESOURCE_GENERATION_RATES.palaceMoneyPerLevel;
        break;
      case "FARM":
        result.food += level * RESOURCE_GENERATION_RATES.farmFoodPerLevel;
        break;
      case "HOUSES":
        result.manpower += level * RESOURCE_GENERATION_RATES.housesManpowerPerLevel;
        break;
      case "SCHOLAR_HALL":
        result.knowledge += level * RESOURCE_GENERATION_RATES.scholarHallKnowledgePerLevel;
        break;
      default:
        break;
    }
  }

  return {
    money: toNonNegativeInteger(result.money),
    food: toNonNegativeInteger(result.food),
    manpower: toNonNegativeInteger(result.manpower),
    knowledge: toNonNegativeInteger(result.knowledge),
  };
}

function toNonNegativeInteger(value: number): number {
  if (!Number.isFinite(value) || value <= 0) {
    return 0;
  }

  return Math.floor(value);
}
