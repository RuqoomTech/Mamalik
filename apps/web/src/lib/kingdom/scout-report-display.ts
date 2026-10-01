/**
 * Display helpers for approximate scout reports (S5-004).
 *
 * `Report.bodyJson` is untyped JSON read straight out of the database, so nothing
 * in this module trusts it. `parseScoutReportBody` validates every field it reads
 * and returns `null` for a missing or malformed body, so a bad row degrades to a
 * title-only report in the UI instead of throwing and taking a page down.
 *
 * Band wording is never authored here. Every label comes from the shared
 * `SCOUT_BAND_LABELS` in `@mamalik/game`, which is the same table the tick worker
 * bands against, so player-facing wording cannot drift from the stored bands.
 */
import {
  SCOUT_ARMY_BANDS,
  SCOUT_BAND_LABELS,
  SCOUT_DEFENSE_BANDS,
  SCOUT_FOOD_BANDS,
  SCOUT_WALL_BANDS,
  type ScoutArmyBand,
  type ScoutDefenseBand,
  type ScoutFoodBand,
  type ScoutWallBand,
} from "@mamalik/game";

const numberFormatter = new Intl.NumberFormat("en-US");

/** Shown when a scout report body carries no usable target kingdom name. */
export const SCOUT_REPORT_TARGET_FALLBACK = "Unknown kingdom";

/**
 * The subset of a scout report body this UI is allowed to render.
 *
 * `movementOrderId`, `targetKingdomId`, and `arrivedAt` are deliberately NOT
 * carried through: they are internal bookkeeping, the reports table already shows
 * the resolution time in its own column, and keeping them out keeps the player
 * surface to the coarse bands the scout contract allows.
 */
export type ScoutReportBody = {
  targetKingdomName: string;
  army: ScoutArmyBand;
  defense: ScoutDefenseBand;
  food: ScoutFoodBand;
  wall: ScoutWallBand;
  /** Coarse, rounded land band. Never the enemy`s exact land. */
  landBandM2: number;
  travelTicks: number | null;
};

export type ScoutReportBandRow = {
  key: "army" | "defense" | "food" | "wall";
  /** Player-facing field name, e.g. "Army". */
  label: string;
  /** Raw stored band, kept for debugging and tests. */
  band: string;
  /** Player-facing band wording, always from `SCOUT_BAND_LABELS`. */
  value: string;
};

/**
 * Normalize an untyped `Report.bodyJson` into the scout report shape.
 *
 * Returns `null` — never throws — when the body is missing, is not a JSON object,
 * carries a band outside the shared band unions, or has a non-numeric land band.
 * A scout report that cannot be fully understood is not partially rendered, because
 * a half-read enemy reading is worse than none.
 */
export function parseScoutReportBody(bodyJson: unknown): ScoutReportBody | null {
  try {
    const record = toJsonRecord(bodyJson);

    if (!record) {
      return null;
    }

    const army = toBand(SCOUT_ARMY_BANDS, record.army);
    const defense = toBand(SCOUT_DEFENSE_BANDS, record.defense);
    const food = toBand(SCOUT_FOOD_BANDS, record.food);
    const wall = toBand(SCOUT_WALL_BANDS, record.wall);
    const landBandM2 = toNonNegativeNumber(record.landBandM2);

    if (!army || !defense || !food || !wall || landBandM2 === null) {
      return null;
    }

    return {
      targetKingdomName:
        typeof record.targetKingdomName === "string" ? record.targetKingdomName : "",
      army,
      defense,
      food,
      wall,
      landBandM2,
      travelTicks: toNonNegativeNumber(record.travelTicks),
    };
  } catch {
    // Defensive: a body row must never be able to crash a reports page, whatever
    // shape the column happens to hold.
    return null;
  }
}

/** Target kingdom name, with a neutral fallback for an empty stored name. */
export function getScoutReportTargetName(body: ScoutReportBody): string {
  const trimmed = body.targetKingdomName.trim();

  return trimmed.length > 0 ? trimmed : SCOUT_REPORT_TARGET_FALLBACK;
}

/** The four band rows, in a stable display order, labeled from `SCOUT_BAND_LABELS`. */
export function getScoutReportBandRows(body: ScoutReportBody): ScoutReportBandRow[] {
  return [
    { key: "army", label: "Army", band: body.army, value: SCOUT_BAND_LABELS.army[body.army] },
    {
      key: "defense",
      label: "Defence",
      band: body.defense,
      value: SCOUT_BAND_LABELS.defense[body.defense],
    },
    { key: "food", label: "Food", band: body.food, value: SCOUT_BAND_LABELS.food[body.food] },
    { key: "wall", label: "Walls", band: body.wall, value: SCOUT_BAND_LABELS.wall[body.wall] },
  ];
}

/**
 * Coarse land figure, marked as approximate.
 *
 * The `≈` prefix is load-bearing: the scout contract forbids revealing exact enemy
 * land, so the number must never read as a precise measurement.
 */
export function formatScoutLandBand(landBandM2: number): string {
  return `≈${numberFormatter.format(landBandM2)} m2`;
}

/** One-line scout summary for compact surfaces such as the dashboard preview. */
export function formatScoutReportSummary(body: ScoutReportBody): string {
  const bands = getScoutReportBandRows(body).map((row) => `${row.label}: ${row.value}`);

  return [
    `Scouted ${getScoutReportTargetName(body)}`,
    ...bands,
    `Land: ${formatScoutLandBand(body.landBandM2)}`,
  ].join(" - ");
}

function toJsonRecord(value: unknown): Record<string, unknown> | null {
  // A JSON column can hold a stringified object, so a JSON string is given one
  // parse attempt rather than being treated as unreadable.
  const candidate =
    typeof value === "string" ? tryParseJson(value) : value;

  if (candidate === null || typeof candidate !== "object" || Array.isArray(candidate)) {
    return null;
  }

  return candidate as Record<string, unknown>;
}

function tryParseJson(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function toBand<TBand extends string>(bands: readonly TBand[], value: unknown): TBand | null {
  return typeof value === "string" && (bands as readonly string[]).includes(value)
    ? (value as TBand)
    : null;
}

function toNonNegativeNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : null;
}
