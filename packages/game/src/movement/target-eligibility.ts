/**
 * Shared movement target eligibility (S5-005, extracted from S5-003).
 *
 * A SCOUT order and an ATTACK order have to answer "is this a legal target for
 * this source right now" with exactly the same rules. Those rules are the four
 * below, and they live here so the two validators cannot drift apart. The
 * protection boundary in particular is subtle enough that a fix landing in one
 * copy and not the other would be a real hazard: protection is active only
 * while `protectionEndsAt > now` STRICTLY, so a timestamp exactly equal to
 * `now` has already expired and is attackable/scoutable.
 *
 * This module deliberately contains NO alliance rule and NO army-level rules:
 * those belong to the order validators that compose it (see
 * `./attack-order-validation` and `./scout-order-validation`).
 *
 * `isKingdomUnderBeginnerProtection` is DEFINED here rather than imported from
 * the scout validator, because it is a target-protection concern shared by both
 * order types. Importing it back from `./scout-order-validation` — which itself
 * imports `validateMovementTarget` from this module — would create a circular
 * dependency between the shared base and one of its consumers. That cycle
 * happens to survive today only because the call happens at call time rather
 * than module-evaluation time, which makes it a bundling-order hazard rather
 * than a safe design. `./scout-order-validation` re-exports it for compatibility.
 */

export type MovementTargetFailureReason =
  | "INVALID_TARGET"
  | "SELF_TARGET"
  | "TARGET_NOT_FOUND"
  | "TARGET_PROTECTED";

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

export type MovementTargetValidationInput = {
  sourceKingdomId: string;
  targetKingdomId: string | null | undefined;
  targetCenterLat: number | null | undefined;
  targetCenterLng: number | null | undefined;
  targetProtectionEndsAt: Date | null | undefined;
  /** The instant protection is judged against; callers pass their departure time. */
  now: Date;
};

/**
 * Validate movement target eligibility in a fixed rule order so the returned
 * reason is stable and the earliest blocking rule always wins.
 *
 * Rule order: INVALID_TARGET, SELF_TARGET, TARGET_NOT_FOUND, TARGET_PROTECTED.
 */
export function validateMovementTarget(
  input: MovementTargetValidationInput,
):
  | { ok: true; targetKingdomId: string }
  | { ok: false; reason: MovementTargetFailureReason } {
  // 1. An order needs a target kingdom id at all.
  const targetKingdomId = normalizeKingdomId(input.targetKingdomId);

  if (!targetKingdomId) {
    return { ok: false, reason: "INVALID_TARGET" };
  }

  // 2. A kingdom cannot move an order against itself.
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

  // 4. Beginner protection gates the TARGET only, never the source.
  //
  // Locked decisions (`docs/01_LOCKED_DECISIONS.md`, Beginner Protection) say
  // protected kingdoms "cannot be scouted/attacked by players" while protected
  // kingdoms "can build/train/buy land/prepare". Preparation includes training
  // and sending orders out, so a protected SOURCE kingdom must still be allowed
  // to act against an unprotected target. Gating the source here would block the
  // one action the locked decisions explicitly keep available during protection.
  //
  // The boundary is strict: `protectionEndsAt > now`. A timestamp exactly equal
  // to `now` has already expired.
  if (isKingdomUnderBeginnerProtection(targetProtectionEndsAt, input.now)) {
    return { ok: false, reason: "TARGET_PROTECTED" };
  }

  return { ok: true, targetKingdomId };
}

function normalizeKingdomId(value: string | null | undefined): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : null;
}

function toFiniteNumber(value: number | null | undefined): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function toValidDate(value: Date | null | undefined): Date | null {
  return value instanceof Date && Number.isFinite(value.getTime()) ? value : null;
}
