import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { validateLandPurchase } from "./land-purchase-validation";

const now = new Date("2026-06-23T12:00:00.000Z");

describe("land purchase validation", () => {
  it("passes for a valid purchase", () => {
    const result = validateLandPurchase({
      packageKey: "LAND_1000",
      kingdom: {
        usableLandM2: 50_000,
        areaType: "STANDARD",
      },
      stockpile: {
        money: 2_000,
      },
      cooldownAvailableAt: null,
      now,
    });

    assert.deepEqual(result, {
      ok: true,
      packageSizeM2: 1_000,
      price: {
        basePrice: 2_000,
        sizeMultiplier: 1,
        areaMultiplier: 1,
        totalPrice: 2_000,
      },
      cooldownHours: 6,
    });
  });

  it("fails when Money is insufficient", () => {
    assert.deepEqual(
      validateLandPurchase({
        packageKey: "LAND_5000",
        kingdom: {
          usableLandM2: 50_000,
          areaType: "STANDARD",
        },
        stockpile: {
          money: 9_999,
        },
        cooldownAvailableAt: null,
        now,
      }),
      {
        ok: false,
        reason: "INSUFFICIENT_MONEY",
      },
    );
  });

  it("fails when package cooldown is active", () => {
    assert.deepEqual(
      validateLandPurchase({
        packageKey: "LAND_1000",
        kingdom: {
          usableLandM2: 50_000,
          areaType: "STANDARD",
        },
        stockpile: {
          money: 10_000,
        },
        cooldownAvailableAt: new Date("2026-06-23T12:00:01.000Z"),
        now,
      }),
      {
        ok: false,
        reason: "COOLDOWN_ACTIVE",
      },
    );
  });

  it("fails when package key is invalid", () => {
    assert.deepEqual(
      validateLandPurchase({
        packageKey: "LAND_750",
        kingdom: {
          usableLandM2: 50_000,
          areaType: "STANDARD",
        },
        stockpile: {
          money: 10_000,
        },
        cooldownAvailableAt: null,
        now,
      }),
      {
        ok: false,
        reason: "INVALID_PACKAGE",
      },
    );
  });

  it("fails when the kingdom is missing", () => {
    assert.deepEqual(
      validateLandPurchase({
        packageKey: "LAND_500",
        kingdom: null,
        stockpile: {
          money: 10_000,
        },
        cooldownAvailableAt: null,
        now,
      }),
      {
        ok: false,
        reason: "MISSING_KINGDOM",
      },
    );
  });

  it("fails when the stockpile is missing", () => {
    assert.deepEqual(
      validateLandPurchase({
        packageKey: "LAND_500",
        kingdom: {
          usableLandM2: 50_000,
          areaType: "STANDARD",
        },
        stockpile: null,
        cooldownAvailableAt: null,
        now,
      }),
      {
        ok: false,
        reason: "MISSING_STOCKPILE",
      },
    );
  });
});
