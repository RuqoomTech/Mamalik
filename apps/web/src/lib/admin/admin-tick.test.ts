import assert from "node:assert/strict";
import test from "node:test";
import {
  runAdminTickForUser,
  serializeAdminTickResult,
  type RunTickFunction,
} from "./admin-tick";
import type { TickRunResult } from "../../../../../workers/tick-worker/src/tick-log";

const completedTickResult: TickRunResult = {
  tickKey: "2026-06-21T20:00:00.000Z",
  status: "COMPLETED",
  processedKingdomCount: 2,
  startedAt: new Date("2026-06-21T20:00:01.000Z"),
  finishedAt: new Date("2026-06-21T20:00:05.000Z"),
  resourceGeneration: {
    money: 230,
    food: 240,
    manpower: 50,
    knowledge: 40,
    populationTax: 100,
    populationManpowerGrowth: 20,
  },
  foodConsumption: {
    population: 40,
    army: 9,
    total: 49,
    kingdomsWithFoodShortage: 0,
  },
  constructionProgress: {
    buildingsProgressed: 1,
    buildingsCompleted: 0,
    buildingsStillInProgress: 1,
  },
  trainingProgress: {
    trainingQueuesProgressed: 1,
    trainingQueuesCompleted: 1,
    unitsTrained: 10,
    trainingQueuesStillInProgress: 0,
  },
};

test("unauthenticated users cannot run admin ticks", async () => {
  let tickCalled = false;
  const runTick: RunTickFunction = async () => {
    tickCalled = true;
    return completedTickResult;
  };

  const result = await runAdminTickForUser(null, runTick);

  assert.equal(result.ok, false);
  assert.equal(tickCalled, false);
  assert.equal(result.message, "You must be signed in as an admin to run a tick.");
});

test("non-admin users cannot run admin ticks", async () => {
  let tickCalled = false;
  const runTick: RunTickFunction = async () => {
    tickCalled = true;
    return completedTickResult;
  };

  const result = await runAdminTickForUser(
    { email: "player@example.com", role: "PLAYER" },
    runTick,
  );

  assert.equal(result.ok, false);
  assert.equal(tickCalled, false);
  assert.equal(result.message, "Only admins can run a manual tick.");
});

test("admins can run one tick", async () => {
  const result = await runAdminTickForUser(
    { email: "admin@example.com", role: "ADMIN" },
    async () => completedTickResult,
  );

  assert.equal(result.ok, true);
  assert.equal(result.message, "Tick 2026-06-21T20:00:00.000Z completed.");
  assert.equal(result.result.processedKingdomCount, 2);
  assert.equal(result.result.resourceGeneration?.money, 230);
});

test("duplicate tick result is returned as skipped without treating it as failure", async () => {
  const skippedResult: TickRunResult = {
    tickKey: "2026-06-21T20:00:00.000Z",
    status: "SKIPPED",
    processedKingdomCount: 0,
    startedAt: new Date("2026-06-21T20:01:01.000Z"),
    finishedAt: new Date("2026-06-21T20:01:01.500Z"),
  };

  const result = await runAdminTickForUser(
    { email: "admin@example.com", role: "ADMIN" },
    async () => skippedResult,
  );

  assert.equal(result.ok, true);
  assert.equal(
    result.message,
    "Tick 2026-06-21T20:00:00.000Z was skipped because it already exists.",
  );
  assert.equal(result.result.status, "SKIPPED");
});

test("failed tick result includes the worker error message", async () => {
  const failedResult: TickRunResult = {
    tickKey: "2026-06-21T20:10:00.000Z",
    status: "FAILED",
    processedKingdomCount: 0,
    startedAt: new Date("2026-06-21T20:10:01.000Z"),
    finishedAt: new Date("2026-06-21T20:10:02.000Z"),
    errorMessage: "database unavailable",
  };

  const result = await runAdminTickForUser(
    { email: "admin@example.com", role: "ADMIN" },
    async () => failedResult,
  );

  assert.equal(result.ok, false);
  assert.equal(result.message, "Tick failed: database unavailable");
  assert.equal(result.result?.status, "FAILED");
});

test("serializes tick results for Server Action state", () => {
  const result = serializeAdminTickResult(completedTickResult);

  assert.equal(result.startedAt, "2026-06-21T20:00:01.000Z");
  assert.equal(result.finishedAt, "2026-06-21T20:00:05.000Z");
  assert.equal(result.trainingProgress?.unitsTrained, 10);
  assert.deepEqual(result.warnings, []);
});
