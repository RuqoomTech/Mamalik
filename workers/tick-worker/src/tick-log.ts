export type TickRunStatus = "COMPLETED" | "FAILED" | "SKIPPED";

export type ResourceGenerationSummary = {
  money: number;
  food: number;
  manpower: number;
  knowledge: number;
  populationTax: number;
  populationManpowerGrowth: number;
};

export type FoodConsumptionSummary = {
  population: number;
  army: number;
  total: number;
  kingdomsWithFoodShortage: number;
};

export type TickRunResult = {
  tickKey: string;
  status: TickRunStatus;
  processedKingdomCount: number;
  resourceGeneration?: ResourceGenerationSummary;
  foodConsumption?: FoodConsumptionSummary;
  warnings?: string[];
  startedAt: Date;
  finishedAt: Date;
  errorMessage?: string;
};

export function isDuplicateTickInsert(insertedRowCount: number): boolean {
  return insertedRowCount === 0;
}

export function toErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  if (typeof error === "string" && error.trim().length > 0) {
    return error;
  }

  return "Unknown tick worker error.";
}

export function formatTickRunResult(result: TickRunResult): string {
  const lines = [
    `Tick key: ${result.tickKey}`,
    `Status: ${result.status}`,
    `Processed kingdoms: ${result.processedKingdomCount}`,
    `Started at: ${result.startedAt.toISOString()}`,
    `Finished at: ${result.finishedAt.toISOString()}`,
  ];

  if (result.resourceGeneration) {
    lines.push(
      `Generated money: ${result.resourceGeneration.money}`,
      `Generated food: ${result.resourceGeneration.food}`,
      `Generated manpower: ${result.resourceGeneration.manpower}`,
      `Generated knowledge: ${result.resourceGeneration.knowledge}`,
      `Population tax generated: ${result.resourceGeneration.populationTax}`,
      `Population manpower generated: ${result.resourceGeneration.populationManpowerGrowth}`,
    );
  }

  if (result.foodConsumption) {
    lines.push(
      `Consumed food: ${result.foodConsumption.total}`,
      `Population food consumed: ${result.foodConsumption.population}`,
      `Army food consumed: ${result.foodConsumption.army}`,
      `Kingdoms with Food shortage: ${result.foodConsumption.kingdomsWithFoodShortage}`,
    );
  }

  if (result.warnings && result.warnings.length > 0) {
    lines.push("Warnings:");
    lines.push(...result.warnings.map((warning) => `- ${warning}`));
  }

  if (result.errorMessage) {
    lines.push(`Error: ${result.errorMessage}`);
  }

  return lines.join("\n");
}
