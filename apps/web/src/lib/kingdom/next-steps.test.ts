import assert from "node:assert/strict";
import test from "node:test";
import type { KingdomActionState } from "@mamalik/game";
import { getNextSteps } from "./next-steps";

function createState(overrides: Partial<KingdomActionState> = {}): KingdomActionState {
  return {
    stockpile: { money: 10_000, manpower: 500 },
    buildings: [{ id: "barracks", type: "BARRACKS", level: 1, status: "ACTIVE", districtType: "MILITARY" }],
    districts: [
      { type: "ECONOMIC", allocatedLandM2: 15_000, usedLandM2: 2_000 },
      { type: "MILITARY", allocatedLandM2: 8_000, usedLandM2: 1_000 },
    ],
    activeTrainingQueues: 0,
    ...overrides,
  };
}

test("suggests building, training, and assigning land for an idle kingdom", () => {
  const steps = getNextSteps({
    state: createState(),
    activeConstructionCount: 0,
    trainingQueueCount: 0,
    unallocatedLandM2: 5_000,
  });

  assert.deepEqual(
    steps.map((step) => step.href),
    ["/buildings", "/army", "/land"],
  );
});

test("stays quiet when builders and barracks are busy and land is assigned", () => {
  assert.deepEqual(
    getNextSteps({
      state: createState({ activeTrainingQueues: 1 }),
      activeConstructionCount: 1,
      trainingQueueCount: 1,
      unallocatedLandM2: 98,
    }),
    [],
  );
});

test("tells broke players to save instead of offering a build", () => {
  const steps = getNextSteps({
    state: createState({ stockpile: { money: 10, manpower: 0 } }),
    activeConstructionCount: 0,
    trainingQueueCount: 0,
    unallocatedLandM2: 0,
  });

  assert.equal(steps.length, 1);
  assert.equal(steps[0]?.cta, "View");
});
