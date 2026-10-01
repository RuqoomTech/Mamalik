/**
 * Shared approximate scout report logic (S5-004).
 *
 * Locked decisions (`docs/01_LOCKED_DECISIONS.md`, Combat) say only that
 * "Scouts reveal approximate enemy information". The exact shape of that
 * approximation is a v0.1 design choice, so the thresholds below are v0.1
 * BALANCE PLACEHOLDERS rather than locked decisions, and every one of them is
 * retunable as real playtest data arrives.
 *
 * HARD RULE enforced by this module: a scout must never learn an exact enemy
 * value. Nothing here returns unit counts, food totals, land totals, or
 * building levels. Only coarse bands and a coarse land band are produced, and
 * `buildScoutReportBody` is the only place that turns those bands into a
 * `Report.bodyJson` payload, so the leak surface stays auditable in one file.
 */

/** Band membership, declared as explicit unions to keep the public contract stable. */
export type ScoutArmyBand = "SMALL" | "MEDIUM" | "LARGE";
export type ScoutDefenseBand = "WEAK" | "NORMAL" | "STRONG";
export type ScoutFoodBand = "LOW" | "MEDIUM" | "HIGH";
export type ScoutWallBand = "NONE" | "LOW" | "MEDIUM" | "HIGH";

export const SCOUT_ARMY_BANDS: readonly ScoutArmyBand[] = ["SMALL", "MEDIUM", "LARGE"];
export const SCOUT_DEFENSE_BANDS: readonly ScoutDefenseBand[] = ["WEAK", "NORMAL", "STRONG"];
export const SCOUT_FOOD_BANDS: readonly ScoutFoodBand[] = ["LOW", "MEDIUM", "HIGH"];
export const SCOUT_WALL_BANDS: readonly ScoutWallBand[] = ["NONE", "LOW", "MEDIUM", "HIGH"];

/**
 * v0.1 balance placeholders, not locked decisions.
 *
 * Army: below `SCOUT_ARMY_MEDIUM_MIN_UNITS` is SMALL, below
 * `SCOUT_ARMY_LARGE_MIN_UNITS` is MEDIUM, otherwise LARGE. The thresholds sit
 * where a fresh starter kingdom reads SMALL and a developed one reads LARGE.
 */
export const SCOUT_ARMY_MEDIUM_MIN_UNITS = 50;
export const SCOUT_ARMY_LARGE_MIN_UNITS = 200;

/**
 * v0.1 balance placeholders, not locked decisions.
 *
 * Food: below `SCOUT_FOOD_MEDIUM_MIN` is LOW, below `SCOUT_FOOD_HIGH_MIN` is
 * MEDIUM, otherwise HIGH.
 */
export const SCOUT_FOOD_MEDIUM_MIN = 1_000;
export const SCOUT_FOOD_HIGH_MIN = 5_000;

/**
 * v0.1 balance placeholders, not locked decisions.
 *
 * Wall: `NONE` when the kingdom has no wall at all, then the highest wall LEVEL
 * (`<= 1` -> LOW, `<= 3` -> MEDIUM, otherwise HIGH). Banding a level rather
 * than a count already hides how many walls the enemy owns.
 */
export const SCOUT_WALL_LOW_MAX_LEVEL = 1;
export const SCOUT_WALL_MEDIUM_MAX_LEVEL = 3;
/**
 * v0.1 balance placeholders, not locked decisions.
 *
 * The defense score mixes three fortifications into one number and is then cut
 * into three labels (`< 6` -> WEAK, `< 16` -> NORMAL, otherwise STRONG).
 *
 * This collapse is intentional, not a simplification shortcut. A wall level, a
 * watchtower level, and a defensive district area are three very different
 * things; a single WEAK/NORMAL/STRONG label means a scout cannot read an exact
 * enemy defence off the report, cannot infer which single fortification is
 * strong, and cannot solve for one input from the others. The weighted sum is
 * documented so the band is explainable to a player, not to reverse-engineer.
 */
export const SCOUT_DEFENSE_WALL_WEIGHT = 3;
export const SCOUT_DEFENSE_WATCHTOWER_WEIGHT = 2;
/** One point of score per this much defensive district land. */
export const SCOUT_DEFENSE_LAND_PER_POINT_M2 = 2_000;
export const SCOUT_DEFENSE_NORMAL_MIN_SCORE = 6;
export const SCOUT_DEFENSE_STRONG_MIN_SCORE = 16;

/**
 * v0.1 balance placeholders, not locked decisions.
 *
 * The land band is deliberately COARSE: a scout must not learn the enemy's
 * exact land, so usable land is rounded to the nearest
 * `SCOUT_LAND_BAND_STEP_M2` and never reported below `SCOUT_LAND_BAND_MIN_M2`.
 *
 * A 50,000 m2 starter kingdom therefore rounding to exactly 50,000 is
 * acceptable and not a leak: the 50,000 m2 starting land credit is a PUBLIC
 * locked constant in `docs/01_LOCKED_DECISIONS.md`, so every player already
 * knows it. A grown kingdom is genuinely coarsened, because only its band is
 * revealed.
 */
export const SCOUT_LAND_BAND_STEP_M2 = 10_000;
export const SCOUT_LAND_BAND_MIN_M2 = 10_000;

/** Exact enemy state observed by the scouting force, as read server-side on arrival. */
export type ScoutObservationInput = {
  kingdomName: string;
  totalGarrisonUnits: number;
  highestWallLevel: number;
  highestWatchtowerLevel: number;
  defensiveDistrictLandM2: number;
  foodStockpile: number;
  usableLandM2: number;
};

/** Everything a scout report is allowed to reveal about the target. */
export type ScoutReportApproximation = {
  kingdomName: string;
  army: ScoutArmyBand;
  defense: ScoutDefenseBand;
  food: ScoutFoodBand;
  landBandM2: number;
  wall: ScoutWallBand;
};

/**
 * Reduce exact observed enemy state to coarse bands.
 *
 * DETERMINISM IS REQUIRED, not incidental: a tick can be retried and a report
 * must not change on replay. So this function uses no `Math.random()`, no
 * `Date.now()`, no clock reads, and no external state of any kind. The same
 * input always produces a deeply identical output, which is what lets a
 * retried tick safely upsert the same `Report` row instead of inventing a
 * second, different one.
 */
export function approximateScoutObservation(
  input: ScoutObservationInput,
): ScoutReportApproximation {
  // Normalize defensively before anything is compared. Non-finite, negative,
  // and fractional values all collapse to a non-negative integer so a bad
  // aggregate read can never produce NaN in a persisted report.
  const totalGarrisonUnits = toNonNegativeInteger(input.totalGarrisonUnits);
  const highestWallLevel = toNonNegativeInteger(input.highestWallLevel);
  const highestWatchtowerLevel = toNonNegativeInteger(input.highestWatchtowerLevel);
  const defensiveDistrictLandM2 = toNonNegativeInteger(input.defensiveDistrictLandM2);
  const foodStockpile = toNonNegativeInteger(input.foodStockpile);
  const usableLandM2 = toNonNegativeInteger(input.usableLandM2);

  return {
    kingdomName: toKingdomName(input.kingdomName),
    army: toArmyBand(totalGarrisonUnits),
    defense: toDefenseBand(highestWallLevel, highestWatchtowerLevel, defensiveDistrictLandM2),
    food: toFoodBand(foodStockpile),
    landBandM2: toLandBandM2(usableLandM2),
    wall: toWallBand(highestWallLevel),
  };
}

/**
 * Flat, JSON-safe `Report.bodyJson` payload for an arrived scout order.
 *
 * Only the coarse bands from `approximateScoutObservation` are emitted: no
 * exact unit count, food total, land total, or building level appears here.
 * Every value is a string or a number, so the payload round-trips through
 * `JSON.parse(JSON.stringify(body))` unchanged, and it holds no `Date` and no
 * `undefined` (the arrival timestamp is stored as an ISO-8601 string).
 */
export function buildScoutReportBody(input: {
  approximation: ScoutReportApproximation;
  movementOrderId: string;
  targetKingdomId: string;
  arrivedAt: Date;
  travelTicks: number;
}): Record<string, string | number> {
  const { approximation } = input;

  if (!(input.arrivedAt instanceof Date) || !Number.isFinite(input.arrivedAt.getTime())) {
    // Same stance as `getMovementArrivalAt` in `./travel-time`: a bad arrival
    // timestamp is a caller bug, and throwing surfaces it instead of writing a
    // silently wrong report into the database.
    throw new RangeError("Invalid arrivedAt date for scout report body.");
  }

  return {
    movementOrderId: toNonEmptyString(input.movementOrderId),
    targetKingdomId: toNonEmptyString(input.targetKingdomId),
    targetKingdomName: approximation.kingdomName,
    // Bands are already uppercase keys; normalizing here keeps the stored
    // report stable even if a future band constant is ever authored lowercase.
    army: approximation.army.toUpperCase(),
    defense: approximation.defense.toUpperCase(),
    food: approximation.food.toUpperCase(),
    wall: approximation.wall.toUpperCase(),
    landBandM2: approximation.landBandM2,
    arrivedAt: input.arrivedAt.toISOString(),
    travelTicks: toNonNegativeInteger(input.travelTicks),
  };
}

/** Player-facing labels for every band member. */
export const SCOUT_BAND_LABELS: {
  army: Record<ScoutArmyBand, string>;
  defense: Record<ScoutDefenseBand, string>;
  food: Record<ScoutFoodBand, string>;
  wall: Record<ScoutWallBand, string>;
} = {
  army: {
    SMALL: "Small",
    MEDIUM: "Medium",
    LARGE: "Large",
  },
  defense: {
    WEAK: "Weak",
    NORMAL: "Normal",
    STRONG: "Strong",
  },
  food: {
    LOW: "Low",
    MEDIUM: "Medium",
    HIGH: "High",
  },
  wall: {
    NONE: "None",
    LOW: "Low",
    MEDIUM: "Medium",
    HIGH: "High",
  },
};

function toArmyBand(totalGarrisonUnits: number): ScoutArmyBand {
  if (totalGarrisonUnits < SCOUT_ARMY_MEDIUM_MIN_UNITS) {
    return "SMALL";
  }

  if (totalGarrisonUnits < SCOUT_ARMY_LARGE_MIN_UNITS) {
    return "MEDIUM";
  }

  return "LARGE";
}

function toFoodBand(foodStockpile: number): ScoutFoodBand {
  if (foodStockpile < SCOUT_FOOD_MEDIUM_MIN) {
    return "LOW";
  }

  if (foodStockpile < SCOUT_FOOD_HIGH_MIN) {
    return "MEDIUM";
  }

  return "HIGH";
}

function toWallBand(highestWallLevel: number): ScoutWallBand {
  if (highestWallLevel <= 0) {
    return "NONE";
  }

  if (highestWallLevel <= SCOUT_WALL_LOW_MAX_LEVEL) {
    return "LOW";
  }

  if (highestWallLevel <= SCOUT_WALL_MEDIUM_MAX_LEVEL) {
    return "MEDIUM";
  }

  return "HIGH";
}

/**
 * Collapse walls, watchtowers, and defensive district land into one coarse
 * score, then cut it into three labels. See the comment on
 * `SCOUT_DEFENSE_NORMAL_MIN_SCORE` for why the collapse is the point.
 */
function toDefenseBand(
  highestWallLevel: number,
  highestWatchtowerLevel: number,
  defensiveDistrictLandM2: number,
): ScoutDefenseBand {
  const score =
    highestWallLevel * SCOUT_DEFENSE_WALL_WEIGHT +
    highestWatchtowerLevel * SCOUT_DEFENSE_WATCHTOWER_WEIGHT +
    Math.floor(defensiveDistrictLandM2 / SCOUT_DEFENSE_LAND_PER_POINT_M2);

  if (score < SCOUT_DEFENSE_NORMAL_MIN_SCORE) {
    return "WEAK";
  }

  if (score < SCOUT_DEFENSE_STRONG_MIN_SCORE) {
    return "NORMAL";
  }

  return "STRONG";
}

/** Nearest step of land, floored at one step so an empty band never reads as zero land. */
function toLandBandM2(usableLandM2: number): number {
  const rounded =
    Math.round(usableLandM2 / SCOUT_LAND_BAND_STEP_M2) * SCOUT_LAND_BAND_STEP_M2;

  return Math.max(SCOUT_LAND_BAND_MIN_M2, rounded);
}

function toNonNegativeInteger(value: number): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return 0;
  }

  return Math.floor(value);
}

function toKingdomName(value: string): string {
  return typeof value === "string" ? value : "";
}

function toNonEmptyString(value: string): string {
  return typeof value === "string" ? value.trim() : "";
}