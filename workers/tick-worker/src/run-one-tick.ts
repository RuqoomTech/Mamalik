import { randomUUID } from "node:crypto";

import { getPrismaClient, type MamalikPrismaClient } from "../../../packages/db/src/client";
import { getTickKey } from "./tick-clock";
import {
  formatTickRunResult,
  isDuplicateTickInsert,
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
    const { processedKingdomCount, finishedAt } = await prisma.$transaction(async (tx) => {
      const processedKingdomCount = await tx.kingdom.count();
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

      return { processedKingdomCount, finishedAt };
    });

    return {
      tickKey,
      status: "COMPLETED",
      processedKingdomCount,
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
