import assert from "node:assert/strict";
import test from "node:test";
import { validateKingdomLocationWithPostgis } from "./location-validation";

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

test("validates a land point with land mask, preview polygon, and overlap checks", async () => {
  const db = createFakeDb([
    [{ tableExists: true }],
    [
      {
        maskCount: 9,
        matchedSource: "MAMALIK_COARSE_V0_1",
        matchedName: "Arabian Peninsula coarse land mask",
      },
    ],
    [{ geojson: previewPolygon, visibleAreaM2: 49_684 }],
    [{ tableExists: true }],
    [{ zoneCount: 2 }],
    [],
    [{ overlapCount: 0 }],
    [],
  ]);

  const response = await validateKingdomLocationWithPostgis(db, {
    lat: 24.7136,
    lng: 46.6753,
  });

  assert.equal(response.valid, true);
  assert.equal(response.reason, null);
  assert.equal(response.landCheck?.status, "LAND");
  assert.equal(response.waterCheck, "LAND");
  assert.equal(response.visibleAreaM2, 49_684);
  assert.equal(response.toleranceStatus, "STRICT");
  assert.equal(response.restrictedZoneCheck.status, "CLEAR");
  assert.equal(response.overlap?.overlaps, false);
  assert.equal(response.spacing?.status, "CLEAR");
  assert.equal(response.spacing?.minimumDistanceM, 303);
  assert.equal(db.calls, 8);
});

test("rejects water before generating a border preview", async () => {
  const db = createFakeDb([
    [{ tableExists: true }],
    [{ maskCount: 9, matchedSource: null, matchedName: null }],
  ]);

  const response = await validateKingdomLocationWithPostgis(db, {
    lat: 0,
    lng: -30,
  });

  assert.equal(response.valid, false);
  assert.equal(response.reason, "water");
  assert.deepEqual(response.center, { lat: 0, lng: -30 });
  assert.equal(response.landCheck?.status, "WATER");
  assert.equal(response.waterCheck, "WATER");
  assert.equal(response.previewPolygon, null);
  assert.equal(db.calls, 2);
});

test("rejects missing land-mask data when fallback is not enabled", async () => {
  const db = createFakeDb([[{ tableExists: false }]]);

  const response = await validateKingdomLocationWithPostgis(db, {
    lat: 24.7136,
    lng: 46.6753,
  });

  assert.equal(response.valid, false);
  assert.equal(response.reason, "land-mask-data-missing");
  assert.deepEqual(response.center, { lat: 24.7136, lng: 46.6753 });
  assert.equal(response.landCheck?.status, "DATA_MISSING");
  assert.equal(response.waterCheck, "DATA_MISSING");
  assert.equal(db.calls, 1);
});

test("rejects restricted zones before overlap checks", async () => {
  const db = createFakeDb([
    [{ tableExists: true }],
    [
      {
        maskCount: 9,
        matchedSource: "MAMALIK_COARSE_V0_1",
        matchedName: "Arabian Peninsula coarse land mask",
      },
    ],
    [{ geojson: previewPolygon, visibleAreaM2: 49_684 }],
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

  const response = await validateKingdomLocationWithPostgis(db, {
    lat: 24.95,
    lng: 46.9,
  });

  assert.equal(response.valid, false);
  assert.equal(response.reason, "restricted-zone");
  assert.equal(response.restrictedZoneCheck.status, "RESTRICTED");
  assert.equal(response.restrictedZoneCheck.zones?.[0]?.code, "S4_TEST_NO_START_RIYADH_EAST");
  assert.equal(response.overlap, null);
  assert.equal(db.calls, 6);
});

test("rejects existing kingdom border overlap with a stable no-start reason", async () => {
  const db = createFakeDb([
    [{ tableExists: true }],
    [
      {
        maskCount: 9,
        matchedSource: "MAMALIK_COARSE_V0_1",
        matchedName: "Arabian Peninsula coarse land mask",
      },
    ],
    [{ geojson: previewPolygon, visibleAreaM2: 49_684 }],
    [{ tableExists: true }],
    [{ zoneCount: 2 }],
    [],
    [{ overlapCount: 2 }],
  ]);

  const response = await validateKingdomLocationWithPostgis(db, {
    lat: 24.7136,
    lng: 46.6753,
  });

  assert.equal(response.valid, false);
  assert.equal(response.reason, "too-close-to-existing-kingdom");
  assert.equal(response.landCheck?.status, "LAND");
  assert.equal(response.restrictedZoneCheck.status, "CLEAR");
  assert.equal(response.overlap?.overlaps, true);
  assert.equal(response.overlap?.overlappingKingdomCount, 2);
  assert.equal(response.previewPolygon, null);
  assert.equal(response.toleranceStatus, "STRICT");
  assert.equal(db.calls, 7);
});

test("rejects points inside the dynamic spacing buffer", async () => {
  const db = createFakeDb([
    [{ tableExists: true }],
    [
      {
        maskCount: 9,
        matchedSource: "MAMALIK_COARSE_V0_1",
        matchedName: "Arabian Peninsula coarse land mask",
      },
    ],
    [{ geojson: previewPolygon, visibleAreaM2: 49_684 }],
    [{ tableExists: true }],
    [{ zoneCount: 2 }],
    [],
    [{ overlapCount: 0 }],
    [{ nearestKingdomId: "kingdom_1", nearestDistanceM: 281.6 }],
  ]);

  const response = await validateKingdomLocationWithPostgis(db, {
    lat: 24.7136,
    lng: 46.6753,
  });

  assert.equal(response.valid, false);
  assert.equal(response.reason, "too-close-to-existing-kingdom");
  assert.equal(response.overlap?.overlaps, false);
  assert.equal(response.spacing?.status, "TOO_CLOSE");
  assert.equal(response.spacing?.minimumDistanceM, 303);
  assert.equal(response.spacing?.nearestDistanceM, 282);
  assert.equal(response.suggestions.length, 0);
  assert.equal(db.calls, 8);
});

test("adds validated nearby suggestions without recursive suggestion generation", async () => {
  const validCandidateBatchResponses = [
    [{ tableExists: true }],
    [{ tableExists: true }],
    [{ tableExists: true }],
    [
      {
        maskCount: 9,
        matchedSource: "MAMALIK_COARSE_V0_1",
        matchedName: "Arabian Peninsula coarse land mask",
      },
    ],
    [
      {
        maskCount: 9,
        matchedSource: "MAMALIK_COARSE_V0_1",
        matchedName: "Arabian Peninsula coarse land mask",
      },
    ],
    [
      {
        maskCount: 9,
        matchedSource: "MAMALIK_COARSE_V0_1",
        matchedName: "Arabian Peninsula coarse land mask",
      },
    ],
    [{ geojson: previewPolygon, visibleAreaM2: 49_684 }],
    [{ geojson: previewPolygon, visibleAreaM2: 49_684 }],
    [{ geojson: previewPolygon, visibleAreaM2: 49_684 }],
    [{ tableExists: true }],
    [{ tableExists: true }],
    [{ tableExists: true }],
    [{ zoneCount: 2 }],
    [{ zoneCount: 2 }],
    [{ zoneCount: 2 }],
    [],
    [],
    [],
    [{ overlapCount: 0 }],
    [{ overlapCount: 0 }],
    [{ overlapCount: 0 }],
    [],
    [],
    [],
  ];
  const db = createFakeDb([
    [{ tableExists: true }],
    [
      {
        maskCount: 9,
        matchedSource: "MAMALIK_COARSE_V0_1",
        matchedName: "Arabian Peninsula coarse land mask",
      },
    ],
    [{ geojson: previewPolygon, visibleAreaM2: 49_684 }],
    [{ tableExists: true }],
    [{ zoneCount: 2 }],
    [],
    [{ overlapCount: 0 }],
    [{ nearestKingdomId: "kingdom_1", nearestDistanceM: 281.6 }],
    ...validCandidateBatchResponses,
  ]);

  const response = await validateKingdomLocationWithPostgis(db, {
    lat: 24.7136,
    lng: 46.6753,
    includeSuggestions: true,
  });

  assert.equal(response.valid, false);
  assert.equal(response.reason, "too-close-to-existing-kingdom");
  assert.equal(response.suggestions.length, 3);
  assert.deepEqual(
    response.suggestions.map((suggestion) => suggestion.reason),
    ["nearby-valid-location", "nearby-valid-location", "nearby-valid-location"],
  );
  assert.deepEqual(
    response.suggestions.map((suggestion) => suggestion.distanceM),
    [300, 300, 300],
  );
  assert.deepEqual(
    response.suggestions.map((suggestion) => suggestion.bearingDeg),
    [0, 45, 90],
  );
  assert.equal(response.suggestions[0]?.visibleAreaM2, 49_684);
  assert.equal(response.suggestions[0]?.toleranceStatus, "STRICT");
  assert.equal(db.calls, 32);
});

test("does not generate suggestions for invalid coordinate ranges", async () => {
  const db = createFakeDb([]);
  const response = await validateKingdomLocationWithPostgis(db, {
    lat: 91,
    lng: 46.6753,
    includeSuggestions: true,
  });

  assert.equal(response.valid, false);
  assert.equal(response.reason, "latitude-out-of-range");
  assert.equal(response.suggestions.length, 0);
  assert.equal(db.calls, 0);
});

test("rejects missing restricted-zone table before overlap checks", async () => {
  const db = createFakeDb([
    [{ tableExists: true }],
    [
      {
        maskCount: 9,
        matchedSource: "MAMALIK_COARSE_V0_1",
        matchedName: "Arabian Peninsula coarse land mask",
      },
    ],
    [{ geojson: previewPolygon, visibleAreaM2: 49_684 }],
    [{ tableExists: false }],
  ]);

  const response = await validateKingdomLocationWithPostgis(db, {
    lat: 24.7136,
    lng: 46.6753,
  });

  assert.equal(response.valid, false);
  assert.equal(response.reason, "restricted-zone-data-missing");
  assert.equal(response.restrictedZoneCheck.status, "DATA_MISSING");
  assert.equal(response.overlap, null);
  assert.equal(db.calls, 4);
});
