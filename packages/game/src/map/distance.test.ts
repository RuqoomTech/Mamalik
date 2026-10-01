import assert from "node:assert/strict";
import test from "node:test";
import { EARTH_MEAN_RADIUS_M, calculateGreatCircleDistanceMeters } from "./distance";

test("returns zero distance for identical points", () => {
  assert.equal(
    calculateGreatCircleDistanceMeters({ lat: 24.7136, lng: 46.6753 }, { lat: 24.7136, lng: 46.6753 }),
    0,
  );
});

test("calculates short great-circle distance", () => {
  const distanceM = calculateGreatCircleDistanceMeters(
    { lat: 24.7136, lng: 46.6753 },
    { lat: 24.7146, lng: 46.6753 },
  );

  assert.ok(distanceM > 100);
  assert.ok(distanceM < 120);
});

test("calculates long great-circle distance between Riyadh and London", () => {
  const distanceM = calculateGreatCircleDistanceMeters(
    { lat: 24.7136, lng: 46.6753 },
    { lat: 51.5072, lng: -0.1276 },
  );

  // Real-world great-circle distance is roughly 4,900 km.
  assert.ok(distanceM > 4_800_000);
  assert.ok(distanceM < 5_200_000);
});

test("is symmetric for reversed inputs", () => {
  const first = { lat: 35.6762, lng: 139.6503 };
  const second = { lat: -33.8688, lng: 151.2093 };

  assert.equal(
    calculateGreatCircleDistanceMeters(first, second),
    calculateGreatCircleDistanceMeters(second, first),
  );
});

test("is close to half the circumference for antipodal points", () => {
  const distanceM = calculateGreatCircleDistanceMeters(
    { lat: 0, lng: 0 },
    { lat: 0, lng: 180 },
  );

  assert.ok(Math.abs(distanceM - Math.PI * EARTH_MEAN_RADIUS_M) < 1);
});