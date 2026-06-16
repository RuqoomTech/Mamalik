import assert from "node:assert/strict";
import test from "node:test";
import {
  createBeginnerProtectionEndsAt,
  createKingdomSlug,
  createUniqueKingdomSlug,
  getStarterDistrictLandTotalM2,
  getStarterUsedLandM2,
} from "./creation";
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
  assert.deepEqual(validateKingdomName("North\nRealm"), {
    ok: false,
    reason: "unsafe-characters",
  });
});

test("formats kingdom name validation errors", () => {
  assert.equal(formatKingdomNameError(validateKingdomName(" ")), "Kingdom name is required.");
  assert.equal(
    formatKingdomNameError(validateKingdomName("A")),
    "Kingdom name must be at least 2 characters.",
  );
  assert.equal(
    formatKingdomNameError(validateKingdomName("North\tRealm")),
    "Kingdom name contains unsupported characters.",
  );
});

test("generates stable kingdom slugs", () => {
  assert.equal(createKingdomSlug("Kingdom of Omar"), "kingdom-of-omar");
  assert.equal(createKingdomSlug("!!!"), "kingdom");
  assert.equal(
    createUniqueKingdomSlug("Kingdom of Omar", ["kingdom-of-omar", "kingdom-of-omar-2"]),
    "kingdom-of-omar-3",
  );
});

test("calculates beginner protection end time", () => {
  assert.equal(
    createBeginnerProtectionEndsAt(new Date("2026-06-17T00:00:00.000Z")).toISOString(),
    "2026-06-20T00:00:00.000Z",
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
  assert.equal(getStarterDistrictLandTotalM2(), 50_000);
  assert.equal(getStarterUsedLandM2(), 7_000);
  assert.deepEqual(
    constants.LAND_PURCHASE_PACKAGES.map((landPackage) => [
      landPackage.sizeM2,
      landPackage.cooldownHours,
    ]),
    [
      [500, 0],
      [1_000, 6],
      [5_000, 24],
      [10_000, 48],
    ],
  );
  assert.deepEqual(
    constants.STARTER_UNITS.map((unit) => [unit.type, unit.label, unit.quantity]),
    [
      ["INFANTRY", "Infantry", 100],
      ["ARCHERS", "Archers", 25],
    ],
  );
});
