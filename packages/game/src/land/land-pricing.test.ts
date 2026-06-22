import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  calculateLandPrice,
  getKingdomSizeMultiplier,
  normalizeLandAreaType,
  roundLandPrice,
} from "./land-pricing";

describe("land pricing formulas", () => {
  it("calculates STANDARD prices for each locked package at starter size", () => {
    assert.equal(calculateLandPrice({ currentUsableLandM2: 50_000, packageSizeM2: 500, areaType: "STANDARD" }).totalPrice, 1_000);
    assert.equal(calculateLandPrice({ currentUsableLandM2: 50_000, packageSizeM2: 1_000, areaType: "STANDARD" }).totalPrice, 2_000);
    assert.equal(calculateLandPrice({ currentUsableLandM2: 50_000, packageSizeM2: 5_000, areaType: "STANDARD" }).totalPrice, 10_000);
    assert.equal(calculateLandPrice({ currentUsableLandM2: 50_000, packageSizeM2: 10_000, areaType: "STANDARD" }).totalPrice, 20_000);
  });

  it("applies kingdom size multiplier tiers", () => {
    assert.equal(getKingdomSizeMultiplier(99_999), 1);
    assert.equal(getKingdomSizeMultiplier(100_000), 1.25);
    assert.equal(getKingdomSizeMultiplier(499_999), 1.25);
    assert.equal(getKingdomSizeMultiplier(500_000), 1.5);
    assert.equal(getKingdomSizeMultiplier(999_999), 1.5);
    assert.equal(getKingdomSizeMultiplier(1_000_000), 2);
  });

  it("applies area multipliers and defaults unknown area types to STANDARD", () => {
    assert.equal(calculateLandPrice({ currentUsableLandM2: 50_000, packageSizeM2: 1_000, areaType: "RURAL" }).totalPrice, 1_600);
    assert.equal(calculateLandPrice({ currentUsableLandM2: 50_000, packageSizeM2: 1_000, areaType: "URBAN" }).totalPrice, 3_000);
    assert.equal(calculateLandPrice({ currentUsableLandM2: 50_000, packageSizeM2: 1_000, areaType: "STRATEGIC" }).totalPrice, 4_000);
    assert.equal(calculateLandPrice({ currentUsableLandM2: 50_000, packageSizeM2: 1_000, areaType: "UNKNOWN" }).totalPrice, 2_000);
    assert.equal(normalizeLandAreaType(null), "STANDARD");
  });

  it("rejects unsupported package sizes", () => {
    assert.throws(
      () => calculateLandPrice({ currentUsableLandM2: 50_000, packageSizeM2: 750, areaType: "STANDARD" }),
      /Unsupported land package size/,
    );
  });

  it("clamps invalid current land to the starter-size multiplier tier", () => {
    assert.equal(calculateLandPrice({ currentUsableLandM2: -10_000, packageSizeM2: 1_000, areaType: "STANDARD" }).sizeMultiplier, 1);
    assert.equal(calculateLandPrice({ currentUsableLandM2: Number.NaN, packageSizeM2: 1_000, areaType: "STANDARD" }).totalPrice, 2_000);
  });

  it("rounds total prices up", () => {
    assert.equal(roundLandPrice(12.01), 13);
    assert.equal(roundLandPrice(12), 12);
    assert.equal(roundLandPrice(-1), 0);
  });
});
