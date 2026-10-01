import {
  calculateMovementDistanceMeters,
  calculateTravelTime,
  getMovementArrivalAt,
  isMovementUnitType,
  type MovementUnitType,
} from "./travel-time";
import { validateMovementTarget, type MovementTargetFailureReason } from "./target-eligibility";

/**
 * Shared attack order validation (S5-005).
 *
 * This validator is the single source of truth for "may this kingdom send this
 * army against that target right now". The attack order mutation calls it, and
 * it returns the normalized manifest plus the resolved travel time so the
 * mutation never recomputes movement math a second way.
 *
 * Target eligibility (INVALID_TARGET, SELF_TARGET, TARGET_NOT_FOUND,
 * TARGET_PROTECTED) is NOT implemented here: it is delegated to
 * `validateMovementTarget` so ATTACK and SCOUT orders cannot drift apart on the
 * beginner protection boundary.
 */

/** One line of an attack manifest: a unit type and how many of it march. */
export type AttackArmyEntry = { unitType: MovementUnitType; quantity: number };

export type AttackOrderValidationFailureReason =
  | MovementTargetFailureReason
  | "INVALID_ARMY"
  | "INVALID_UNIT_TYPE"
  | "INSUFFICIENT_UNITS";

export type AttackOrderValidationInput = {
  sourceKingdomId: string;
  sourceCenterLat: number;
  sourceCenterLng: number;
  targetKingdomId: string | null | undefined;
  targetCenterLat: number | null | undefined;
  targetCenterLng: number | null | undefined;
  targetProtectionEndsAt: Date | null | undefined;
  /** The requested manifest, straight from the client-supplied order. */
  units: readonly AttackArmyEntry[];
  /** What the source kingdom actually holds in GARRISON, by unit type. */
  garrisonUnits: readonly AttackArmyEntry[];
  departureAt: Date;
};

export type AttackOrderValidationResult =
  | {
      ok: true;
      targetKingdomId: string;
      /** Normalized manifest: positive whole quantities, request order preserved. */
      units: AttackArmyEntry[];
      totalUnits: number;
      slowestUnitType: MovementUnitType;
      distanceM: number;
      travelTicks: number;
      arrivalAt: Date;
    }
  | { ok: false; reason: AttackOrderValidationFailureReason };

/**
 * Validate an attack order in a fixed rule order so the returned reason is
 * stable and the earliest blocking rule always wins.
 *
 * 1-4. INVALID_TARGET, SELF_TARGET, TARGET_NOT_FOUND, TARGET_PROTECTED.
 *  5.  INVALID_ARMY (empty manifest).
 *  6.  INVALID_UNIT_TYPE (unrecognized unit type).
 *  7.  INVALID_ARMY (quantity is not a positive whole number).
 *  8.  INSUFFICIENT_UNITS (garrison cannot cover the aggregated request).
 *  9.  Success, with travel time resolved from the slowest unit.
 */
export function validateAttackOrder(
  input: AttackOrderValidationInput,
): AttackOrderValidationResult {
  // 1-4. Shared target eligibility, identical to the SCOUT validator.
  //
  // Beginner protection gates the TARGET only: a protected source kingdom may
  // still attack an unprotected target, because locked decisions keep
  // build/train/buy land/prepare available during protection. Protection is
  // judged strictly against `departureAt`: a target whose protection ends
  // exactly at departure is already attackable.
  const target = validateMovementTarget({
    sourceKingdomId: input.sourceKingdomId,
    targetKingdomId: input.targetKingdomId,
    targetCenterLat: input.targetCenterLat,
    targetCenterLng: input.targetCenterLng,
    targetProtectionEndsAt: input.targetProtectionEndsAt,
    now: input.departureAt,
  });

  if (!target.ok) {
    return { ok: false, reason: target.reason };
  }

  const targetKingdomId = target.targetKingdomId;

  // 5. An attack needs at least one unit, otherwise there is no order to send.
  if (!Array.isArray(input.units) || input.units.length === 0) {
    return { ok: false, reason: "INVALID_ARMY" };
  }

  // 6. Every entry must name a recognized unit type.
  //
  // An unrecognized unit type is a hard rejection and is deliberately NOT
  // dropped: silently discarding an unknown entry would shrink the attacker's
  // declared army without telling anyone, so the order would arrive with fewer
  // units than the player asked for and the stored manifest would disagree with
  // what was validated. A non-object entry is treated the same way.
  for (const entry of input.units) {
    if (!isAttackArmyEntry(entry) || asMovementUnitType(entry.unitType) === null) {
      return { ok: false, reason: "INVALID_UNIT_TYPE" };
    }
  }

  // 7. Every quantity must be a positive whole number. Non-finite, below one,
  // and fractional quantities are all client mistakes, not things to repair.
  for (const entry of input.units) {
    if (!isPositiveInteger(entry.quantity)) {
      return { ok: false, reason: "INVALID_ARMY" };
    }
  }

  // Survivors are normalized to positive integers in the requested order.
  const units: AttackArmyEntry[] = input.units.map((entry) => ({
    unitType: asMovementUnitType(entry.unitType) as MovementUnitType,
    quantity: toPositiveInteger(entry.quantity),
  }));

  // 8. The source garrison must cover the request.
  //
  // Duplicate entries for the SAME unit type are AGGREGATED before the supply
  // comparison. Checking each entry independently would let a client split one
  // request into two halves that each fit the garrison and together exceed it
  // (requesting 60 + 60 INFANTRY against a garrison of 100 would pass), which
  // would then drive the garrison negative at reservation time.
  const requestedByUnitType = aggregateUnits(units);
  const availableByUnitType = aggregateGarrison(input.garrisonUnits);

  for (const [unitType, requestedQuantity] of requestedByUnitType) {
    const availableQuantity = availableByUnitType.get(unitType) ?? 0;

    if (availableQuantity < requestedQuantity) {
      return { ok: false, reason: "INSUFFICIENT_UNITS" };
    }
  }

  // 9. Resolve travel time from the shared movement formulas so an attack moves
  // at the pace of its SLOWEST unit, exactly like every other order.
  //
  // NOTE: the locked rule "alliance members cannot attack each other" is
  // deliberately NOT implemented here: the `Alliance` schema does not exist
  // until Sprint 6, so there is nothing authoritative to resolve an alliance
  // relationship against yet. No alliance parameter and no stub that pretends
  // to enforce it are added on purpose. When Sprint 6 lands, the check belongs
  // as one extra rule between rules 4 and 5 (a diplomatic block that outranks
  // army validity and garrison supply), added without a rewrite of this
  // validator or of its callers. The identical note lives in
  // `./scout-order-validation`, where the same locked rule also covers scouting.
  //
  // NOTE: there is deliberately NO minimum-army-size and NO maximum-army-size
  // rule. One unit is a legal attack as far as this validator is concerned. A
  // minimum army is a balance decision, not a correctness rule, and is deferred
  // exactly like `SCOUT_ORDER_MAX_SCOUTS` was in S5-003; the only size rule
  // enforced here is the correctness floor that the manifest must be non-empty.
  const distanceM = calculateMovementDistanceMeters(
    { lat: input.sourceCenterLat, lng: input.sourceCenterLng },
    { lat: input.targetCenterLat as number, lng: input.targetCenterLng as number },
  );
  const { travelTicks, slowestUnitType } = calculateTravelTime({
    distanceM,
    unitTypes: units.map((entry) => entry.unitType),
  });

  return {
    ok: true,
    targetKingdomId,
    units,
    totalUnits: units.reduce((total, entry) => total + entry.quantity, 0),
    slowestUnitType,
    distanceM,
    travelTicks,
    arrivalAt: getMovementArrivalAt(input.departureAt, travelTicks),
  };
}

function isAttackArmyEntry(value: unknown): value is AttackArmyEntry {
  return typeof value === "object" && value !== null;
}

function asMovementUnitType(value: unknown): MovementUnitType | null {
  return typeof value === "string" && isMovementUnitType(value) ? value : null;
}

function isPositiveInteger(value: number): boolean {
  return Number.isFinite(value) && value >= 1 && Number.isInteger(value);
}

function toPositiveInteger(value: number): number {
  return Math.floor(value);
}

/**
 * Sum a normalized manifest by unit type so duplicate entries collapse into one
 * supply requirement per unit type.
 */
function aggregateUnits(units: readonly AttackArmyEntry[]): Map<MovementUnitType, number> {
  const totals = new Map<MovementUnitType, number>();

  for (const entry of units) {
    totals.set(entry.unitType, (totals.get(entry.unitType) ?? 0) + entry.quantity);
  }

  return totals;
}

/**
 * Sum what the source kingdom actually has in garrison, by unit type.
 *
 * Defensive normalization: an absent array, a non-object entry, an unrecognized
 * unit type, and a non-finite, negative, or fractional quantity all contribute
 * ZERO rather than propagating `NaN` into the supply comparison. A source with
 * no army simply ends up with an empty map, so every request fails with
 * INSUFFICIENT_UNITS.
 */
function aggregateGarrison(
  garrisonUnits: readonly AttackArmyEntry[] | null | undefined,
): Map<MovementUnitType, number> {
  const totals = new Map<MovementUnitType, number>();

  if (!Array.isArray(garrisonUnits)) {
    return totals;
  }

  for (const entry of garrisonUnits) {
    if (!isAttackArmyEntry(entry)) {
      continue;
    }

    const unitType = asMovementUnitType(entry.unitType);

    if (unitType === null) {
      continue;
    }

    const quantity = toNonNegativeInteger(entry.quantity);

    if (quantity > 0) {
      totals.set(unitType, (totals.get(unitType) ?? 0) + quantity);
    }
  }

  return totals;
}

function toNonNegativeInteger(value: number): number {
  if (!Number.isFinite(value) || value <= 0) {
    return 0;
  }

  return Math.floor(value);
}
