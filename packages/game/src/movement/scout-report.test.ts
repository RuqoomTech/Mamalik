import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  approximateScoutObservation,
  buildScoutReportBody,
  SCOUT_ARMY_BANDS,
  SCOUT_BAND_LABELS,
  SCOUT_DEFENSE_BANDS,
  SCOUT_FOOD_BANDS,
  SCOUT_WALL_BANDS,
  type ScoutObservationInput,
  type ScoutReportApproximation,
} from "./scout-report";

const arrivedAt = new Date("2026-06-23T14:30:00.000Z");

/**
 * A deliberately distinctive, non-round kingdom. Every exact number here is one
 * a leak test can search for inside the produced report body.
 */
const OBSERVED_ENEMY: ScoutObservationInput = {
  kingdomName: "Al Qadim",
  totalGarrisonUnits: 437,
  highestWallLevel: 5,
  highestWatchtowerLevel: 7,
  defensiveDistrictLandM2: 96_500,
  foodStockpile: 7_321,
  usableLandM2: 143_000,
};

/** A kingdom whose exact state sits below every band threshold. */
const WEAK_ENEMY: ScoutObservationInput = {
  kingdomName: "Bayeem",
  totalGarrisonUnits: 12,
  highestWallLevel: 0,
  highestWatchtowerLevel: 0,
  defensiveDistrictLandM2: 0,
  foodStockpile: 250,
  usableLandM2: 50_000,
};

function buildInput(overrides: Partial<ScoutObservationInput> = {}): ScoutObservationInput {
  return { ...WEAK_ENEMY, ...overrides };
}

function buildBody(
  overrides: {
    approximation?: ScoutReportApproximation;
    movementOrderId?: string;
    targetKingdomId?: string;
    arrivedAt?: Date;
    travelTicks?: number;
  } = {},
): Record<string, string | number> {
  return buildScoutReportBody({
    approximation: overrides.approximation ?? approximateScoutObservation(OBSERVED_ENEMY),
    movementOrderId: overrides.movementOrderId ?? "movement-order-1",
    targetKingdomId: overrides.targetKingdomId ?? "kingdom-target-1",
    arrivedAt: overrides.arrivedAt ?? arrivedAt,
    travelTicks: overrides.travelTicks ?? 6,
  });
}

/** Assert nothing in a body value is NaN or otherwise non-finite. */
function assertBodyHasNoNaN(body: Record<string, string | number>): void {
  for (const [key, value] of Object.entries(body)) {
    if (typeof value === "number") {
      assert.ok(Number.isFinite(value), `${key} must be finite, received ${value}`);
    }
  }
}
describe("approximate scout observation", () => {
  it("bands the army exactly at and around the 50 and 200 unit thresholds", () => {
    assert.equal(approximateScoutObservation(buildInput({ totalGarrisonUnits: 0 })).army, "SMALL");
    assert.equal(approximateScoutObservation(buildInput({ totalGarrisonUnits: 49 })).army, "SMALL");
    // The threshold itself belongs to the HIGHER band: < 50 is SMALL.
    assert.equal(approximateScoutObservation(buildInput({ totalGarrisonUnits: 50 })).army, "MEDIUM");
    assert.equal(approximateScoutObservation(buildInput({ totalGarrisonUnits: 51 })).army, "MEDIUM");
    assert.equal(approximateScoutObservation(buildInput({ totalGarrisonUnits: 199 })).army, "MEDIUM");
    // < 200 is MEDIUM, so exactly 200 is already LARGE.
    assert.equal(approximateScoutObservation(buildInput({ totalGarrisonUnits: 200 })).army, "LARGE");
    assert.equal(approximateScoutObservation(buildInput({ totalGarrisonUnits: 5_000 })).army, "LARGE");
  });

  it("bands food exactly at and around the 1000 and 5000 thresholds", () => {
    assert.equal(approximateScoutObservation(buildInput({ foodStockpile: 0 })).food, "LOW");
    assert.equal(approximateScoutObservation(buildInput({ foodStockpile: 999 })).food, "LOW");
    // < 1000 is LOW, so exactly 1000 is already MEDIUM.
    assert.equal(approximateScoutObservation(buildInput({ foodStockpile: 1_000 })).food, "MEDIUM");
    assert.equal(approximateScoutObservation(buildInput({ foodStockpile: 4_999 })).food, "MEDIUM");
    // < 5000 is MEDIUM, so exactly 5000 is already HIGH.
    assert.equal(approximateScoutObservation(buildInput({ foodStockpile: 5_000 })).food, "HIGH");
    assert.equal(approximateScoutObservation(buildInput({ foodStockpile: 90_000 })).food, "HIGH");
  });

  it("bands the wall exactly at and around the 0, 1, 3, and 4 levels", () => {
    assert.equal(approximateScoutObservation(buildInput({ highestWallLevel: 0 })).wall, "NONE");
    assert.equal(approximateScoutObservation(buildInput({ highestWallLevel: 1 })).wall, "LOW");
    assert.equal(approximateScoutObservation(buildInput({ highestWallLevel: 2 })).wall, "MEDIUM");
    assert.equal(approximateScoutObservation(buildInput({ highestWallLevel: 3 })).wall, "MEDIUM");
    // Level 4 is above the MEDIUM ceiling, so it is the first HIGH wall.
    assert.equal(approximateScoutObservation(buildInput({ highestWallLevel: 4 })).wall, "HIGH");
    assert.equal(approximateScoutObservation(buildInput({ highestWallLevel: 12 })).wall, "HIGH");
  });

  it("treats a negative wall level as no wall at all", () => {
    const approximation = approximateScoutObservation(buildInput({ highestWallLevel: -5 }));

    assert.equal(approximation.wall, "NONE");
    // A negative wall must not inflate or deflate the defense score either.
    assert.equal(
      approximateScoutObservation(buildInput({ highestWallLevel: -5 })).defense,
      approximateScoutObservation(buildInput({ highestWallLevel: 0 })).defense,
    );
  });

  it("buckets the combined defense score at the 6 and 16 boundaries", () => {
    // score = wall*3 + watchtower*2 + floor(defensiveLand / 2000)
    const defense = (
      highestWallLevel: number,
      highestWatchtowerLevel: number,
      defensiveDistrictLandM2: number,
    ): string =>
      approximateScoutObservation(
        buildInput({ highestWallLevel, highestWatchtowerLevel, defensiveDistrictLandM2 }),
      ).defense;

    // score 5 -> WEAK, and score 6 -> NORMAL. Three different fortifications
    // reach the same score 6, which is the point of the shared scale.
    assert.equal(defense(1, 1, 0), "WEAK");
    assert.equal(defense(0, 0, 10_000), "WEAK");
    assert.equal(defense(2, 0, 0), "NORMAL");
    assert.equal(defense(0, 3, 0), "NORMAL");
    assert.equal(defense(1, 1, 2_000), "NORMAL");
    assert.equal(defense(2, 0, 2_000), "NORMAL");
    assert.equal(defense(0, 3, 2_000), "NORMAL");
    assert.equal(defense(1, 1, 4_000), "NORMAL");
    // score 15 -> NORMAL, and score 16 -> STRONG.
    assert.equal(defense(5, 0, 0), "NORMAL");
    assert.equal(defense(0, 7, 2_000), "NORMAL");
    assert.equal(defense(1, 6, 0), "NORMAL");
    assert.equal(defense(5, 0, 2_000), "STRONG");
    assert.equal(defense(4, 2, 0), "STRONG");
    assert.equal(defense(2, 5, 0), "STRONG");
    assert.equal(defense(0, 8, 0), "STRONG");
    assert.equal(defense(6, 0, 2_000), "STRONG");
    assert.equal(defense(3, 5, 0), "STRONG");
  });

  it("ignores defensive district land below one full score point", () => {
    // Wall 1 and watchtower 1 give a base score of 5, one point short of NORMAL.
    // 1,999 m2 floors to zero land points, so the kingdom stays WEAK...
    assert.equal(
      approximateScoutObservation(
        buildInput({ highestWallLevel: 1, highestWatchtowerLevel: 1, defensiveDistrictLandM2: 1_999 }),
      ).defense,
      "WEAK",
    );
    // ...while 2,000 m2 earns exactly one point and crosses into NORMAL.
    assert.equal(
      approximateScoutObservation(
        buildInput({ highestWallLevel: 1, highestWatchtowerLevel: 1, defensiveDistrictLandM2: 2_000 }),
      ).defense,
      "NORMAL",
    );
  });

  it("rounds land to the nearest 10000 m2 band with a 10000 m2 floor", () => {
    const landBand = (usableLandM2: number): number =>
      approximateScoutObservation(buildInput({ usableLandM2 })).landBandM2;

    // The floor means an empty or tiny kingdom still reads one band, never zero.
    assert.equal(landBand(0), 10_000);
    assert.equal(landBand(1), 10_000);
    assert.equal(landBand(4_999), 10_000);
    // A 50,000 m2 starter kingdom is exactly on the band boundary.
    assert.equal(landBand(50_000), 50_000);
    // Rounds down below the midpoint and up at or above it.
    assert.equal(landBand(54_000), 50_000);
    assert.equal(landBand(54_999), 50_000);
    assert.equal(landBand(55_000), 60_000);
    assert.equal(landBand(143_000), 140_000);
    assert.equal(landBand(145_000), 150_000);
  });

  it("coarsens a grown kingdom's land instead of reporting the exact total", () => {
    const exact = 143_000;

    assert.notEqual(
      approximateScoutObservation(buildInput({ usableLandM2: exact })).landBandM2,
      exact,
    );
  });

  it("returns identical results for identical input so a retried tick is stable", () => {
    const input = { ...OBSERVED_ENEMY };
    const first = approximateScoutObservation(input);
    const second = approximateScoutObservation(input);

    assert.deepEqual(second, first);
    // A third pass over a structurally equal but distinct object must also match,
    // proving the result depends only on the values and not on object identity.
    assert.deepEqual(approximateScoutObservation({ ...input }), first);
  });

  it("clamps negative, fractional, NaN, and Infinity inputs without producing NaN", () => {
    const hostile: ScoutObservationInput = {
      kingdomName: "Broken Read",
      totalGarrisonUnits: Number.NaN,
      highestWallLevel: Number.NEGATIVE_INFINITY,
      highestWatchtowerLevel: Number.POSITIVE_INFINITY,
      defensiveDistrictLandM2: -12_345,
      foodStockpile: 999.9,
      usableLandM2: Number.NaN,
    };

    const approximation = approximateScoutObservation(hostile);

    // NaN/Infinity/negative all normalize to zero, fractional values floor.
    assert.equal(approximation.army, "SMALL");
    assert.equal(approximation.wall, "NONE");
    assert.equal(approximation.food, "LOW");
    assert.equal(approximation.defense, "WEAK");
    assert.equal(approximation.landBandM2, 10_000);
    assert.ok(Number.isFinite(approximation.landBandM2));
  });

  it("floors fractional quantities rather than rounding them up", () => {
    // 49.9 floors to 49, which is still SMALL; 199.9 floors to 199, still MEDIUM.
    assert.equal(approximateScoutObservation(buildInput({ totalGarrisonUnits: 49.9 })).army, "SMALL");
    assert.equal(
      approximateScoutObservation(buildInput({ totalGarrisonUnits: 199.9 })).army,
      "MEDIUM",
    );
    // 50.9 floors to 50, which crosses into MEDIUM.
    assert.equal(
      approximateScoutObservation(buildInput({ totalGarrisonUnits: 50.9 })).army,
      "MEDIUM",
    );

  });
  it("never emits a non-finite number for any hostile input combination", () => {
    const hostileValues = [
      Number.NaN,
      Number.POSITIVE_INFINITY,
      Number.NEGATIVE_INFINITY,
      -1,
      -0.5,
      0,
      0.5,
      Number.MAX_SAFE_INTEGER,
    ];

    for (const hostile of hostileValues) {
      const approximation = approximateScoutObservation({
        kingdomName: "Hostile",
        totalGarrisonUnits: hostile,
        highestWallLevel: hostile,
        highestWatchtowerLevel: hostile,
        defensiveDistrictLandM2: hostile,
        foodStockpile: hostile,
        usableLandM2: hostile,
      });

      assert.ok(
        Number.isFinite(approximation.landBandM2),
        `landBandM2 must be finite for input ${hostile}`,
      );
    }
  });

});
describe("build scout report body", () => {
  it("carries the order, target, bands, land band, arrival, and travel ticks", () => {
    const body = buildBody();

    assert.equal(body.movementOrderId, "movement-order-1");
    assert.equal(body.targetKingdomId, "kingdom-target-1");
    assert.equal(body.targetKingdomName, OBSERVED_ENEMY.kingdomName);
    assert.equal(body.army, "LARGE");
    assert.equal(body.defense, "STRONG");
    assert.equal(body.food, "HIGH");
    assert.equal(body.wall, "HIGH");
    assert.equal(body.landBandM2, 140_000);
    assert.equal(body.arrivedAt, arrivedAt.toISOString());
    assert.equal(body.travelTicks, 6);
  });

  it("emits each band as its uppercase key value", () => {
    const weakBody = buildBody({
      approximation: approximateScoutObservation(WEAK_ENEMY),
    });

    assert.equal(weakBody.army, "SMALL");
    assert.equal(weakBody.defense, "WEAK");
    assert.equal(weakBody.food, "LOW");
    assert.equal(weakBody.wall, "NONE");
  });

  it("produces a flat JSON-safe record that round-trips unchanged", () => {
    const body = buildBody();

    assert.deepEqual(JSON.parse(JSON.stringify(body)), body);
    // Flat means every value is a primitive: no Date, no nested object or array.
    for (const [key, value] of Object.entries(body)) {
      assert.ok(
        typeof value === "string" || typeof value === "number",
        `${key} must be a string or number`,
      );
      assert.notEqual(value, undefined, `${key} must not be undefined`);
      // A `Date` or any nested structure would fail this primitive check.
      assert.ok(
        typeof value === "string" || typeof value === "number",
        `${key} must stay a primitive`,
      );
      assertBodyHasNoNaN(body);
    }
  });

  it("never leaks exact enemy values into the report body", () => {
    const body = buildBody();
    const serialized = JSON.stringify(body);

    // Exact garrison count, food stockpile, and defensive district land.
    assert.ok(!serialized.includes(String(OBSERVED_ENEMY.totalGarrisonUnits)));
    assert.ok(!serialized.includes(String(OBSERVED_ENEMY.foodStockpile)));
    assert.ok(!serialized.includes(String(OBSERVED_ENEMY.defensiveDistrictLandM2)));
    // Exact wall and watchtower levels, and the enemy\'s exact usable land.
    assert.ok(!serialized.includes(`"${OBSERVED_ENEMY.highestWallLevel}"`));
    assert.ok(!serialized.includes(String(OBSERVED_ENEMY.usableLandM2)));
    // The coarse band is still present, so the report is useful rather than empty.
    assert.equal(body.landBandM2, 140_000);
    assert.notEqual(body.landBandM2, OBSERVED_ENEMY.usableLandM2);
  });

  it("clamps a hostile travel tick count instead of writing a bad number", () => {
    assert.equal(buildBody({ travelTicks: -4 }).travelTicks, 0);
    assert.equal(buildBody({ travelTicks: 6.9 }).travelTicks, 6);
    assertBodyHasNoNaN(buildBody({ travelTicks: Number.NaN }));
  });

  it("rejects an invalid arrival date rather than persisting a wrong timestamp", () => {
    assert.throws(
      () => buildBody({ arrivedAt: new Date("not-a-date") }),
      RangeError,
    );
  });
});

describe("scout band labels", () => {
  it("labels every member of every band", () => {
    assert.deepEqual(Object.keys(SCOUT_BAND_LABELS.army).sort(), [...SCOUT_ARMY_BANDS].sort());
    assert.deepEqual(Object.keys(SCOUT_BAND_LABELS.defense).sort(), [...SCOUT_DEFENSE_BANDS].sort());
    assert.deepEqual(Object.keys(SCOUT_BAND_LABELS.food).sort(), [...SCOUT_FOOD_BANDS].sort());
    assert.deepEqual(Object.keys(SCOUT_BAND_LABELS.wall).sort(), [...SCOUT_WALL_BANDS].sort());
  });

  it("gives every band member a non-empty label", () => {
    for (const labelMap of [
      SCOUT_BAND_LABELS.army,
      SCOUT_BAND_LABELS.defense,
      SCOUT_BAND_LABELS.food,
      SCOUT_BAND_LABELS.wall,
    ]) {
      for (const label of Object.values(labelMap)) {
        assert.ok(typeof label === "string" && label.trim().length > 0);
      }
    }
  });
});
