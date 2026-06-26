import assert from "node:assert/strict";
import test from "node:test";
import {
  appendUniqueBorderRadius,
  calculateCorrectedBorderRadiusM,
  calculateCircularBorderRadiusM,
  classifyVisibleBorderTolerance,
  createAdjustedBorderRadii,
  MAX_VISIBLE_BORDER_ATTEMPTS,
  selectBestVisibleBorderAttempt,
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

test("calculates corrected radius from measured area", () => {
  assert.equal(
    calculateCorrectedBorderRadiusM({
      currentRadiusM: 100,
      targetAreaM2: 50_000,
      measuredAreaM2: 12_500,
    }),
    200,
  );
  assert.equal(
    calculateCorrectedBorderRadiusM({
      currentRadiusM: 100,
      targetAreaM2: 50_000,
      measuredAreaM2: 0,
    }),
    0,
  );
});

test("creates bounded unique radius attempts", () => {
  const baseRadiusM = 126.1566;
  const adjustedRadii = createAdjustedBorderRadii(baseRadiusM);

  assert.deepEqual(
    adjustedRadii.map((radiusM) => Number(radiusM.toFixed(3))),
    [121.11, 123.633, 126.157, 128.68, 131.203],
  );

  let radii: number[] = [];

  for (let index = 0; index < 20; index += 1) {
    radii = appendUniqueBorderRadius(radii, baseRadiusM + index);
  }

  assert.equal(radii.length, MAX_VISIBLE_BORDER_ATTEMPTS);
  assert.deepEqual(appendUniqueBorderRadius([baseRadiusM], baseRadiusM + 0.0005), [
    baseRadiusM,
  ]);
});

test("selects strict first, then closest loose, then closest fallback", () => {
  assert.deepEqual(
    selectBestVisibleBorderAttempt([
      { radiusM: 100, visibleAreaM2: 53_000, toleranceStatus: "LOOSE" },
      { radiusM: 101, visibleAreaM2: 60_000, toleranceStatus: "FALLBACK" },
      { radiusM: 102, visibleAreaM2: 51_000, toleranceStatus: "STRICT" },
    ]),
    { radiusM: 102, visibleAreaM2: 51_000, toleranceStatus: "STRICT" },
  );
  assert.deepEqual(
    selectBestVisibleBorderAttempt([
      { radiusM: 100, visibleAreaM2: 54_000, toleranceStatus: "LOOSE" },
      { radiusM: 101, visibleAreaM2: 48_500, toleranceStatus: "LOOSE" },
      { radiusM: 102, visibleAreaM2: 49_500, toleranceStatus: "FALLBACK" },
    ]),
    { radiusM: 101, visibleAreaM2: 48_500, toleranceStatus: "LOOSE" },
  );
  assert.deepEqual(
    selectBestVisibleBorderAttempt([
      { radiusM: 100, visibleAreaM2: 62_000, toleranceStatus: "FALLBACK" },
      { radiusM: 101, visibleAreaM2: 56_000, toleranceStatus: "FALLBACK" },
    ]),
    { radiusM: 101, visibleAreaM2: 56_000, toleranceStatus: "FALLBACK" },
  );
});
