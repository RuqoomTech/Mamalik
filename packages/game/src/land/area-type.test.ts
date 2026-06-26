import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  DEFAULT_LAND_AREA_TYPE,
  getLandAreaTypeLabel,
  isLandAreaType,
  LAND_AREA_TYPE_LABELS,
  LAND_AREA_TYPES,
  normalizeLandAreaType,
  parseLandAreaType,
} from "./area-type";

describe("land area types", () => {
  it("defines the v0.1 placeholder default as STANDARD", () => {
    assert.equal(DEFAULT_LAND_AREA_TYPE, "STANDARD");
    assert.equal(normalizeLandAreaType(null), "STANDARD");
    assert.equal(normalizeLandAreaType(undefined), "STANDARD");
  });

  it("recognizes exact area type values and parses case-insensitively", () => {
    assert.equal(isLandAreaType("STANDARD"), true);
    assert.equal(isLandAreaType("rural"), false);
    assert.equal(parseLandAreaType("rural"), "RURAL");
    assert.equal(parseLandAreaType("urban"), "URBAN");
    assert.equal(parseLandAreaType("Strategic"), "STRATEGIC");
  });

  it("rejects unsupported area types and normalizes them to STANDARD", () => {
    assert.equal(isLandAreaType("COASTAL"), false);
    assert.equal(parseLandAreaType("COASTAL"), null);
    assert.equal(normalizeLandAreaType("COASTAL"), "STANDARD");
  });

  it("provides stable display labels for each supported area type", () => {
    assert.deepEqual(LAND_AREA_TYPES, ["STANDARD", "RURAL", "URBAN", "STRATEGIC"]);
    assert.equal(LAND_AREA_TYPE_LABELS.STANDARD, "Standard");
    assert.equal(getLandAreaTypeLabel("RURAL"), "Rural");
    assert.equal(getLandAreaTypeLabel("unknown"), "Standard");
  });
});
