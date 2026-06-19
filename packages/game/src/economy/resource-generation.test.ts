import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { STARTER_BUILDINGS, STARTING_POPULATION } from "../constants";
import { calculateResourceGeneration } from "./resource-generation";

describe("resource generation formulas", () => {
  it("generates population-only money and manpower", () => {
    assert.deepEqual(
      calculateResourceGeneration({
        population: 1_000,
        buildings: [],
      }),
      {
        money: 50,
        food: 0,
        manpower: 10,
        knowledge: 0,
      },
    );
  });

  it("generates the expected starter kingdom resources per tick", () => {
    assert.deepEqual(
      calculateResourceGeneration({
        population: STARTING_POPULATION,
        buildings: STARTER_BUILDINGS.map((building) => ({
          type: building.type,
          level: 1,
          status: "ACTIVE",
        })),
      }),
      {
        money: 115,
        food: 120,
        manpower: 25,
        knowledge: 20,
      },
    );
  });

  it("does not generate from inactive buildings", () => {
    assert.deepEqual(
      calculateResourceGeneration({
        population: 0,
        buildings: [
          { type: "FARM", level: 10, status: "CONSTRUCTING" },
          { type: "MARKET", level: 10, status: "UPGRADING" },
          { type: "SCHOLAR_HALL", level: 10, status: "UPGRADING" },
        ],
      }),
      {
        money: 0,
        food: 0,
        manpower: 0,
        knowledge: 0,
      },
    );
  });

  it("stacks multiple active buildings and levels", () => {
    assert.deepEqual(
      calculateResourceGeneration({
        population: 2_500,
        buildings: [
          { type: "MARKET", level: 2, status: "ACTIVE" },
          { type: "MARKET", level: 3, status: "ACTIVE" },
          { type: "TAX_OFFICE", level: 2, status: "ACTIVE" },
          { type: "FARM", level: 2, status: "ACTIVE" },
          { type: "HOUSES", level: 3, status: "ACTIVE" },
          { type: "SCHOLAR_HALL", level: 4, status: "ACTIVE" },
        ],
      }),
      {
        money: 445,
        food: 240,
        manpower: 70,
        knowledge: 80,
      },
    );
  });

  it("clamps invalid population and building levels to zero", () => {
    assert.deepEqual(
      calculateResourceGeneration({
        population: -100,
        buildings: [
          { type: "FARM", level: -5, status: "ACTIVE" },
          { type: "MARKET", level: Number.NaN, status: "ACTIVE" },
          { type: "HOUSES", level: Number.POSITIVE_INFINITY, status: "ACTIVE" },
        ],
      }),
      {
        money: 0,
        food: 0,
        manpower: 0,
        knowledge: 0,
      },
    );
  });
});
