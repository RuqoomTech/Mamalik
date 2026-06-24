import assert from "node:assert/strict";
import test from "node:test";
import {
  createLandMaskValidationResult,
  isMissingLandMaskAllowed,
  validatePointAgainstLandMask,
} from "./land-mask";

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

test("maps a land-mask hit to LAND", () => {
  assert.deepEqual(
    createLandMaskValidationResult(
      {
        tableExists: true,
        maskCount: 1,
        matchedSource: "MAMALIK_COARSE_V0_1",
        matchedName: "Arabian Peninsula coarse land mask",
      },
      false,
    ),
    {
      status: "LAND",
      source: "MAMALIK_COARSE_V0_1",
      matchedPolygonName: "Arabian Peninsula coarse land mask",
      allowMissingData: false,
    },
  );
});

test("maps an unmatched point with mask data to WATER", () => {
  assert.deepEqual(
    createLandMaskValidationResult(
      {
        tableExists: true,
        maskCount: 8,
        matchedSource: null,
        matchedName: null,
      },
      false,
    ),
    {
      status: "WATER",
      source: "MAMALIK_COARSE_V0_1",
      allowMissingData: false,
    },
  );
});

test("maps missing table and empty mask to DATA_MISSING", () => {
  assert.deepEqual(
    createLandMaskValidationResult(
      {
        tableExists: false,
        maskCount: 0,
        matchedSource: null,
        matchedName: null,
      },
      false,
    ),
    {
      status: "DATA_MISSING",
      source: "MAMALIK_COARSE_V0_1",
      allowMissingData: false,
      reason: "TABLE_MISSING",
    },
  );
  assert.deepEqual(
    createLandMaskValidationResult(
      {
        tableExists: true,
        maskCount: 0,
        matchedSource: null,
        matchedName: null,
      },
      true,
    ),
    {
      status: "DATA_MISSING",
      source: "MAMALIK_COARSE_V0_1",
      allowMissingData: true,
      reason: "EMPTY",
    },
  );
});

test("parses the missing-land-mask fallback environment flag", () => {
  assert.equal(isMissingLandMaskAllowed({ ALLOW_MISSING_LAND_MASK: "true" }), true);
  assert.equal(isMissingLandMaskAllowed({ ALLOW_MISSING_LAND_MASK: "1" }), true);
  assert.equal(isMissingLandMaskAllowed({ ALLOW_MISSING_LAND_MASK: "yes" }), true);
  assert.equal(isMissingLandMaskAllowed({ ALLOW_MISSING_LAND_MASK: "false" }), false);
  assert.equal(isMissingLandMaskAllowed({}), false);
});

test("checks table existence before querying land mask geometry", async () => {
  const db = createFakeDb([[{ tableExists: false }]]);
  const result = await validatePointAgainstLandMask(db, {
    lat: 24.7136,
    lng: 46.6753,
  });

  assert.equal(result.status, "DATA_MISSING");
  assert.equal(db.calls, 1);
});

test("returns LAND and WATER from database-shaped rows", async () => {
  const landDb = createFakeDb([
    [{ tableExists: true }],
    [
      {
        maskCount: 9,
        matchedSource: "MAMALIK_COARSE_V0_1",
        matchedName: "Arabian Peninsula coarse land mask",
      },
    ],
  ]);
  const waterDb = createFakeDb([
    [{ tableExists: true }],
    [{ maskCount: 9, matchedSource: null, matchedName: null }],
  ]);

  assert.equal(
    (await validatePointAgainstLandMask(landDb, { lat: 24.7136, lng: 46.6753 })).status,
    "LAND",
  );
  assert.equal(
    (await validatePointAgainstLandMask(waterDb, { lat: 0, lng: -30 })).status,
    "WATER",
  );
});
