import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateCircularBorderRadiusM,
  classifyVisibleBorderTolerance,
  validateLatitudeLongitude,
} from "./border-generation";

test("validates latitude and longitude bounds", () => {
  assert.deepEqual(validateLatitudeLongitude({ lat: 24.7136, lng: 46.6753 }), {
    ok: true,
    lat: 24.7136,
    lng: 46.6753,
  });
  assert.deepEqual(validateLatitudeLongitude({ lng: 46.6753 }), {
    ok: false,
    reason: "missing-coordinates",
  });
  assert.deepEqual(validateLatitudeLongitude({ lat: "24.7136", lng: 46.6753 }), {
    ok: false,
    reason: "invalid-coordinates",
  });
  assert.deepEqual(validateLatitudeLongitude({ lat: 91, lng: 46.6753 }), {
    ok: false,
    reason: "latitude-out-of-range",
  });
  assert.deepEqual(validateLatitudeLongitude({ lat: 24.7136, lng: 181 }), {
    ok: false,
    reason: "longitude-out-of-range",
  });
});

test("calculates circular preview radius for 50,000 m2", () => {
  const radiusM = calculateCircularBorderRadiusM(50_000);

  assert.ok(radiusM > 126);
  assert.ok(radiusM < 127);
});

test("classifies visible border tolerance boundaries", () => {
  assert.equal(classifyVisibleBorderTolerance(50_000), "STRICT");
  assert.equal(classifyVisibleBorderTolerance(49_000), "STRICT");
  assert.equal(classifyVisibleBorderTolerance(51_000), "STRICT");
  assert.equal(classifyVisibleBorderTolerance(48_999), "LOOSE");
  assert.equal(classifyVisibleBorderTolerance(55_000), "LOOSE");
  assert.equal(classifyVisibleBorderTolerance(44_999), "FALLBACK");
  assert.equal(classifyVisibleBorderTolerance(55_001), "FALLBACK");
  assert.equal(classifyVisibleBorderTolerance(Number.NaN), "FALLBACK");
});
