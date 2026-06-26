import assert from "node:assert/strict";
import test from "node:test";

import { generateVisibleBorderPreview } from "./postgis";

type QueryResult = unknown[];

function createFakeDb(responses: QueryResult[]) {
  let calls = 0;

  return {
    get calls() {
      return calls;
    },
    async $queryRaw<T = unknown>(): Promise<T> {
      const response = responses[calls];
      calls += 1;

      return response as T;
    },
  };
}

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

function borderRow(visibleAreaM2: number): QueryResult {
  return [{ geojson: previewPolygon, visibleAreaM2 }];
}

test("returns the first strict border preview without extra attempts", async () => {
  const db = createFakeDb([borderRow(49_684)]);

  const result = await generateVisibleBorderPreview(db, {
    lat: 24.7136,
    lng: 46.6753,
    targetAreaM2: 50_000,
  });

  assert.equal(result.visibleAreaM2, 49_684);
  assert.equal(result.targetAreaM2, 50_000);
  assert.equal(result.toleranceStatus, "STRICT");
  assert.equal(result.attempts.length, 1);
  assert.equal(db.calls, 1);
});

test("tries a corrected radius after a non-strict first attempt", async () => {
  const db = createFakeDb([borderRow(56_500), borderRow(50_200)]);

  const result = await generateVisibleBorderPreview(db, {
    lat: 24.7136,
    lng: 46.6753,
    targetAreaM2: 50_000,
  });

  assert.equal(result.visibleAreaM2, 50_200);
  assert.equal(result.toleranceStatus, "STRICT");
  assert.equal(result.attempts.length, 2);
  assert.deepEqual(
    result.attempts.map((attempt) => attempt.toleranceStatus),
    ["FALLBACK", "STRICT"],
  );
  assert.equal(db.calls, 2);
});

test("selects the closest loose attempt when strict cannot be generated", async () => {
  const db = createFakeDb([
    borderRow(60_000),
    borderRow(52_000),
    borderRow(54_000),
    borderRow(48_500),
    borderRow(56_000),
    borderRow(45_500),
  ]);

  const result = await generateVisibleBorderPreview(db, {
    lat: 24.7136,
    lng: 46.6753,
    targetAreaM2: 50_000,
  });

  assert.equal(result.visibleAreaM2, 48_500);
  assert.equal(result.toleranceStatus, "LOOSE");
  assert.ok(result.attempts.length <= 7);
  assert.equal(db.calls, result.attempts.length);
});
