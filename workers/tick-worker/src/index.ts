import { getPrismaClient } from "../../../packages/db/src/client";
import type { MamalikPrismaClient } from "../../../packages/db/src/client";
import { loadWorkerEnv } from "./load-worker-env";
import { runOneTick, printTickRunResult } from "./run-one-tick";

let prismaForShutdown: MamalikPrismaClient | undefined;

async function main(): Promise<void> {
  loadWorkerEnv();

  const command = process.argv[2] ?? "once";

  if (command !== "once") {
    throw new Error(`Unknown tick worker command: ${command}`);
  }

  prismaForShutdown = getPrismaClient();
  const result = await runOneTick({ prisma: prismaForShutdown });
  printTickRunResult(result);

  if (result.status === "FAILED") {
    process.exitCode = 1;
  }
}

main()
  .catch((error: unknown) => {
    const message = error instanceof Error ? error.message : "Unknown tick worker failure.";
    console.error(message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prismaForShutdown?.$disconnect();
  });
