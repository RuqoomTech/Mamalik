import assert from "node:assert/strict";
import test from "node:test";
import {
  approximateScoutObservation,
  buildScoutReportBody,
  SCOUT_BAND_LABELS,
  SCOUT_LAND_BAND_MIN_M2,
} from "@mamalik/game";
import {
  formatScoutLandBand,
  formatScoutReportSummary,
  getScoutReportBandRows,
  getScoutReportTargetName,
  parseScoutReportBody,
  SCOUT_REPORT_TARGET_FALLBACK,
} from "./scout-report-display";

const arrivedAt = new Date("2026-07-01T12:00:00.000Z");

type ObservationOverrides = Partial<{
  totalGarrisonUnits: number;
  highestWallLevel: number;
  highestWatchtowerLevel: number;
  defensiveDistrictLandM2: number;
  foodStockpile: number;
  usableLandM2: number;
}>;

/**
 * Builds a real body with the shared producer rather than hand-writing JSON, so
 * these tests fail if the stored contract ever drifts from what the UI parses.
 */
function buildBody(overrides: ObservationOverrides = {}): Record<string, string | number> {
  return buildScoutReportBody({
    approximation: approximateScoutObservation({
      kingdomName: "Emirate of Najd",
      totalGarrisonUnits: 80,
      highestWallLevel: 2,
      highestWatchtowerLevel: 1,
      defensiveDistrictLandM2: 4_000,
      foodStockpile: 2_000,
      usableLandM2: 50_000,
      ...overrides,
    }),
    movementOrderId: "movement_order_1",
    targetKingdomId: "kingdom_target_1",
    arrivedAt,
    travelTicks: 3,
  });
}

/** Round-trips through JSON exactly like the database column does. */
function stored(body: Record<string, string | number>): unknown {
  return JSON.parse(JSON.stringify(body));
}

test("parses a scout report body written by the shared producer", () => {
  assert.deepEqual(parseScoutReportBody(stored(buildBody())), {
    targetKingdomName: "Emirate of Najd",
    army: "MEDIUM",
    defense: "NORMAL",
    food: "MEDIUM",
    wall: "MEDIUM",
    landBandM2: 50_000,
    travelTicks: 3,
  });
});

test("parses the weakest and strongest band combinations", () => {
  const weakest = parseScoutReportBody(
    stored(
      buildBody({
        totalGarrisonUnits: 0,
        highestWallLevel: 0,
        highestWatchtowerLevel: 0,
        defensiveDistrictLandM2: 0,
        foodStockpile: 0,
        usableLandM2: 0,
      }),
    ),
  );

  assert.deepEqual(weakest, {
    targetKingdomName: "Emirate of Najd",
    army: "SMALL",
    defense: "WEAK",
    food: "LOW",
    wall: "NONE",
    // The shared land band never floors below its own minimum step.
    landBandM2: SCOUT_LAND_BAND_MIN_M2,
    travelTicks: 3,
  });

  const strongest = parseScoutReportBody(
    stored(
      buildBody({
        totalGarrisonUnits: 5_000,
        highestWallLevel: 6,
        highestWatchtowerLevel: 6,
        defensiveDistrictLandM2: 90_000,
        foodStockpile: 90_000,
        usableLandM2: 140_000,
      }),
    ),
  );

  assert.deepEqual(strongest, {
    targetKingdomName: "Emirate of Najd",
    army: "LARGE",
    defense: "STRONG",
    food: "HIGH",
    wall: "HIGH",
    landBandM2: 140_000,
    travelTicks: 3,
  });
});


test("returns null when a band is missing or outside the shared unions", () => {
  for (const key of ["army", "defense", "food", "wall"]) {
    const missing = { ...buildBody() } as Record<string, unknown>;
    delete missing[key];
    assert.equal(parseScoutReportBody(missing), null, `missing ${key} should be unreadable`);
    assert.equal(
      parseScoutReportBody({ ...buildBody(), [key]: "ENORMOUS" }),
      null,
      `unknown ${key} should be unreadable`,
    );
    assert.equal(
      parseScoutReportBody({ ...buildBody(), [key]: "Medium" }),
      null,
      `lowercase ${key} should be unreadable`,
    );
    assert.equal(
      parseScoutReportBody({ ...buildBody(), [key]: 2 }),
      null,
      `numeric ${key} should be unreadable`,
    );
  }
});

test("returns null for a malformed land band", () => {
  assert.equal(parseScoutReportBody({ ...buildBody(), landBandM2: "50000" }), null);
  assert.equal(parseScoutReportBody({ ...buildBody(), landBandM2: -1 }), null);
  assert.equal(parseScoutReportBody({ ...buildBody(), landBandM2: null }), null);
  assert.equal(parseScoutReportBody({ ...buildBody(), landBandM2: Number.NaN }), null);
});

test("parses a stringified body and tolerates a missing target name", () => {
  const parsed = parseScoutReportBody(JSON.stringify(buildBody()));

  assert.equal(parsed?.targetKingdomName, "Emirate of Najd");

  for (const targetKingdomName of [undefined, "", "   ", 42]) {
    const withoutName = parseScoutReportBody({ ...buildBody(), targetKingdomName });

    assert.ok(withoutName, "a blank target name must not make the whole body unreadable");
    // The stored value is kept verbatim; blankness is resolved at display time so
    // a whitespace-only name still renders the neutral fallback instead of nothing.
    assert.equal(getScoutReportTargetName(withoutName), SCOUT_REPORT_TARGET_FALLBACK);
  }
});

test("travel ticks are optional and never negative", () => {
  const body = buildBody() as Record<string, unknown>;

  assert.equal(parseScoutReportBody({ ...body, travelTicks: undefined })?.travelTicks, null);
  assert.equal(parseScoutReportBody({ ...body, travelTicks: "3" })?.travelTicks, null);
  assert.equal(parseScoutReportBody({ ...body, travelTicks: -2 })?.travelTicks, null);
  assert.equal(parseScoutReportBody({ ...body, travelTicks: 0 })?.travelTicks, 0);
});

test("band rows use the shared player-facing labels", () => {
  const parsed = parseScoutReportBody(stored(buildBody()));

  assert.ok(parsed);
  assert.deepEqual(getScoutReportBandRows(parsed), [
    { key: "army", label: "Army", band: "MEDIUM", value: SCOUT_BAND_LABELS.army.MEDIUM },
    {
      key: "defense",
      label: "Defence",
      band: "NORMAL",
      value: SCOUT_BAND_LABELS.defense.NORMAL,
    },
    { key: "food", label: "Food", band: "MEDIUM", value: SCOUT_BAND_LABELS.food.MEDIUM },
    { key: "wall", label: "Walls", band: "MEDIUM", value: SCOUT_BAND_LABELS.wall.MEDIUM },
  ]);
});

test("coarse land is formatted as approximate en-US", () => {
  assert.equal(formatScoutLandBand(50_000), "≈50,000 m2");
  assert.equal(formatScoutLandBand(1_250_000), "≈1,250,000 m2");
  assert.equal(formatScoutLandBand(0), "≈0 m2");
});

test("summary line names the target and every coarse band", () => {
  const parsed = parseScoutReportBody(stored(buildBody()));

  assert.ok(parsed);
  assert.equal(
    formatScoutReportSummary(parsed),
    "Scouted Emirate of Najd - Army: Medium - Defence: Normal - Food: Medium - Walls: Medium - Land: ≈50,000 m2",
  );
});

test("parsing never throws for hostile body shapes", () => {
  const hostile: unknown[] = [
    new Map(),
    new Date(),
    { toString: null, army: "MEDIUM" },
    [{ army: "MEDIUM" }],
  ];

  for (const body of hostile) {
    const parsed = parseScoutReportBody(body);

    assert.ok(parsed === null || typeof parsed.army === "string");
  }

  // A throwing getter must not escape the parser either.
  assert.equal(
    parseScoutReportBody({
      get army(): string {
        throw new Error("boom");
      },
    }),
    null,
  );
});

test("returns null for a missing or non-object body", () => {
  assert.equal(parseScoutReportBody(null), null);
  assert.equal(parseScoutReportBody(undefined), null);
  assert.equal(parseScoutReportBody(42), null);
  assert.equal(parseScoutReportBody(true), null);
  assert.equal(parseScoutReportBody([buildBody()]), null);
  assert.equal(parseScoutReportBody("not json"), null);
  assert.equal(parseScoutReportBody(""), null);
});
