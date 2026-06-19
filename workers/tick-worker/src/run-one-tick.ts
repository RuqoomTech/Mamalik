import { randomUUID } from "node:crypto";

import { getPrismaClient, type MamalikPrismaClient } from "../../../packages/db/src/client";
import { STARTING_RESOURCES } from "../../../packages/game/src/constants";
import { calculateResourceGeneration } from "../../../packages/game/src/economy/resource-generation";
import { getTickKey } from "./tick-clock";
import {
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
    const { processedKingdomCount, finishedAt, resourceGeneration, warnings } = await prisma.$transaction(async (tx) => {
      const kingdoms = await tx.kingdom.findMany({
        select: {
          id: true,
          name: true,
          population: true,
          resourceStockpile: {
            select: {
              id: true,
            },
          },
          buildings: {
            select: {
              type: true,
              level: true,
              status: true,
            },
          },
        },
      });

      const resourceGeneration: ResourceGenerationSummary = {
        money: 0,
        food: 0,
        manpower: 0,
        knowledge: 0,
      };
      const warnings: string[] = [];

      for (const kingdom of kingdoms) {
        const generated = calculateResourceGeneration({
          population: kingdom.population,
          buildings: kingdom.buildings,
        });

        resourceGeneration.money += generated.money;
        resourceGeneration.food += generated.food;
        resourceGeneration.manpower += generated.manpower;
        resourceGeneration.knowledge += generated.knowledge;

        if (kingdom.resourceStockpile) {
          await tx.resourceStockpile.update({
            where: { kingdomId: kingdom.id },
            data: {
              money: { increment: generated.money },
              food: { increment: generated.food },
              manpower: { increment: generated.manpower },
              knowledge: { increment: generated.knowledge },
            },
          });
        } else {
          warnings.push(`Kingdom "${kingdom.name}" had no ResourceStockpile; created one before applying generation.`);

          await tx.resourceStockpile.create({
            data: {
              kingdomId: kingdom.id,
              money: STARTING_RESOURCES.money + generated.money,
              food: STARTING_RESOURCES.food + generated.food,
              manpower: STARTING_RESOURCES.manpower + generated.manpower,
              knowledge: STARTING_RESOURCES.knowledge + generated.knowledge,
            },
          });
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

      return { processedKingdomCount, finishedAt, resourceGeneration, warnings };
    });

    return {
      tickKey,
      status: "COMPLETED",
      processedKingdomCount,
      resourceGeneration,
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
