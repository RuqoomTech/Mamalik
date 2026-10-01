import {
  calculateMovementDistanceMeters,
  calculateTravelTime,
  getMovementArrivalAt,
  type MovementUnitType,
} from "./travel-time";

/**
 * Shared scout order validation (S5-003).
 *
 * This validator is the single source of truth for "may this kingdom scout
 * this target right now". Both the scout order mutation and the scout target
 * read model call it so a target can never look scoutable in one surface
 * while the mutation rejects the identical order.
 */

/** Scout orders travel as scouts only, so the pace never depends on a mixed army. */
export const SCOUT_ORDER_UNIT_TYPE: MovementUnitType = "SCOUTS";

/** A scout order always moves at least one scout. */
export const SCOUT_ORDER_MIN_SCOUTS = 1;

export type ScoutOrderValidationFailureReason =
  | "INVALID_TARGET"
  | "SELF_TARGET"
  | "TARGET_NOT_FOUND"
  | "TARGET_PROTECTED"
  | "INVALID_SCOUT_COUNT"
  | "NOT_ENOUGH_SCOUTS";

export type ScoutOrderValidationInput = {
  sourceKingdomId: string;
  sourceCenterLat: number;
  sourceCenterLng: number;
  targetKingdomId: string | null | undefined;
  targetCenterLat: number | null | undefined;
  targetCenterLng: number | null | undefined;
  targetProtectionEndsAt: Date | null | undefined;
  garrisonScouts: number;
  requestedScouts: number;
  departureAt: Date;
};

export type ScoutOrderValidationResult =
  | {
      ok: true;
      targetKingdomId: string;
      scoutCount: number;
      distanceM: number;
      travelTicks: number;
      arrivalAt: Date;
    }
  | { ok: false; reason: ScoutOrderValidationFailureReason };

/**
 * Beginner protection is active while `protectionEndsAt` is strictly in the
 * future. A timestamp exactly equal to `now` has already expired and is
 * therefore NOT protected. A missing or invalid timestamp is not protected.
 *
 * The duration itself is the locked 3-day value from `BEGINNER_PROTECTION_DAYS`;
 * this helper only judges the stored deadline, which is what callers compare.
 */
export function isKingdomUnderBeginnerProtection(
  protectionEndsAt: Date | null | undefined,
  now: Date,
): boolean {
  if (!protectionEndsAt || !Number.isFinite(protectionEndsAt.getTime())) {
    return false;
  }

  if (!Number.isFinite(now.getTime())) {
    return false;
  }

  return protectionEndsAt.getTime() > now.getTime();
}

/**
 * Validate a scout order in a fixed rule order so the returned reason is
 * stable and the earliest blocking rule always wins.
 */
export function validateScoutOrder(
  input: ScoutOrderValidationInput,
): ScoutOrderValidationResult {
  // 1. A scout order needs a target kingdom id at all.
  const targetKingdomId = normalizeKingdomId(input.targetKingdomId);

  if (!targetKingdomId) {
    return { ok: false, reason: "INVALID_TARGET" };
  }

  // 2. A kingdom cannot scout itself.
  if (targetKingdomId === input.sourceKingdomId) {
    return { ok: false, reason: "SELF_TARGET" };
  }

  // 3. The target must exist on the map and carry a known protection record.
  const targetCenterLat = toFiniteNumber(input.targetCenterLat);
  const targetCenterLng = toFiniteNumber(input.targetCenterLng);
  const targetProtectionEndsAt = toValidDate(input.targetProtectionEndsAt);

  if (targetCenterLat === null || targetCenterLng === null || targetProtectionEndsAt === null) {
    return { ok: false, reason: "TARGET_NOT_FOUND" };
  }

  // 4. Beginner protection gates the TARGET only, never the attacker.
  //
  // Locked decisions (`docs/01_LOCKED_DECISIONS.md`, Beginner Protection) say
  // protected kingdoms "cannot be scouted by players" while protected kingdoms
  // "can build/train/buy land/prepare". Preparation includes training and
  // sending out scouts, so a protected SOURCE kingdom must still be allowed to
  // scout an unprotected target. Gating the source here would block the one
  // action the locked decisions explicitly keep available during protection.
  if (isKingdomUnderBeginnerProtection(targetProtectionEndsAt, input.departureAt)) {
    return { ok: false, reason: "TARGET_PROTECTED" };
  }

  // 5. The requested scout count is client-influenced, so normalize strictly.
  if (!isPositiveInteger(input.requestedScouts)) {
    return { ok: false, reason: "INVALID_SCOUT_COUNT" };
  }

  const scoutCount = toNonNegativeInteger(input.requestedScouts);

  // 6. The source garrison must cover both the order minimum and the request.
  const garrisonScouts = toNonNegativeInteger(input.garrisonScouts);

  if (garrisonScouts < SCOUT_ORDER_MIN_SCOUTS || garrisonScouts < scoutCount) {
    return { ok: false, reason: "NOT_ENOUGH_SCOUTS" };
  }

  // 7. Reuse the shared movement formulas so scout timing matches other orders.
  //
  // NOTE: the locked rule "alliance members cannot attack each other" also
  // covers scouting, but that check is deliberately NOT implemented here: the
  // `Alliance` schema does not exist until Sprint 6, so there is nothing to
  // resolve an alliance relationship against yet. No alliance parameter and no
  // stub that pretends to enforce it are added on purpose. When Sprint 6
  // lands, the check belongs as one extra rule between rules 4 and 5 (a
  // diplomatic block that outranks scout supply), added without a rewrite of
  // this validator or of its callers.
  const distanceM = calculateMovementDistanceMeters(
    { lat: input.sourceCenterLat, lng: input.sourceCenterLng },
    { lat: targetCenterLat, lng: targetCenterLng },
  );
  const { travelTicks } = calculateTravelTime({
    distanceM,
    unitTypes: [SCOUT_ORDER_UNIT_TYPE],
  });

  return {
    ok: true,
    targetKingdomId,
    scoutCount,
    distanceM,
    travelTicks,
    arrivalAt: getMovementArrivalAt(input.departureAt, travelTicks),
  };
}

function normalizeKingdomId(value: string | null | undefined): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : null;
}

function isPositiveInteger(value: number): boolean {
  return Number.isFinite(value) && value >= SCOUT_ORDER_MIN_SCOUTS && Number.isInteger(value);
}

function toFiniteNumber(value: number | null | undefined): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function toValidDate(value: Date | null | undefined): Date | null {
  return value instanceof Date && Number.isFinite(value.getTime()) ? value : null;
}

function toNonNegativeInteger(value: number): number {
  if (!Number.isFinite(value) || value <= 0) {
    return 0;
  }

  return Math.floor(value);
}