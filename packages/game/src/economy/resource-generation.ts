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

export type ResourceGenerationTotals = {
  money: number;
  food: number;
  manpower: number;
  knowledge: number;
};

export type ResourceGenerationBreakdown = {
  money: {
    populationTax: number;
    marketBonus: number;
    taxOfficeBonus: number;
    palaceBonus: number;
    total: number;
  };
  food: {
    farmProduction: number;
    total: number;
  };
  manpower: {
    populationManpowerGrowth: number;
    housesBonus: number;
    total: number;
  };
  knowledge: {
    scholarHallProduction: number;
    total: number;
  };
};

export type ResourceGenerationResult = ResourceGenerationBreakdown;

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
  const result: ResourceGenerationBreakdown = {
    money: {
      populationTax: Math.floor(population * RESOURCE_GENERATION_RATES.moneyPerPopulation),
      marketBonus: 0,
      taxOfficeBonus: 0,
      palaceBonus: 0,
      total: 0,
    },
    food: {
      farmProduction: 0,
      total: 0,
    },
    manpower: {
      populationManpowerGrowth: Math.floor(population * RESOURCE_GENERATION_RATES.manpowerPerPopulation),
      housesBonus: 0,
      total: 0,
    },
    knowledge: {
      scholarHallProduction: 0,
      total: 0,
    },
  };

  for (const building of input.buildings) {
    if (building.status !== "ACTIVE") {
      continue;
    }

    const level = toNonNegativeInteger(building.level);

    switch (building.type) {
      case "MARKET":
        result.money.marketBonus += level * RESOURCE_GENERATION_RATES.marketMoneyPerLevel;
        break;
      case "TAX_OFFICE":
        result.money.taxOfficeBonus += level * RESOURCE_GENERATION_RATES.taxOfficeMoneyPerLevel;
        break;
      case "PALACE":
        result.money.palaceBonus += level * RESOURCE_GENERATION_RATES.palaceMoneyPerLevel;
        break;
      case "FARM":
        result.food.farmProduction += level * RESOURCE_GENERATION_RATES.farmFoodPerLevel;
        break;
      case "HOUSES":
        result.manpower.housesBonus += level * RESOURCE_GENERATION_RATES.housesManpowerPerLevel;
        break;
      case "SCHOLAR_HALL":
        result.knowledge.scholarHallProduction += level * RESOURCE_GENERATION_RATES.scholarHallKnowledgePerLevel;
        break;
      default:
        break;
    }
  }

  result.money.total = toNonNegativeInteger(
    result.money.populationTax + result.money.marketBonus + result.money.taxOfficeBonus + result.money.palaceBonus,
  );
  result.food.total = toNonNegativeInteger(result.food.farmProduction);
  result.manpower.total = toNonNegativeInteger(result.manpower.populationManpowerGrowth + result.manpower.housesBonus);
  result.knowledge.total = toNonNegativeInteger(result.knowledge.scholarHallProduction);

  return result;
}

export function getResourceGenerationTotals(generation: ResourceGenerationBreakdown): ResourceGenerationTotals {
  return {
    money: generation.money.total,
    food: generation.food.total,
    manpower: generation.manpower.total,
    knowledge: generation.knowledge.total,
  };
}

function toNonNegativeInteger(value: number): number {
  if (!Number.isFinite(value) || value <= 0) {
    return 0;
  }

  return Math.floor(value);
}
