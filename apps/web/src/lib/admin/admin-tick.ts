import { runOneTick } from "../../../../../workers/tick-worker/src/run-one-tick";
import type { TickRunResult } from "../../../../../workers/tick-worker/src/tick-log";
import type { CurrentUser } from "@/lib/auth/current-user";
import { isAdminUser } from "@/lib/auth/route-destinations";

export type SerializableAdminTickResult = {
  tickKey: string;
  status: TickRunResult["status"];
  processedKingdomCount: number;
  startedAt: string;
  finishedAt: string;
  errorMessage: string | null;
  resourceGeneration: TickRunResult["resourceGeneration"] | null;
  foodConsumption: TickRunResult["foodConsumption"] | null;
  constructionProgress: TickRunResult["constructionProgress"] | null;
  trainingProgress: TickRunResult["trainingProgress"] | null;
  warnings: string[];
};

export type AdminTickExecutionResult =
  | {
      ok: true;
      message: string;
      result: SerializableAdminTickResult;
    }
  | {
      ok: false;
      code: "unauthorized" | "forbidden" | "tick-failed";
      message: string;
      result: SerializableAdminTickResult | null;
    };

export type RunTickFunction = () => Promise<TickRunResult>;

export async function runAdminTickForUser(
  user: Pick<CurrentUser, "email" | "role"> | null,
  runTick: RunTickFunction = runOneTick,
): Promise<AdminTickExecutionResult> {
  if (!user) {
    return {
      ok: false,
      code: "unauthorized",
      message: "You must be signed in as an admin to run a tick.",
      result: null,
    };
  }

  if (!isAdminUser(user)) {
    return {
      ok: false,
      code: "forbidden",
      message: "Only admins can run a manual tick.",
      result: null,
    };
  }

  const result = serializeAdminTickResult(await runTick());

  if (result.status === "FAILED") {
    return {
      ok: false,
      code: "tick-failed",
      message: result.errorMessage
        ? `Tick failed: ${result.errorMessage}`
        : "Tick failed. Review the TickLog row for details.",
      result,
    };
  }

  if (result.status === "SKIPPED") {
    return {
      ok: true,
      message: `Tick ${result.tickKey} was skipped because it already exists.`,
      result,
    };
  }

  return {
    ok: true,
    message: `Tick ${result.tickKey} completed.`,
    result,
  };
}

export function serializeAdminTickResult(result: TickRunResult): SerializableAdminTickResult {
  return {
    tickKey: result.tickKey,
    status: result.status,
    processedKingdomCount: result.processedKingdomCount,
    startedAt: result.startedAt.toISOString(),
    finishedAt: result.finishedAt.toISOString(),
    errorMessage: result.errorMessage ?? null,
    resourceGeneration: result.resourceGeneration ?? null,
    foodConsumption: result.foodConsumption ?? null,
    constructionProgress: result.constructionProgress ?? null,
    trainingProgress: result.trainingProgress ?? null,
    warnings: result.warnings ?? [],
  };
}
