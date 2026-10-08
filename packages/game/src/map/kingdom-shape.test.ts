import assert from "node:assert/strict";
import test from "node:test";
import {
  calculatePlanarArea,
  createKingdomShapeOutline,
  generateKingdomShape,
  getKingdomShapeSeed,
  KINGDOM_SHAPE_VERTEX_COUNT,
} from "./kingdom-shape";

const METERS_PER_DEGREE_LAT = 111_320;

function polygonAreaM2(polygon: ReturnType<typeof generateKingdomShape>, lat: number): number {
  const ring = polygon.coordinates[0] ?? [];
  const metersPerDegreeLng = METERS_PER_DEGREE_LAT * Math.cos((lat * Math.PI) / 180);
  const points = ring.slice(0, -1).map(([lng, latitude]) => [
    (lng ?? 0) * metersPerDegreeLng,
    (latitude ?? 0) * METERS_PER_DEGREE_LAT,
  ]) as Array<[number, number]>;

  return calculatePlanarArea(points);
}

test("same seed produces the same outline", () => {
  assert.deepEqual(createKingdomShapeOutline("30.37748,31.13194"), createKingdomShapeOutline("30.37748,31.13194"));
});

test("different seeds produce different outlines", () => {
  assert.notDeepEqual(createKingdomShapeOutline("a"), createKingdomShapeOutline("b"));
});

test("shape is a closed ring with the configured vertex count", () => {
  const shape = generateKingdomShape({ lat: 30, lng: 31, areaM2: 50_000 });
  const ring = shape.coordinates[0] ?? [];

  assert.equal(shape.type, "Polygon");
  assert.equal(ring.length, KINGDOM_SHAPE_VERTEX_COUNT + 1);
  assert.deepEqual(ring[0], ring[ring.length - 1]);
});

test("shape area matches the requested area within 1%", () => {
  for (const [lat, areaM2] of [
    [30.377, 50_000],
    [59.9, 50_000],
    [-33.8, 120_000],
    [0.1, 10_000],
  ] as const) {
    const shape = generateKingdomShape({ lat, lng: 31.13, areaM2 });
    const measured = polygonAreaM2(shape, lat);

    assert.ok(Math.abs(measured - areaM2) / areaM2 < 0.01, `lat ${lat}: ${measured} vs ${areaM2}`);
  }
});

test("a larger area keeps the same silhouette but grows", () => {
  const seed = getKingdomShapeSeed(30.377, 31.13);
  const small = generateKingdomShape({ lat: 30.377, lng: 31.13, areaM2: 50_000, seed });
  const large = generateKingdomShape({ lat: 30.377, lng: 31.13, areaM2: 200_000, seed });
  const smallFirst = small.coordinates[0]?.[0] ?? [0, 0];
  const largeFirst = large.coordinates[0]?.[0] ?? [0, 0];

  // Area x4 means linear scale x2 from the center for every vertex.
  assert.ok(Math.abs((largeFirst[0]! - 31.13) / (smallFirst[0]! - 31.13) - 2) < 0.01);
  assert.ok(Math.abs((largeFirst[1]! - 30.377) / (smallFirst[1]! - 30.377) - 2) < 0.01);
});
