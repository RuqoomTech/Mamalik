import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateDistanceMeters,
  createTemporaryPreviewPolygon,
  parseLocationCoordinates,
  validateTemporaryKingdomLocation,
} from "./location-validation";

test("parses valid kingdom location coordinates", () => {
  assert.deepEqual(parseLocationCoordinates({ lat: 24.7136, lng: 46.6753 }), {
    ok: true,
    coordinates: { lat: 24.7136, lng: 46.6753 },
  });
});

test("rejects missing and non-number kingdom location coordinates", () => {
  assert.deepEqual(parseLocationCoordinates({ lat: 24.7136 }), {
    ok: false,
    reason: "missing-coordinates",
  });
  assert.deepEqual(parseLocationCoordinates({ lat: "24.7136", lng: 46.6753 }), {
    ok: false,
    reason: "invalid-coordinates",
  });
});

test("rejects out-of-range kingdom location coordinates", () => {
  assert.deepEqual(parseLocationCoordinates({ lat: 91, lng: 46.6753 }), {
    ok: false,
    reason: "latitude-out-of-range",
  });
  assert.deepEqual(parseLocationCoordinates({ lat: 24.7136, lng: 181 }), {
    ok: false,
    reason: "longitude-out-of-range",
  });
});

test("calculates temporary distance between two nearby points", () => {
  const distanceM = calculateDistanceMeters(
    { lat: 24.7136, lng: 46.6753 },
    { lat: 24.7146, lng: 46.6753 },
  );

  assert.ok(distanceM > 100);
  assert.ok(distanceM < 120);
});

test("creates a closed temporary polygon around selected coordinates", () => {
  const polygon = createTemporaryPreviewPolygon({ lat: 24.7136, lng: 46.6753 });
  const ring = polygon.coordinates[0];

  assert.equal(polygon.type, "Polygon");
  assert.equal(ring.length, 5);
  assert.deepEqual(ring[0], ring[4]);
});

test("returns valid temporary validation response when no kingdom is nearby", () => {
  const response = validateTemporaryKingdomLocation(
    { lat: 24.7136, lng: 46.6753 },
    [{ centerLat: 24.8, centerLng: 46.8 }],
  );

  assert.equal(response.valid, true);
  assert.equal(response.reason, null);
  assert.equal(response.usableLandM2, 50_000);
  assert.equal(response.visibleAreaM2, 50_000);
  assert.equal(response.previewPolygon?.type, "Polygon");
  assert.deepEqual(response.suggestions, []);
});

test("rejects temporary validation when an existing kingdom is too close", () => {
  const response = validateTemporaryKingdomLocation(
    { lat: 24.7136, lng: 46.6753 },
    [{ centerLat: 24.71361, centerLng: 46.67531 }],
  );

  assert.equal(response.valid, false);
  assert.equal(response.reason, "too-close-to-existing-kingdom");
  assert.equal(response.usableLandM2, 50_000);
  assert.equal(response.visibleAreaM2, null);
  assert.equal(response.previewPolygon, null);
  assert.ok(response.suggestions.length >= 1);
  assert.ok(response.suggestions.length <= 3);
});
