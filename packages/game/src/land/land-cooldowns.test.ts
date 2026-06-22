import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  getLandPackageCooldownMs,
  getNextLandPurchaseAvailableAt,
  isLandPackageOnCooldown,
} from "./land-cooldowns";

describe("land package cooldown helpers", () => {
  it("returns locked package cooldown durations", () => {
    assert.equal(getLandPackageCooldownMs("LAND_500"), 0);
    assert.equal(getLandPackageCooldownMs("LAND_1000"), 6 * 60 * 60 * 1000);
    assert.equal(getLandPackageCooldownMs("LAND_5000"), 24 * 60 * 60 * 1000);
    assert.equal(getLandPackageCooldownMs("LAND_10000"), 48 * 60 * 60 * 1000);
  });

  it("calculates next available timestamps from the purchase time", () => {
    const now = new Date("2026-06-23T12:00:00.000Z");

    assert.equal(getNextLandPurchaseAvailableAt(now, "LAND_500").toISOString(), "2026-06-23T12:00:00.000Z");
    assert.equal(getNextLandPurchaseAvailableAt(now, "LAND_1000").toISOString(), "2026-06-23T18:00:00.000Z");
    assert.equal(getNextLandPurchaseAvailableAt(now, "LAND_5000").toISOString(), "2026-06-24T12:00:00.000Z");
    assert.equal(getNextLandPurchaseAvailableAt(now, "LAND_10000").toISOString(), "2026-06-25T12:00:00.000Z");
  });

  it("detects active and expired cooldowns", () => {
    const now = new Date("2026-06-23T12:00:00.000Z");

    assert.equal(isLandPackageOnCooldown(now, new Date("2026-06-23T12:00:01.000Z")), true);
    assert.equal(isLandPackageOnCooldown(now, new Date("2026-06-23T12:00:00.000Z")), false);
    assert.equal(isLandPackageOnCooldown(now, new Date("2026-06-23T11:59:59.999Z")), false);
    assert.equal(isLandPackageOnCooldown(now, null), false);
  });
});
