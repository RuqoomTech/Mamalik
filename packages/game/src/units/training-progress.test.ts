import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { progressTraining } from "./training-progress";

describe("training progress formulas", () => {
  it("decrements active queues with more than one tick remaining", () => {
    assert.deepEqual(
      progressTraining({
        status: "ACTIVE",
        remainingTicks: 3,
      }),
      {
        status: "ACTIVE",
        remainingTicks: 2,
        progressed: true,
        completed: false,
      },
    );
  });

  it("completes active queues when the timer reaches zero", () => {
    assert.deepEqual(
      progressTraining({
        status: "ACTIVE",
        remainingTicks: 1,
      }),
      {
        status: "COMPLETED",
        remainingTicks: 0,
        progressed: true,
        completed: true,
      },
    );
  });

  it("normalizes active queues with zero remaining ticks to completed", () => {
    assert.deepEqual(
      progressTraining({
        status: "ACTIVE",
        remainingTicks: 0,
      }),
      {
        status: "COMPLETED",
        remainingTicks: 0,
        progressed: false,
        completed: true,
      },
    );
  });

  it("does not progress completed queues", () => {
    assert.deepEqual(
      progressTraining({
        status: "COMPLETED",
        remainingTicks: 2,
      }),
      {
        status: "COMPLETED",
        remainingTicks: 2,
        progressed: false,
        completed: false,
      },
    );
  });

  it("does not progress cancelled queues", () => {
    assert.deepEqual(
      progressTraining({
        status: "CANCELLED",
        remainingTicks: 2,
      }),
      {
        status: "CANCELLED",
        remainingTicks: 2,
        progressed: false,
        completed: false,
      },
    );
  });

  it("clamps negative remaining ticks and never returns a negative timer", () => {
    assert.deepEqual(
      progressTraining({
        status: "ACTIVE",
        remainingTicks: -5,
      }),
      {
        status: "COMPLETED",
        remainingTicks: 0,
        progressed: false,
        completed: true,
      },
    );
  });
});
