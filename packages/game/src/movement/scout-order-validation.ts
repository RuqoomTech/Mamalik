import {
  calculateMovementDistanceMeters,
  calculateTravelTime,
  getMovementArrivalAt,
  type MovementUnitType,
} from "./travel-time";
import {
  isKingdomUnderBeginnerProtection,
  validateMovementTarget,
  type MovementTargetFailureReason,
} from "./target-eligibility";

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

/**
 * The four target-eligibility reasons are shared verbatim with the attack
 * validator via `MovementTargetFailureReason`, so the union below is still
 * exactly: INVALID_TARGET, SELF_TARGET, TARGET_NOT_FOUND, TARGET_PROTECTED,
 * INVALID_SCOUT_COUNT, NOT_ENOUGH_SCOUTS.
 */
export type ScoutOrderValidationFailureReason =
  | MovementTargetFailureReason
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
 * Re-exported from `./target-eligibility` for backwards compatibility.
 *
 * S5-003 originally defined `isKingdomUnderBeginnerProtection` here. S5-005 moved
 * it into `target-eligibility` because beginner protection is a TARGET concern
 * shared by both scout and attack validation, and leaving the definition here
 * while `target-eligibility` imported it back would have made the shared module
 * depend on one of its own consumers. The implementation is unchanged and all
 * existing importers keep working.
 */
export { isKingdomUnderBeginnerProtection };

/**
 * Validate a scout order in a fixed rule order so the returned reason is
 * stable and the earliest blocking rule always wins.
 */
export function validateScoutOrder(
  input: ScoutOrderValidationInput,
): ScoutOrderValidationResult {
  // 1-4. Target eligibility is shared with the ATTACK validator so the two
  // cannot drift. `validateMovementTarget` applies INVALID_TARGET, SELF_TARGET,
  // TARGET_NOT_FOUND, and TARGET_PROTECTED in that fixed order and returns the
  // trimmed target kingdom id, so this validator keeps its exact prior
  // behaviour while owning only the scout-specific rules from here down.
  //
  // Protection is judged against `departureAt` here, exactly as before.
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

  // The shared rule only succeeds with finite coordinates, so re-normalizing
  // here yields the same finite numbers it just validated.
  const targetCenterLat = toFiniteNumber(input.targetCenterLat);
  const targetCenterLng = toFiniteNumber(input.targetCenterLng);

  if (targetCenterLat === null || targetCenterLng === null) {
    return { ok: false, reason: "TARGET_NOT_FOUND" };
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

function isPositiveInteger(value: number): boolean {
  return Number.isFinite(value) && value >= SCOUT_ORDER_MIN_SCOUTS && Number.isInteger(value);
}

function toFiniteNumber(value: number | null | undefined): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function toNonNegativeInteger(value: number): number {
  if (!Number.isFinite(value) || value <= 0) {
    return 0;
  }

  return Math.floor(value);
}