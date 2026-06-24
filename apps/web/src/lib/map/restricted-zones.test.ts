import assert from "node:assert/strict";
import test from "node:test";
import {
  createRestrictedZoneValidationResult,
  validatePointAndPreviewAgainstRestrictedZones,
} from "./restricted-zones";

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
      [46.895, 24.945],
      [46.905, 24.945],
      [46.905, 24.955],
      [46.895, 24.955],
      [46.895, 24.945],
    ],
  ],
};

test("maps missing restricted-zone table to DATA_MISSING", () => {
  const result = createRestrictedZoneValidationResult({
    tableExists: false,
    zoneCount: 0,
    zones: [],
  });

  assert.equal(result.status, "DATA_MISSING");
  assert.equal(result.reason, "TABLE_MISSING");
});

test("maps existing empty restricted-zone table to CLEAR", () => {
  const result = createRestrictedZoneValidationResult({
    tableExists: true,
    zoneCount: 0,
    zones: [],
  });

  assert.equal(result.status, "CLEAR");
  assert.equal(result.zoneCount, 0);
});

test("maps matching restricted zones to RESTRICTED", () => {
  const result = createRestrictedZoneValidationResult({
    tableExists: true,
    zoneCount: 2,
    zones: [
      {
        code: "S4_TEST_NO_START_RIYADH_EAST",
        name: "S4 Test No-Start Zone East of Riyadh",
        category: "TEST_FIXTURE",
        reason: "Artificial Sprint 4 fixture.",
      },
    ],
  });

  assert.equal(result.status, "RESTRICTED");
  assert.equal(result.zoneCount, 2);
  assert.equal(result.zones[0]?.code, "S4_TEST_NO_START_RIYADH_EAST");
});

test("queries point and preview polygon against restricted zones", async () => {
  const db = createFakeDb([
    [{ tableExists: true }],
    [{ zoneCount: 2 }],
    [
      {
        source: "MAMALIK_RESTRICTED_V0_1",
        code: "S4_TEST_NO_START_RIYADH_EAST",
        name: "S4 Test No-Start Zone East of Riyadh",
        category: "TEST_FIXTURE",
        reason: "Artificial Sprint 4 fixture.",
      },
    ],
  ]);

  const result = await validatePointAndPreviewAgainstRestrictedZones(db, {
    coordinates: { lat: 24.95, lng: 46.9 },
    previewPolygon,
  });

  assert.equal(result.status, "RESTRICTED");
  assert.equal(result.zoneCount, 2);
  assert.equal(result.zones[0]?.category, "TEST_FIXTURE");
  assert.equal(db.calls, 3);
});

test("returns CLEAR when table exists and no restricted zones match", async () => {
  const db = createFakeDb([[{ tableExists: true }], [{ zoneCount: 2 }], []]);

  const result = await validatePointAndPreviewAgainstRestrictedZones(db, {
    coordinates: { lat: 24.7136, lng: 46.6753 },
    previewPolygon,
  });

  assert.equal(result.status, "CLEAR");
  assert.equal(result.zoneCount, 2);
  assert.equal(db.calls, 3);
});
