import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateDynamicMinimumSpacingM,
  createLocationSuggestionCandidates,
  limitLocationSuggestions,
  MAX_LOCATION_SUGGESTION_CANDIDATES,
  projectCoordinates,
  validateDynamicSpacingFromExistingKingdoms,
} from "./dynamic-spacing";

test("calculates dynamic minimum spacing from preview radius", () => {
  assert.equal(calculateDynamicMinimumSpacingM(126.16), 303);
  assert.equal(calculateDynamicMinimumSpacingM(50), 300);
  assert.equal(calculateDynamicMinimumSpacingM(Number.NaN), 300);
});

test("projects candidate coordinates by distance and bearing", () => {
  const north = projectCoordinates({ lat: 24.7136, lng: 46.6753 }, 300, 0);
  const east = projectCoordinates({ lat: 24.7136, lng: 46.6753 }, 300, 90);

  assert.ok(north.lat > 24.7136);
  assert.equal(Number(north.lng.toFixed(3)), 46.675);
  assert.ok(east.lng > 46.6753);
  assert.equal(Number(east.lat.toFixed(3)), 24.714);
});

test("creates deterministic candidate rings and bearings", () => {
  const candidates = createLocationSuggestionCandidates({ lat: 24.7136, lng: 46.6753 });

  assert.equal(candidates.length, 40);
  assert.deepEqual(
    candidates.slice(0, 8).map((candidate) => candidate.distanceM),
    [300, 300, 300, 300, 300, 300, 300, 300],
  );
  assert.deepEqual(
    candidates.slice(0, 8).map((candidate) => candidate.bearingDeg),
    [0, 45, 90, 135, 180, 225, 270, 315],
  );
});

test("limits suggestion results to the configured cap", () => {
  assert.equal(MAX_LOCATION_SUGGESTION_CANDIDATES, 24);
  assert.deepEqual(limitLocationSuggestions([1, 2, 3, 4, 5]), [1, 2, 3]);
  assert.deepEqual(limitLocationSuggestions([1, 2, 3], 2), [1, 2]);
});

test("validates dynamic spacing as clear when no kingdom is inside the buffer", async () => {
  const db = {
    async $queryRaw<T = unknown>(): Promise<T> {
      return [] as T;
    },
  };
  const result = await validateDynamicSpacingFromExistingKingdoms(db, {
    coordinates: { lat: 24.7136, lng: 46.6753 },
    minimumDistanceM: 303,
  });

  assert.deepEqual(result, {
    status: "CLEAR",
    minimumDistanceM: 303,
  });
});

test("validates dynamic spacing as too close when PostGIS returns a nearby kingdom", async () => {
  const db = {
    async $queryRaw<T = unknown>(): Promise<T> {
      return [
        {
          nearestKingdomId: "kingdom_1",
          nearestDistanceM: 281.6,
        },
      ] as T;
    },
  };
  const result = await validateDynamicSpacingFromExistingKingdoms(db, {
    coordinates: { lat: 24.7136, lng: 46.6753 },
    minimumDistanceM: 303,
  });

  assert.deepEqual(result, {
    status: "TOO_CLOSE",
    minimumDistanceM: 303,
    nearestDistanceM: 282,
    nearestKingdomId: "kingdom_1",
  });
});
