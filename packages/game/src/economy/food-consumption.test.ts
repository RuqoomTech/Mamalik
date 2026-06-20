import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { STARTER_UNITS, STARTING_POPULATION } from "../constants";
import { calculateFoodAfterTick, calculateFoodConsumption, type UnitTypeLike } from "./food-consumption";

describe("food consumption formulas", () => {
  it("calculates population-only consumption", () => {
    assert.deepEqual(
      calculateFoodConsumption({
        population: 1_000,
        units: [],
      }),
      {
        populationFoodConsumption: 20,
        armyFoodConsumption: 0,
        totalFoodConsumption: 20,
      },
    );
  });

  it("calculates starter kingdom Food consumption", () => {
    assert.deepEqual(
      calculateFoodConsumption({
        population: STARTING_POPULATION,
        units: STARTER_UNITS.map((unit) => ({
          unitType: unit.type,
          quantity: unit.quantity,
        })),
      }),
      {
        populationFoodConsumption: 20,
        armyFoodConsumption: 4,
        totalFoodConsumption: 24,
      },
    );
  });

  it("calculates each unit type with rounded-up army consumption", () => {
    assert.equal(armyOnlyConsumption("INFANTRY", 100), 3);
    assert.equal(armyOnlyConsumption("ARCHERS", 100), 4);
    assert.equal(armyOnlyConsumption("CAVALRY", 100), 6);
    assert.equal(armyOnlyConsumption("SCOUTS", 100), 3);
    assert.equal(armyOnlyConsumption("SIEGE", 100), 12);
  });

  it("handles no units as zero army consumption", () => {
    assert.equal(calculateFoodConsumption({ population: 0, units: [] }).armyFoodConsumption, 0);
  });

  it("clamps invalid population and unit quantities to zero", () => {
    assert.deepEqual(
      calculateFoodConsumption({
        population: Number.NaN,
        units: [
          { unitType: "INFANTRY", quantity: -5 },
          { unitType: "SIEGE", quantity: Number.POSITIVE_INFINITY },
        ],
      }),
      {
        populationFoodConsumption: 0,
        armyFoodConsumption: 0,
        totalFoodConsumption: 0,
      },
    );
  });

  it("rejects unknown unit types", () => {
    assert.throws(
      () =>
        calculateFoodConsumption({
          population: 0,
          units: [{ unitType: "DRAGON" as UnitTypeLike, quantity: 1 }],
        }),
      /Unknown unit type/,
    );
  });

  it("never returns negative Food after applying generation and consumption", () => {
    assert.deepEqual(
      calculateFoodAfterTick({
        currentFood: 10,
        generatedFood: 5,
        totalFoodConsumption: 25,
      }),
      {
        food: 0,
        foodShortage: true,
      },
    );

    assert.deepEqual(
      calculateFoodAfterTick({
        currentFood: 10,
        generatedFood: 5,
        totalFoodConsumption: 15,
      }),
      {
        food: 0,
        foodShortage: false,
      },
    );
  });
});

function armyOnlyConsumption(unitType: UnitTypeLike, quantity: number): number {
  return calculateFoodConsumption({
    population: 0,
    units: [{ unitType, quantity }],
  }).armyFoodConsumption;
}
