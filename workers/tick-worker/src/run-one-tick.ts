import { randomUUID } from "node:crypto";

import { getPrismaClient, type MamalikPrismaClient } from "../../../packages/db/src/client";
import { progressConstruction } from "../../../packages/game/src/buildings/construction-progress";
import { STARTING_RESOURCES } from "../../../packages/game/src/constants";
import { calculateFoodAfterTick, calculateFoodConsumption } from "../../../packages/game/src/economy/food-consumption";
import { calculateResourceGeneration, getResourceGenerationTotals } from "../../../packages/game/src/economy/resource-generation";
import { getTickKey } from "./tick-clock";
import {
  type ConstructionProgressSummary,
  type FoodConsumptionSummary,
  formatTickRunResult,
  isDuplicateTickInsert,
  type ResourceGenerationSummary,
  toErrorMessage,
  type TickRunResult,
} from "./tick-log";

type RunOneTickOptions = {
  now?: Date;
  prisma?: MamalikPrismaClient;
};

export async function runOneTick(options: RunOneTickOptions = {}): Promise<TickRunResult> {
  const prisma = options.prisma ?? getPrismaClient();
  const tickKey = getTickKey(options.now);
  const startedAt = new Date();

  let insertedRows: number;

  try {
    insertedRows = await prisma.$executeRaw`
      INSERT INTO "TickLog" ("id", "tickKey", "status", "startedAt", "createdAt", "updatedAt")
      VALUES (${randomUUID()}, ${tickKey}, 'STARTED'::"TickLogStatus", ${startedAt}, ${startedAt}, ${startedAt})
      ON CONFLICT ("tickKey") DO NOTHING
    `;
  } catch (error) {
    return {
      tickKey,
      status: "FAILED",
      processedKingdomCount: 0,
      startedAt,
      finishedAt: new Date(),
      errorMessage: `Could not create TickLog STARTED row: ${toErrorMessage(error)}`,
    };
  }

  if (isDuplicateTickInsert(insertedRows)) {
    const finishedAt = new Date();

    return {
      tickKey,
      status: "SKIPPED",
      processedKingdomCount: 0,
      startedAt,
      finishedAt,
    };
  }

  try {
    const { processedKingdomCount, finishedAt, resourceGeneration, foodConsumption, constructionProgress, warnings } = await prisma.$transaction(async (tx) => {
      const kingdoms = await tx.kingdom.findMany({
        select: {
          id: true,
          name: true,
          population: true,
          resourceStockpile: {
            select: {
              id: true,
              food: true,
            },
          },
          buildings: {
            select: {
              id: true,
              type: true,
              level: true,
              status: true,
              constructionRemainingTicks: true,
              district: {
                select: {
                  type: true,
                },
              },
            },
          },
          unitStacks: {
            select: {
              unitType: true,
              quantity: true,
            },
          },
        },
      });

      const resourceGeneration: ResourceGenerationSummary = {
        money: 0,
        food: 0,
        manpower: 0,
        knowledge: 0,
        populationTax: 0,
        populationManpowerGrowth: 0,
      };
      const foodConsumption: FoodConsumptionSummary = {
        population: 0,
        army: 0,
        total: 0,
        kingdomsWithFoodShortage: 0,
      };
      const constructionProgress: ConstructionProgressSummary = {
        buildingsProgressed: 0,
        buildingsCompleted: 0,
        buildingsStillInProgress: 0,
      };
      const warnings: string[] = [];

      for (const kingdom of kingdoms) {
        const generationBreakdown = calculateResourceGeneration({
          population: kingdom.population,
          buildings: kingdom.buildings,
        });
        const generated = getResourceGenerationTotals(generationBreakdown);
        const consumed = calculateFoodConsumption({
          population: kingdom.population,
          units: kingdom.unitStacks,
        });

        resourceGeneration.money += generated.money;
        resourceGeneration.food += generated.food;
        resourceGeneration.manpower += generated.manpower;
        resourceGeneration.knowledge += generated.knowledge;
        resourceGeneration.populationTax += generationBreakdown.money.populationTax;
        resourceGeneration.populationManpowerGrowth += generationBreakdown.manpower.populationManpowerGrowth;
        foodConsumption.population += consumed.populationFoodConsumption;
        foodConsumption.army += consumed.armyFoodConsumption;
        foodConsumption.total += consumed.totalFoodConsumption;

        if (kingdom.resourceStockpile) {
          const foodAfterTick = calculateFoodAfterTick({
            currentFood: kingdom.resourceStockpile.food,
            generatedFood: generated.food,
            totalFoodConsumption: consumed.totalFoodConsumption,
          });

          if (foodAfterTick.foodShortage) {
            foodConsumption.kingdomsWithFoodShortage += 1;
          }

          await tx.resourceStockpile.update({
            where: { kingdomId: kingdom.id },
            data: {
              money: { increment: generated.money },
              food: foodAfterTick.food,
              manpower: { increment: generated.manpower },
              knowledge: { increment: generated.knowledge },
            },
          });
        } else {
          warnings.push(`Kingdom "${kingdom.name}" had no ResourceStockpile; created one before applying generation and Food consumption.`);
          const foodAfterTick = calculateFoodAfterTick({
            currentFood: STARTING_RESOURCES.food,
            generatedFood: generated.food,
            totalFoodConsumption: consumed.totalFoodConsumption,
          });

          if (foodAfterTick.foodShortage) {
            foodConsumption.kingdomsWithFoodShortage += 1;
          }

          await tx.resourceStockpile.create({
            data: {
              kingdomId: kingdom.id,
              money: STARTING_RESOURCES.money + generated.money,
              food: foodAfterTick.food,
              manpower: STARTING_RESOURCES.manpower + generated.manpower,
              knowledge: STARTING_RESOURCES.knowledge + generated.knowledge,
            },
          });
        }

        for (const building of kingdom.buildings) {
          const progress = progressConstruction({
            status: building.status,
            constructionRemainingTicks: building.constructionRemainingTicks,
          });
          const statusChanged = progress.status !== building.status;
          const remainingTicksChanged = progress.constructionRemainingTicks !== building.constructionRemainingTicks;

          if (!statusChanged && !remainingTicksChanged) {
            continue;
          }

          if (progress.progressed) {
            constructionProgress.buildingsProgressed += 1;
          }

          if (progress.completed) {
            constructionProgress.buildingsCompleted += 1;
          }

          if (progress.status !== "ACTIVE") {
            constructionProgress.buildingsStillInProgress += 1;
          }

          await tx.buildingInstance.update({
            where: { id: building.id },
            data: {
              status: progress.status,
              constructionRemainingTicks: progress.constructionRemainingTicks,
            },
          });

          if (progress.completed) {
            await tx.report.create({
              data: {
                kingdomId: kingdom.id,
                type: "CONSTRUCTION",
                title: building.status === "UPGRADING" ? "Upgrade completed" : "Construction completed",
                bodyJson: {
                  buildingType: building.type,
                  level: building.level,
                  district: building.district.type,
                  previousStatus: building.status,
                  completedTickKey: tickKey,
                },
              },
            });
          }
        }
      }

      const processedKingdomCount = kingdoms.length;
      const finishedAt = new Date();

      await tx.$executeRaw`
        UPDATE "TickLog"
        SET
          "status" = 'COMPLETED'::"TickLogStatus",
          "finishedAt" = ${finishedAt},
          "processedKingdomCount" = ${processedKingdomCount},
          "updatedAt" = ${finishedAt}
        WHERE "tickKey" = ${tickKey}
      `;

      return { processedKingdomCount, finishedAt, resourceGeneration, foodConsumption, constructionProgress, warnings };
    });

    return {
      tickKey,
      status: "COMPLETED",
      processedKingdomCount,
      resourceGeneration,
      foodConsumption,
      constructionProgress,
      warnings,
      startedAt,
      finishedAt,
    };
  } catch (error) {
    const finishedAt = new Date();
    const errorMessage = toErrorMessage(error);

    try {
      await prisma.$executeRaw`
        UPDATE "TickLog"
        SET
          "status" = 'FAILED'::"TickLogStatus",
          "finishedAt" = ${finishedAt},
          "errorMessage" = ${errorMessage},
          "updatedAt" = ${finishedAt}
        WHERE "tickKey" = ${tickKey}
      `;
    } catch (failedLogError) {
      const failedLogMessage = toErrorMessage(failedLogError);
      return {
        tickKey,
        status: "FAILED",
        processedKingdomCount: 0,
        startedAt,
        finishedAt,
        errorMessage: `${errorMessage}; additionally failed to mark TickLog as FAILED: ${failedLogMessage}`,
      };
    }

    return {
      tickKey,
      status: "FAILED",
      processedKingdomCount: 0,
      startedAt,
      finishedAt,
      errorMessage,
    };
  }
}

export function printTickRunResult(result: TickRunResult): void {
  console.log(formatTickRunResult(result));
}
