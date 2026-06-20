import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { STARTER_BUILDINGS, STARTING_POPULATION } from "../constants";
import { calculateResourceGeneration, getResourceGenerationTotals } from "./resource-generation";

describe("resource generation formulas", () => {
  it("generates population-only money and manpower", () => {
    const generation = calculateResourceGeneration({
      population: 1_000,
      buildings: [],
    });

    assert.equal(generation.money.populationTax, 50);
    assert.equal(generation.manpower.populationManpowerGrowth, 10);
    assert.deepEqual(getResourceGenerationTotals(generation), {
      money: 50,
      food: 0,
      manpower: 10,
      knowledge: 0,
    });
  });

  it("generates the expected starter kingdom resources per tick", () => {
    const generation = calculateResourceGeneration({
      population: STARTING_POPULATION,
      buildings: STARTER_BUILDINGS.map((building) => ({
        type: building.type,
        level: 1,
        status: "ACTIVE",
      })),
    });

    assert.deepEqual(generation.money, {
      populationTax: 50,
      marketBonus: 40,
      taxOfficeBonus: 0,
      palaceBonus: 25,
      total: 115,
    });
    assert.deepEqual(generation.manpower, {
      populationManpowerGrowth: 10,
      housesBonus: 15,
      total: 25,
    });
    assert.deepEqual(getResourceGenerationTotals(generation), {
      money: 115,
      food: 120,
      manpower: 25,
      knowledge: 20,
    });
  });

  it("does not generate from inactive buildings", () => {
    const generation = calculateResourceGeneration({
      population: 0,
      buildings: [
        { type: "FARM", level: 10, status: "CONSTRUCTING" },
        { type: "MARKET", level: 10, status: "UPGRADING" },
        { type: "SCHOLAR_HALL", level: 10, status: "UPGRADING" },
      ],
    });

    assert.deepEqual(getResourceGenerationTotals(generation), {
      money: 0,
      food: 0,
      manpower: 0,
      knowledge: 0,
    });
  });

  it("stacks multiple active buildings and levels", () => {
    const generation = calculateResourceGeneration({
      population: 2_500,
      buildings: [
        { type: "MARKET", level: 2, status: "ACTIVE" },
        { type: "MARKET", level: 3, status: "ACTIVE" },
        { type: "TAX_OFFICE", level: 2, status: "ACTIVE" },
        { type: "FARM", level: 2, status: "ACTIVE" },
        { type: "HOUSES", level: 3, status: "ACTIVE" },
        { type: "SCHOLAR_HALL", level: 4, status: "ACTIVE" },
      ],
    });

    assert.deepEqual(generation.money, {
      populationTax: 125,
      marketBonus: 200,
      taxOfficeBonus: 120,
      palaceBonus: 0,
      total: 445,
    });
    assert.deepEqual(generation.manpower, {
      populationManpowerGrowth: 25,
      housesBonus: 45,
      total: 70,
    });
    assert.deepEqual(getResourceGenerationTotals(generation), {
      money: 445,
      food: 240,
      manpower: 70,
      knowledge: 80,
    });
  });

  it("clamps invalid population and building levels to zero", () => {
    const generation = calculateResourceGeneration({
      population: -100,
      buildings: [
        { type: "FARM", level: -5, status: "ACTIVE" },
        { type: "MARKET", level: Number.NaN, status: "ACTIVE" },
        { type: "HOUSES", level: Number.POSITIVE_INFINITY, status: "ACTIVE" },
      ],
    });

    assert.deepEqual(getResourceGenerationTotals(generation), {
      money: 0,
      food: 0,
      manpower: 0,
      knowledge: 0,
    });
  });

  it("keeps breakdown totals equal to returned totals", () => {
    const generation = calculateResourceGeneration({
      population: 1_200,
      buildings: [
        { type: "PALACE", level: 1, status: "ACTIVE" },
        { type: "MARKET", level: 2, status: "ACTIVE" },
        { type: "FARM", level: 3, status: "ACTIVE" },
        { type: "HOUSES", level: 2, status: "ACTIVE" },
        { type: "SCHOLAR_HALL", level: 1, status: "ACTIVE" },
      ],
    });
    const totals = getResourceGenerationTotals(generation);

    assert.equal(
      generation.money.populationTax + generation.money.marketBonus + generation.money.taxOfficeBonus + generation.money.palaceBonus,
      totals.money,
    );
    assert.equal(generation.food.farmProduction, totals.food);
    assert.equal(generation.manpower.populationManpowerGrowth + generation.manpower.housesBonus, totals.manpower);
    assert.equal(generation.knowledge.scholarHallProduction, totals.knowledge);
  });
});
