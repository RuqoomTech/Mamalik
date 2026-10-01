import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  calculateMovementDistanceMeters,
  calculateTravelTime,
  getMovementArrivalAt,
} from "./travel-time";
import {
  isKingdomUnderBeginnerProtection,
  SCOUT_ORDER_MIN_SCOUTS,
  SCOUT_ORDER_UNIT_TYPE,
  validateScoutOrder,
  type ScoutOrderValidationInput,
} from "./scout-order-validation";

const departureAt = new Date("2026-06-23T12:00:00.000Z");
/** Unprotected target: its protection ended well before departure. */
const expiredProtection = new Date("2026-06-20T12:00:00.000Z");

const riyadh = { lat: 24.7136, lng: 46.6753 };
const london = { lat: 51.5072, lng: -0.1276 };

function buildInput(
  overrides: Partial<ScoutOrderValidationInput> = {},
): ScoutOrderValidationInput {
  return {
    sourceKingdomId: "kingdom-source",
    sourceCenterLat: riyadh.lat,
    sourceCenterLng: riyadh.lng,
    targetKingdomId: "kingdom-target",
    targetCenterLat: london.lat,
    targetCenterLng: london.lng,
    targetProtectionEndsAt: expiredProtection,
    garrisonScouts: 10,
    requestedScouts: 1,
    departureAt,
    ...overrides,
  };
}

describe("scout order validation", () => {
  it("succeeds and returns the shared movement formulas for a valid order", () => {
    const result = validateScoutOrder(buildInput({ requestedScouts: 2 }));

    assert.equal(result.ok, true);

    if (!result.ok) {
      return;
    }

    const distanceM = calculateMovementDistanceMeters(riyadh, london);
    const { travelTicks } = calculateTravelTime({
      distanceM,
      unitTypes: [SCOUT_ORDER_UNIT_TYPE],
    });

    assert.equal(result.targetKingdomId, "kingdom-target");
    assert.equal(result.scoutCount, 2);
    assert.equal(result.distanceM, distanceM);
    assert.equal(result.travelTicks, travelTicks);
    assert.equal(
      result.arrivalAt.getTime(),
      getMovementArrivalAt(departureAt, travelTicks).getTime(),
    );
    assert.ok(result.distanceM > 0);
    assert.ok(result.travelTicks >= SCOUT_ORDER_MIN_SCOUTS);
    assert.ok(result.arrivalAt.getTime() > departureAt.getTime());
  });

  it("uses scout speed so scouts arrive faster than a plain infantry order", () => {
    const distanceM = calculateMovementDistanceMeters(riyadh, london);
    const scoutTicks = calculateTravelTime({
      distanceM,
      unitTypes: [SCOUT_ORDER_UNIT_TYPE],
    }).travelTicks;
    const infantryTicks = calculateTravelTime({ distanceM }).travelTicks;
    const result = validateScoutOrder(buildInput());

    assert.ok(result.ok);
    assert.ok(scoutTicks < infantryTicks);

    if (result.ok) {
      assert.equal(result.travelTicks, scoutTicks);
    }
  });

  it("fails when the target kingdom id is missing or blank", () => {
    for (const targetKingdomId of [null, undefined, "", "   "]) {
      assert.deepEqual(
        validateScoutOrder(buildInput({ targetKingdomId })),
        { ok: false, reason: "INVALID_TARGET" },
      );
    }
  });

  it("rejects a self target even when everything else is valid", () => {
    assert.deepEqual(
      validateScoutOrder(buildInput({ targetKingdomId: "kingdom-source" })),
      { ok: false, reason: "SELF_TARGET" },
    );
  });

  it("prefers INVALID_TARGET over SELF_TARGET for a blank self target", () => {
    assert.deepEqual(
      validateScoutOrder(buildInput({ targetKingdomId: "  " })),
      { ok: false, reason: "INVALID_TARGET" },
    );
  });

  it("prefers SELF_TARGET over a protected target", () => {
    assert.deepEqual(
      validateScoutOrder(
        buildInput({
          targetKingdomId: "kingdom-source",
          targetProtectionEndsAt: new Date("2026-06-25T12:00:00.000Z"),
        }),
      ),
      { ok: false, reason: "SELF_TARGET" },
    );
  });
  it("fails when the target coordinates are missing or non-finite", () => {
    assert.deepEqual(
      validateScoutOrder(buildInput({ targetCenterLat: null })),
      { ok: false, reason: "TARGET_NOT_FOUND" },
    );
    assert.deepEqual(
      validateScoutOrder(buildInput({ targetCenterLat: undefined })),
      { ok: false, reason: "TARGET_NOT_FOUND" },
    );
    assert.deepEqual(
      validateScoutOrder(buildInput({ targetCenterLat: Number.NaN })),
      { ok: false, reason: "TARGET_NOT_FOUND" },
    );
    assert.deepEqual(
      validateScoutOrder(buildInput({ targetCenterLng: Number.POSITIVE_INFINITY })),
      { ok: false, reason: "TARGET_NOT_FOUND" },
    );
  });

  it("fails when the target protection record is missing or invalid", () => {
    assert.deepEqual(
      validateScoutOrder(buildInput({ targetProtectionEndsAt: null })),
      { ok: false, reason: "TARGET_NOT_FOUND" },
    );
    assert.deepEqual(
      validateScoutOrder(buildInput({ targetProtectionEndsAt: undefined })),
      { ok: false, reason: "TARGET_NOT_FOUND" },
    );
    assert.deepEqual(
      validateScoutOrder(buildInput({ targetProtectionEndsAt: new Date("invalid") })),
      { ok: false, reason: "TARGET_NOT_FOUND" },
    );
  });

  it("fails when the target is under beginner protection", () => {
    assert.deepEqual(
      validateScoutOrder(
        buildInput({ targetProtectionEndsAt: new Date("2026-06-23T12:00:00.001Z") }),
      ),
      { ok: false, reason: "TARGET_PROTECTED" },
    );
  });

  it("allows the exact instant protection expires", () => {
    const result = validateScoutOrder(
      buildInput({ targetProtectionEndsAt: new Date(departureAt.getTime()) }),
    );

    assert.equal(result.ok, true);

    if (result.ok) {
      assert.equal(result.targetKingdomId, "kingdom-target");
    }
  });

  it("allows a target whose protection already ended one millisecond ago", () => {
    const result = validateScoutOrder(
      buildInput({ targetProtectionEndsAt: new Date(departureAt.getTime() - 1) }),
    );

    assert.equal(result.ok, true);

    if (result.ok) {
      assert.equal(result.targetKingdomId, "kingdom-target");
    }
  });

  it("lets a protected source kingdom scout an unprotected target", () => {
    // The source's own protection never reaches this validator: locked
    // decisions keep build/train/buy/prepare available during protection, and
    // sending scouts out is exactly that kind of preparation.
    const result = validateScoutOrder(
      buildInput({ targetProtectionEndsAt: new Date("2026-06-21T12:00:00.000Z") }),
    );

    assert.equal(result.ok, true);

    if (result.ok) {
      assert.equal(result.targetKingdomId, "kingdom-target");
    }
  });
  it("fails when the requested scout count is not a positive whole number", () => {
    for (const requestedScouts of [0, -1, 2.5, Number.NaN, Number.POSITIVE_INFINITY]) {
      assert.deepEqual(
        validateScoutOrder(buildInput({ requestedScouts })),
        { ok: false, reason: "INVALID_SCOUT_COUNT" },
      );
    }
  });

  it("prefers INVALID_SCOUT_COUNT over NOT_ENOUGH_SCOUTS", () => {
    assert.deepEqual(
      validateScoutOrder(buildInput({ requestedScouts: 0, garrisonScouts: 0 })),
      { ok: false, reason: "INVALID_SCOUT_COUNT" },
    );
  });

  it("prefers TARGET_PROTECTED over an invalid scout count", () => {
    assert.deepEqual(
      validateScoutOrder(
        buildInput({
          requestedScouts: -5,
          targetProtectionEndsAt: new Date("2026-06-24T12:00:00.000Z"),
        }),
      ),
      { ok: false, reason: "TARGET_PROTECTED" },
    );
  });

  it("fails when the garrison has no scouts at all", () => {
    assert.deepEqual(
      validateScoutOrder(buildInput({ garrisonScouts: 0, requestedScouts: 1 })),
      { ok: false, reason: "NOT_ENOUGH_SCOUTS" },
    );
  });

  it("fails when the garrison has fewer scouts than requested", () => {
    assert.deepEqual(
      validateScoutOrder(buildInput({ garrisonScouts: 3, requestedScouts: 4 })),
      { ok: false, reason: "NOT_ENOUGH_SCOUTS" },
    );
  });

  it("allows sending the entire garrison", () => {
    const result = validateScoutOrder(buildInput({ garrisonScouts: 4, requestedScouts: 4 }));

    assert.equal(result.ok, true);

    if (result.ok) {
      assert.equal(result.scoutCount, 4);
    }
  });

  it("normalizes a fractional or negative garrison instead of trusting it", () => {
    assert.deepEqual(
      validateScoutOrder(buildInput({ garrisonScouts: 1.9, requestedScouts: 2 })),
      { ok: false, reason: "NOT_ENOUGH_SCOUTS" },
    );
    assert.deepEqual(
      validateScoutOrder(buildInput({ garrisonScouts: -5, requestedScouts: 1 })),
      { ok: false, reason: "NOT_ENOUGH_SCOUTS" },
    );
    assert.deepEqual(
      validateScoutOrder(buildInput({ garrisonScouts: Number.NaN, requestedScouts: 1 })),
      { ok: false, reason: "NOT_ENOUGH_SCOUTS" },
    );
  });

  it("returns the same result for the same input", () => {
    const first = validateScoutOrder(buildInput());
    const second = validateScoutOrder(buildInput());

    assert.deepEqual(first, second);

    if (first.ok && second.ok) {
      assert.equal(first.arrivalAt.getTime(), second.arrivalAt.getTime());
    }
  });

  it("normalizes surrounding whitespace on the target kingdom id", () => {
    const result = validateScoutOrder(buildInput({ targetKingdomId: "  kingdom-target  " }));

    assert.equal(result.ok, true);

    if (result.ok) {
      assert.equal(result.targetKingdomId, "kingdom-target");
    }
  });
});

describe("beginner protection helper", () => {
  it("treats a future protection end as protected", () => {
    assert.equal(
      isKingdomUnderBeginnerProtection(new Date("2026-06-23T12:00:00.001Z"), departureAt),
      true,
    );
  });

  it("treats the exact expiry instant as not protected", () => {
    assert.equal(isKingdomUnderBeginnerProtection(new Date(departureAt), departureAt), false);
  });

  it("treats a past, missing, or invalid protection end as not protected", () => {
    assert.equal(
      isKingdomUnderBeginnerProtection(new Date("2026-06-23T11:59:59.999Z"), departureAt),
      false,
    );
    assert.equal(isKingdomUnderBeginnerProtection(null, departureAt), false);
    assert.equal(isKingdomUnderBeginnerProtection(undefined, departureAt), false);
    assert.equal(isKingdomUnderBeginnerProtection(new Date("invalid"), departureAt), false);
  });

  it("expires after the locked 3-day protection window from kingdom creation", () => {
    const createdAt = new Date("2026-06-20T12:00:00.000Z");
    const endsAt = new Date(createdAt.getTime() + 3 * 24 * 60 * 60 * 1000);

    assert.equal(isKingdomUnderBeginnerProtection(endsAt, departureAt), false);
    assert.equal(
      isKingdomUnderBeginnerProtection(endsAt, new Date("2026-06-23T11:59:59.999Z")),
      true,
    );
  });
});
