import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  calculateMovementDistanceMeters,
  calculateTravelTime,
  getMovementArrivalAt,
} from "./travel-time";
import {
  validateAttackOrder,
  type AttackArmyEntry,
  type AttackOrderValidationInput,
} from "./attack-order-validation";

const departureAt = new Date("2026-06-23T12:00:00.000Z");
/** Unprotected target: its protection ended well before departure. */
const expiredProtection = new Date("2026-06-20T12:00:00.000Z");

const riyadh = { lat: 24.7136, lng: 46.6753 };
const london = { lat: 51.5072, lng: -0.1276 };

function buildInput(
  overrides: Partial<AttackOrderValidationInput> = {},
): AttackOrderValidationInput {
  return {
    sourceKingdomId: "kingdom-source",
    sourceCenterLat: riyadh.lat,
    sourceCenterLng: riyadh.lng,
    targetKingdomId: "kingdom-target",
    targetCenterLat: london.lat,
    targetCenterLng: london.lng,
    targetProtectionEndsAt: expiredProtection,
    units: [{ unitType: "INFANTRY", quantity: 50 }],
    garrisonUnits: [{ unitType: "INFANTRY", quantity: 100 }],
    departureAt,
    ...overrides,
  };
}

describe("attack order validation", () => {
  it("succeeds and returns the shared movement formulas for a valid order", () => {
    const result = validateAttackOrder(buildInput());

    assert.equal(result.ok, true);

    if (!result.ok) {
      return;
    }

    const distanceM = calculateMovementDistanceMeters(riyadh, london);
    const { travelTicks, slowestUnitType } = calculateTravelTime({
      distanceM,
      unitTypes: ["INFANTRY"],
    });

    assert.equal(result.targetKingdomId, "kingdom-target");
    assert.deepEqual(result.units, [{ unitType: "INFANTRY", quantity: 50 }]);
    assert.equal(result.totalUnits, 50);
    assert.equal(result.slowestUnitType, slowestUnitType);
    assert.equal(result.distanceM, distanceM);
    assert.equal(result.travelTicks, travelTicks);
    assert.equal(
      result.arrivalAt.getTime(),
      getMovementArrivalAt(departureAt, travelTicks).getTime(),
    );
    assert.ok(result.distanceM > 0);
    assert.ok(result.travelTicks >= 1);
    assert.ok(result.arrivalAt.getTime() > departureAt.getTime());
  });

  it("sums totalUnits and finds the slowest unit for a mixed manifest", () => {
    const result = validateAttackOrder(
      buildInput({
        units: [
          { unitType: "INFANTRY", quantity: 30 },
          { unitType: "SCOUTS", quantity: 12 },
          { unitType: "CAVALRY", quantity: 8 },
        ],
        garrisonUnits: [
          { unitType: "INFANTRY", quantity: 40 },
          { unitType: "SCOUTS", quantity: 20 },
          { unitType: "CAVALRY", quantity: 10 },
        ],
      }),
    );

    assert.equal(result.ok, true);

    if (!result.ok) {
      return;
    }

    assert.equal(result.totalUnits, 50);
    // Cavalry (1.5) is faster than Infantry (1), so Infantry is the slowest here.
    assert.equal(result.slowestUnitType, "INFANTRY");
    assert.equal(result.units.length, 3);
  });

  it("moves a mixed army containing SIEGE slower than one of only SCOUTS", () => {
    const siegeArmy = validateAttackOrder(
      buildInput({
        units: [
          { unitType: "SCOUTS", quantity: 5 },
          { unitType: "SIEGE", quantity: 2 },
        ],
        garrisonUnits: [
          { unitType: "SCOUTS", quantity: 5 },
          { unitType: "SIEGE", quantity: 2 },
        ],
      }),
    );
    const scoutOnlyArmy = validateAttackOrder(
      buildInput({
        units: [{ unitType: "SCOUTS", quantity: 5 }],
        garrisonUnits: [{ unitType: "SCOUTS", quantity: 5 }],
      }),
    );

    assert.equal(siegeArmy.ok, true);
    assert.equal(scoutOnlyArmy.ok, true);

    if (!siegeArmy.ok || !scoutOnlyArmy.ok) {
      return;
    }

    // Same distance, but an order travels at the pace of its slowest unit.
    assert.equal(siegeArmy.distanceM, scoutOnlyArmy.distanceM);
    assert.equal(siegeArmy.slowestUnitType, "SIEGE");
    assert.equal(scoutOnlyArmy.slowestUnitType, "SCOUTS");
    assert.ok(siegeArmy.travelTicks > scoutOnlyArmy.travelTicks);
  });

  it("fails when the target kingdom id is missing or blank", () => {
    for (const targetKingdomId of [null, undefined, "", "   "]) {
      assert.deepEqual(validateAttackOrder(buildInput({ targetKingdomId })), {
        ok: false,
        reason: "INVALID_TARGET",
      });
    }
  });

  it("rejects a self target even when everything else is valid", () => {
    assert.deepEqual(validateAttackOrder(buildInput({ targetKingdomId: "kingdom-source" })), {
      ok: false,
      reason: "SELF_TARGET",
    });
  });

  it("prefers INVALID_TARGET over SELF_TARGET, and SELF_TARGET over a protected target", () => {
    assert.deepEqual(validateAttackOrder(buildInput({ targetKingdomId: "  " })), {
      ok: false,
      reason: "INVALID_TARGET",
    });
    assert.deepEqual(
      validateAttackOrder(
        buildInput({
          targetKingdomId: "kingdom-source",
          targetProtectionEndsAt: new Date("2026-06-25T12:00:00.000Z"),
        }),
      ),
      { ok: false, reason: "SELF_TARGET" },
    );
  });

  it("fails when the target coordinates are missing or non-finite", () => {
    for (const targetCenterLat of [null, undefined, Number.NaN]) {
      assert.deepEqual(validateAttackOrder(buildInput({ targetCenterLat })), {
        ok: false,
        reason: "TARGET_NOT_FOUND",
      });
    }

    assert.deepEqual(validateAttackOrder(buildInput({ targetCenterLng: Number.POSITIVE_INFINITY })), {
      ok: false,
      reason: "TARGET_NOT_FOUND",
    });
  });

  it("fails when the target protection record is missing or invalid", () => {
    for (const targetProtectionEndsAt of [null, undefined, new Date("invalid")]) {
      assert.deepEqual(validateAttackOrder(buildInput({ targetProtectionEndsAt })), {
        ok: false,
        reason: "TARGET_NOT_FOUND",
      });
    }
  });

  it("fails when the target is under beginner protection", () => {
    assert.deepEqual(
      validateAttackOrder(
        buildInput({ targetProtectionEndsAt: new Date("2026-06-23T12:00:00.001Z") }),
      ),
      { ok: false, reason: "TARGET_PROTECTED" },
    );
  });

  it("allows the exact instant protection expires", () => {
    // The boundary is strict: protection is active only while
    // `protectionEndsAt > now`, so an expiry equal to departure has lapsed.
    const result = validateAttackOrder(
      buildInput({ targetProtectionEndsAt: new Date(departureAt.getTime()) }),
    );

    assert.equal(result.ok, true);

    if (result.ok) {
      assert.equal(result.targetKingdomId, "kingdom-target");
    }
  });

  it("lets a protected source kingdom attack an unprotected target", () => {
    // Protection gates the TARGET only; the source's own protection never
    // reaches this validator, matching locked decisions and the scout rules.
    const result = validateAttackOrder(buildInput());

    assert.equal(result.ok, true);

    if (result.ok) {
      assert.equal(result.targetKingdomId, "kingdom-target");
    }
  });

  it("normalizes surrounding whitespace on the target kingdom id", () => {
    const result = validateAttackOrder(buildInput({ targetKingdomId: "  kingdom-target  " }));

    assert.equal(result.ok, true);

    if (result.ok) {
      assert.equal(result.targetKingdomId, "kingdom-target");
    }
  });

  it("fails when the requested army is empty", () => {
    assert.deepEqual(validateAttackOrder(buildInput({ units: [] })), {
      ok: false,
      reason: "INVALID_ARMY",
    });
  });

  it("rejects an unknown unit type instead of silently dropping it", () => {
    const unknown = { unitType: "DRAGONS", quantity: 1 } as unknown as AttackArmyEntry;

    assert.deepEqual(validateAttackOrder(buildInput({ units: [unknown] })), {
      ok: false,
      reason: "INVALID_UNIT_TYPE",
    });
    // Dropping it would silently shrink the declared army and still report success.
    assert.deepEqual(
      validateAttackOrder(
        buildInput({ units: [{ unitType: "INFANTRY", quantity: 5 }, unknown] }),
      ),
      { ok: false, reason: "INVALID_UNIT_TYPE" },
    );
  });

  it("prefers INVALID_UNIT_TYPE over an invalid quantity", () => {
    assert.deepEqual(
      validateAttackOrder(
        buildInput({ units: [{ unitType: "DRAGONS", quantity: 0 } as unknown as AttackArmyEntry] }),
      ),
      { ok: false, reason: "INVALID_UNIT_TYPE" },
    );
  });

  it("fails when a quantity is not a positive whole number", () => {
    for (const quantity of [0, -1, 2.5, Number.NaN, Number.POSITIVE_INFINITY]) {
      assert.deepEqual(
        validateAttackOrder(buildInput({ units: [{ unitType: "INFANTRY", quantity }] })),
        { ok: false, reason: "INVALID_ARMY" },
      );
    }
  });

  it("allows a single unit, since there is no minimum army size", () => {
    const result = validateAttackOrder(
      buildInput({
        units: [{ unitType: "SCOUTS", quantity: 1 }],
        garrisonUnits: [{ unitType: "SCOUTS", quantity: 1 }],
      }),
    );

    assert.equal(result.ok, true);

    if (result.ok) {
      assert.equal(result.totalUnits, 1);
    }
  });

  it("fails when the garrison cannot cover a single unit type", () => {
    assert.deepEqual(
      validateAttackOrder(
        buildInput({
          units: [{ unitType: "INFANTRY", quantity: 101 }],
          garrisonUnits: [{ unitType: "INFANTRY", quantity: 100 }],
        }),
      ),
      { ok: false, reason: "INSUFFICIENT_UNITS" },
    );
  });

  it("allows sending the entire garrison", () => {
    const result = validateAttackOrder(
      buildInput({
        units: [{ unitType: "INFANTRY", quantity: 100 }],
        garrisonUnits: [{ unitType: "INFANTRY", quantity: 100 }],
      }),
    );

    assert.equal(result.ok, true);

    if (result.ok) {
      assert.equal(result.totalUnits, 100);
    }
  });

  it("fails when the garrison holds a different unit type entirely", () => {
    assert.deepEqual(
      validateAttackOrder(
        buildInput({
          units: [{ unitType: "CAVALRY", quantity: 1 }],
          garrisonUnits: [{ unitType: "INFANTRY", quantity: 100 }],
        }),
      ),
      { ok: false, reason: "INSUFFICIENT_UNITS" },
    );
  });

  it("fails when the garrison is empty", () => {
    assert.deepEqual(validateAttackOrder(buildInput({ garrisonUnits: [] })), {
      ok: false,
      reason: "INSUFFICIENT_UNITS",
    });
  });

  it("prefers TARGET_PROTECTED over an invalid army", () => {
    assert.deepEqual(
      validateAttackOrder(
        buildInput({
          units: [],
          targetProtectionEndsAt: new Date("2026-06-24T12:00:00.000Z"),
        }),
      ),
      { ok: false, reason: "TARGET_PROTECTED" },
    );
  });

  it("sums duplicate manifest entries against the garrison", () => {
    // 60 + 60 exceeds a garrison of 100 even though each entry fits on its own.
    // Checking entries independently would let this through and then drive the
    // garrison negative at reservation time.
    assert.deepEqual(
      validateAttackOrder(
        buildInput({
          units: [
            { unitType: "INFANTRY", quantity: 60 },
            { unitType: "INFANTRY", quantity: 60 },
          ],
          garrisonUnits: [{ unitType: "INFANTRY", quantity: 100 }],
        }),
      ),
      { ok: false, reason: "INSUFFICIENT_UNITS" },
    );
  });

  it("allows duplicate entries that together fit inside the garrison", () => {
    const result = validateAttackOrder(
      buildInput({
        units: [
          { unitType: "INFANTRY", quantity: 40 },
          { unitType: "INFANTRY", quantity: 40 },
        ],
        garrisonUnits: [{ unitType: "INFANTRY", quantity: 100 }],
      }),
    );

    assert.equal(result.ok, true);

    if (result.ok) {
      assert.equal(result.totalUnits, 80);
      assert.deepEqual(result.units, [
        { unitType: "INFANTRY", quantity: 40 },
        { unitType: "INFANTRY", quantity: 40 },
      ]);
    }
  });

  it("aggregates duplicate garrison entries for the same unit type too", () => {
    const result = validateAttackOrder(
      buildInput({
        units: [{ unitType: "INFANTRY", quantity: 90 }],
        garrisonUnits: [
          { unitType: "INFANTRY", quantity: 50 },
          { unitType: "INFANTRY", quantity: 50 },
        ],
      }),
    );

    assert.equal(result.ok, true);

    if (result.ok) {
      assert.equal(result.totalUnits, 90);
    }
  });

  it("aggregates each unit type separately in a mixed duplicate manifest", () => {
    // INFANTRY totals 120 against 100 supply, while ARCHERS alone would fit.
    assert.deepEqual(
      validateAttackOrder(
        buildInput({
          units: [
            { unitType: "INFANTRY", quantity: 70 },
            { unitType: "ARCHERS", quantity: 10 },
            { unitType: "INFANTRY", quantity: 50 },
          ],
          garrisonUnits: [
            { unitType: "INFANTRY", quantity: 100 },
            { unitType: "ARCHERS", quantity: 25 },
          ],
        }),
      ),
      { ok: false, reason: "INSUFFICIENT_UNITS" },
    );
  });

  it("clamps a non-finite, negative, or fractional garrison instead of trusting it", () => {
    for (const quantity of [Number.NaN, -5, 49.9]) {
      assert.deepEqual(
        validateAttackOrder(
          buildInput({
            units: [{ unitType: "INFANTRY", quantity: 50 }],
            garrisonUnits: [{ unitType: "INFANTRY", quantity }],
          }),
        ),
        { ok: false, reason: "INSUFFICIENT_UNITS" },
      );
    }
  });

  it("ignores unusable garrison entries instead of propagating NaN", () => {
    const result = validateAttackOrder(
      buildInput({
        units: [{ unitType: "INFANTRY", quantity: 10 }],
        garrisonUnits: [
          { unitType: "DRAGONS", quantity: 100 } as unknown as AttackArmyEntry,
          { unitType: "INFANTRY", quantity: Number.NaN },
          { unitType: "INFANTRY", quantity: 10 },
        ],
      }),
    );

    assert.equal(result.ok, true);

    if (result.ok) {
      assert.equal(result.totalUnits, 10);
    }
  });

  it("returns the same result for the same input", () => {
    const first = validateAttackOrder(buildInput());
    const second = validateAttackOrder(buildInput());

    assert.deepEqual(first, second);

    if (first.ok && second.ok) {
      assert.equal(first.arrivalAt.getTime(), second.arrivalAt.getTime());
      assert.deepEqual(first.units, second.units);
    }
  });

  it("produces travel output identical to the shared helpers for a mixed army", () => {
    const result = validateAttackOrder(
      buildInput({
        units: [
          { unitType: "CAVALRY", quantity: 10 },
          { unitType: "SIEGE", quantity: 3 },
        ],
        garrisonUnits: [
          { unitType: "CAVALRY", quantity: 10 },
          { unitType: "SIEGE", quantity: 3 },
        ],
      }),
    );

    assert.equal(result.ok, true);

    if (!result.ok) {
      return;
    }

    const distanceM = calculateMovementDistanceMeters(riyadh, london);
    const expected = calculateTravelTime({ distanceM, unitTypes: ["CAVALRY", "SIEGE"] });

    assert.equal(result.distanceM, expected.distanceM);
    assert.equal(result.travelTicks, expected.travelTicks);
    assert.equal(result.slowestUnitType, expected.slowestUnitType);
    assert.equal(
      result.arrivalAt.getTime(),
      getMovementArrivalAt(departureAt, expected.travelTicks).getTime(),
    );
  });
});
