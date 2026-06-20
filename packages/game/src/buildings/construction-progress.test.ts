import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { progressConstruction } from "./construction-progress";

describe("construction progress formulas", () => {
  it("does not progress active buildings", () => {
    assert.deepEqual(
      progressConstruction({
        status: "ACTIVE",
        constructionRemainingTicks: 3,
      }),
      {
        status: "ACTIVE",
        constructionRemainingTicks: 3,
        progressed: false,
        completed: false,
      },
    );
  });

  it("decrements constructing buildings that have more than one tick remaining", () => {
    assert.deepEqual(
      progressConstruction({
        status: "CONSTRUCTING",
        constructionRemainingTicks: 3,
      }),
      {
        status: "CONSTRUCTING",
        constructionRemainingTicks: 2,
        progressed: true,
        completed: false,
      },
    );
  });

  it("activates constructing buildings when the timer reaches zero", () => {
    assert.deepEqual(
      progressConstruction({
        status: "CONSTRUCTING",
        constructionRemainingTicks: 1,
      }),
      {
        status: "ACTIVE",
        constructionRemainingTicks: 0,
        progressed: true,
        completed: true,
      },
    );
  });

  it("activates upgrading buildings when the timer reaches zero", () => {
    assert.deepEqual(
      progressConstruction({
        status: "UPGRADING",
        constructionRemainingTicks: 1,
      }),
      {
        status: "ACTIVE",
        constructionRemainingTicks: 0,
        progressed: true,
        completed: true,
      },
    );
  });

  it("normalizes in-progress buildings with zero remaining ticks to active", () => {
    assert.deepEqual(
      progressConstruction({
        status: "UPGRADING",
        constructionRemainingTicks: 0,
      }),
      {
        status: "ACTIVE",
        constructionRemainingTicks: 0,
        progressed: false,
        completed: true,
      },
    );
  });

  it("clamps negative remaining ticks and never returns a negative timer", () => {
    assert.deepEqual(
      progressConstruction({
        status: "CONSTRUCTING",
        constructionRemainingTicks: -4,
      }),
      {
        status: "ACTIVE",
        constructionRemainingTicks: 0,
        progressed: false,
        completed: true,
      },
    );
  });
});
