import assert from "node:assert/strict";
import test from "node:test";

import { classifyAreaTypeForLocation } from "./area-type-classification";

const previewPolygon = {
  type: "Polygon" as const,
  coordinates: [
    [
      [46.674, 24.713],
      [46.676, 24.713],
      [46.676, 24.715],
      [46.674, 24.715],
      [46.674, 24.713],
    ],
  ],
};

test("classifies valid v0.1 locations as the default Standard area type", () => {
  const result = classifyAreaTypeForLocation({
    coordinates: { lat: 24.7136, lng: 46.6753 },
    previewPolygon,
  });

  assert.equal(result.areaType, "STANDARD");
  assert.equal(result.source, "V0_1_DEFAULT");
  assert.equal(result.confidence, "LOW");
  assert.match(result.reason, /default Standard area type/);
});

test("does not pretend invalid coordinates have a reliable classifier source", () => {
  const result = classifyAreaTypeForLocation({
    coordinates: { lat: 91, lng: 46.6753 },
    previewPolygon,
  });

  assert.equal(result.areaType, "STANDARD");
  assert.equal(result.source, "UNKNOWN");
  assert.equal(result.confidence, "LOW");
  assert.match(result.reason, /coordinates are invalid/);
});
