import assert from "node:assert/strict";
import test from "node:test";
import {
  formatKingdomNameError,
  suggestKingdomName,
  validateKingdomName,
} from "./kingdom-name";

test("validates and trims kingdom names", () => {
  assert.deepEqual(validateKingdomName("  North Realm  "), {
    ok: true,
    name: "North Realm",
  });
});

test("rejects invalid kingdom names", () => {
  assert.deepEqual(validateKingdomName("   "), {
    ok: false,
    reason: "required",
  });
  assert.deepEqual(validateKingdomName("A"), {
    ok: false,
    reason: "too-short",
  });
  assert.deepEqual(validateKingdomName("A very long kingdom name over limit"), {
    ok: false,
    reason: "too-long",
  });
});

test("formats kingdom name validation errors", () => {
  assert.equal(formatKingdomNameError(validateKingdomName(" ")), "Kingdom name is required.");
  assert.equal(
    formatKingdomNameError(validateKingdomName("A")),
    "Kingdom name must be at least 2 characters.",
  );
});

test("suggests a readable kingdom name from display name", () => {
  assert.equal(suggestKingdomName(" Player One "), "Player One Kingdom");
  assert.equal(suggestKingdomName(""), "New Kingdom");
  assert.ok(suggestKingdomName("A very long display name that needs trimming").length <= 32);
});

test("starter-state constants stay aligned with locked v0.1 values", async () => {
  const constants = await import("@mamalik/game/constants");

  assert.equal(constants.STARTING_USABLE_LAND_M2, 50_000);
  assert.equal(constants.STARTING_POPULATION, 1_000);
  assert.deepEqual(constants.STARTING_RESOURCES, {
    money: 10_000,
    food: 5_000,
    manpower: 500,
    knowledge: 0,
  });
  assert.equal(constants.BEGINNER_PROTECTION_DAYS, 3);
  assert.deepEqual(
    constants.STARTER_UNITS.map((unit) => [unit.type, unit.quantity]),
    [
      ["Infantry", 100],
      ["Archers", 25],
    ],
  );
});
