import assert from "node:assert/strict";
import test from "node:test";
import { calculateTravelTime, type AttackArmyEntry } from "@mamalik/game";
import {
  createAttackOrderForUser,
  getCreateAttackOrderResultMessage,
  type CreateAttackOrderDependencies,
} from "./attack-orders";

type FakeKingdom = {
  id: string;
  userId: string;
  name: string;
  centerLat: number;
  centerLng: number;
  protectionEndsAt: Date;
};

type FakeUnitStack = {
  kingdomId: string;
  unitType: string;
  locationType: string;
  quantity: number;
};

type FakeMovementOrder = {
  id: string;
  sourceKingdomId: string;
  targetKingdomId: string;
  orderType: string;
  status: string;
  unitsJson: unknown;
  distanceM: number;
  travelTicks: number;
  departureAt: Date;
  arrivalAt: Date;
};

type FakeState = {
  transactionCount: number;
  /** Set to force `$transaction` itself to throw, proving UNKNOWN_ERROR mapping. */
  transactionError: Error | null;
  /**
   * Forces the conditional reservation to report a lost race for exactly one
   * unit type, which is how the all-or-nothing rollback is exercised.
   */
  failingUnitType: string | null;
  /** Every `updateMany` reports this count regardless of unit type. */
  reservationCount: number | null;
  sourceKingdom: FakeKingdom | null;
  targetKingdoms: FakeKingdom[];
  unitStacks: FakeUnitStack[];
  movementOrders: FakeMovementOrder[];
};

const now = new Date("2026-10-01T12:00:00.000Z");
const expiredProtection = new Date("2026-09-01T00:00:00.000Z");
const activeProtection = new Date("2026-10-05T00:00:00.000Z");

/** Riyadh. The caller's own centre. */
const RIYADH = { lat: 24.7136, lng: 46.6753 };
/** Jeddah, roughly 850 km away. */
const JEDDAH = { lat: 21.4858, lng: 39.1925 };

/** The caller's default mixed garrison: 50 INFANTRY and 10 ARCHERS. */
const DEFAULT_GARRISON: FakeUnitStack[] = [
  createStack("kingdom-1", "INFANTRY", 50),
  createStack("kingdom-1", "ARCHERS", 10),
];

test("unauthenticated users cannot create attack orders and open no transaction", async () => {
  const state = createFakeState();
  const result = await createAttackOrderForUser(
    null,
    { targetKingdomId: "kingdom-2", units: [{ unitType: "INFANTRY", quantity: 1 }] },
    createFakeDependencies(state),
  );

  assert.deepEqual(result, {
    ok: false,
    reason: "UNAUTHENTICATED",
    message: "You must be signed in to launch an attack.",
  });
  assert.equal(state.transactionCount, 0);
  assert.equal(state.movementOrders.length, 0);
});

test("a blank target id is rejected before opening a transaction", async () => {
  const state = createFakeState();
  const result = await createAttackOrderForUser(
    { id: "user-1" },
    { targetKingdomId: "   ", units: [{ unitType: "INFANTRY", quantity: 1 }] },
    createFakeDependencies(state),
  );

  assert.equal(result.ok, false);
  assert.equal(result.ok === false && result.reason, "INVALID_TARGET");
  assert.equal(state.transactionCount, 0);
});

test("users without a kingdom cannot create attack orders", async () => {
  const state = createFakeState({ sourceKingdom: null });
  const result = await createAttackOrderForUser(
    { id: "user-1" },
    { targetKingdomId: "kingdom-2", units: [{ unitType: "INFANTRY", quantity: 1 }] },
    createFakeDependencies(state),
  );

  assert.deepEqual(result, {
    ok: false,
    reason: "NO_KINGDOM",
    message: "Create a kingdom before launching an attack.",
  });
  assert.equal(state.movementOrders.length, 0);
});

test("unknown targets are rejected through the shared validator", async () => {
  const state = createFakeState();
  const result = await createAttackOrderForUser(
    { id: "user-1" },
    { targetKingdomId: "kingdom-missing", units: [{ unitType: "INFANTRY", quantity: 1 }] },
    createFakeDependencies(state),
  );

  assert.deepEqual(result, {
    ok: false,
    reason: "TARGET_NOT_FOUND",
    message: "That kingdom no longer exists.",
  });
  assertGarrisonUntouched(state, DEFAULT_GARRISON);
  assert.equal(state.movementOrders.length, 0);
});

test("a kingdom cannot attack itself", async () => {
  const state = createFakeState();
  const result = await createAttackOrderForUser(
    { id: "user-1" },
    { targetKingdomId: "kingdom-1", units: [{ unitType: "INFANTRY", quantity: 1 }] },
    createFakeDependencies(state),
  );

  assert.deepEqual(result, {
    ok: false,
    reason: "SELF_TARGET",
    message: "You cannot attack your own kingdom.",
  });
  assertGarrisonUntouched(state, DEFAULT_GARRISON);
  assert.equal(state.movementOrders.length, 0);
});

test("an empty manifest is rejected as an invalid army", async () => {
  const state = createFakeState();
  const result = await createAttackOrderForUser(
    { id: "user-1" },
    { targetKingdomId: "kingdom-2", units: [] },
    createFakeDependencies(state),
  );

  assert.deepEqual(result, {
    ok: false,
    reason: "INVALID_ARMY",
    message: "Send at least one whole unit in your army.",
  });
  assertGarrisonUntouched(state, DEFAULT_GARRISON);
  assert.equal(state.movementOrders.length, 0);
});

test("an unknown unit type is rejected outright", async () => {
  const state = createFakeState();
  const result = await createAttackOrderForUser(
    { id: "user-1" },
    {
      targetKingdomId: "kingdom-2",
      units: [{ unitType: "DRAGONS" as AttackArmyEntry["unitType"], quantity: 1 }],
    },
    createFakeDependencies(state),
  );

  assert.deepEqual(result, {
    ok: false,
    reason: "INVALID_UNIT_TYPE",
    message: "That army contains an unknown unit type.",
  });
  assertGarrisonUntouched(state, DEFAULT_GARRISON);
  assert.equal(state.movementOrders.length, 0);
});
test("a fractional quantity is rejected as an invalid army", async () => {
  const state = createFakeState();
  const result = await createAttackOrderForUser(
    { id: "user-1" },
    { targetKingdomId: "kingdom-2", units: [{ unitType: "INFANTRY", quantity: 1.5 }] },
    createFakeDependencies(state),
  );

  assert.equal(result.ok === false && result.reason, "INVALID_ARMY");
  assertGarrisonUntouched(state, DEFAULT_GARRISON);
  assert.equal(state.movementOrders.length, 0);
});

test("insufficient supply is rejected without writing anything", async () => {
  const state = createFakeState();
  const result = await createAttackOrderForUser(
    { id: "user-1" },
    { targetKingdomId: "kingdom-2", units: [{ unitType: "INFANTRY", quantity: 51 }] },
    createFakeDependencies(state),
  );

  assert.deepEqual(result, {
    ok: false,
    reason: "INSUFFICIENT_UNITS",
    message: "You do not have enough units in your garrison for that army.",
  });
  // No unit-stack mutation and no movement-order row may exist on failure.
  assertGarrisonUntouched(state, DEFAULT_GARRISON);
  assert.equal(state.movementOrders.length, 0);
});

test("a kingdom with no garrison stacks at all cannot attack", async () => {
  const state = createFakeState({ unitStacks: [] });
  const result = await createAttackOrderForUser(
    { id: "user-1" },
    { targetKingdomId: "kingdom-2", units: [{ unitType: "INFANTRY", quantity: 1 }] },
    createFakeDependencies(state),
  );

  assert.equal(result.ok === false && result.reason, "INSUFFICIENT_UNITS");
  assert.equal(state.movementOrders.length, 0);
});

test("a unit type the kingdom does not hold at all is rejected", async () => {
  const state = createFakeState();
  const result = await createAttackOrderForUser(
    { id: "user-1" },
    { targetKingdomId: "kingdom-2", units: [{ unitType: "SIEGE", quantity: 1 }] },
    createFakeDependencies(state),
  );

  assert.equal(result.ok === false && result.reason, "INSUFFICIENT_UNITS");
  assertGarrisonUntouched(state, DEFAULT_GARRISON);
  assert.equal(state.movementOrders.length, 0);
});

test("duplicate entries for one unit type are aggregated against the garrison", async () => {
  const state = createFakeState();
  // 60 + 60 against a garrison of 50 must fail, not pass as two independent
  // halves that each "fit" on their own.
  const result = await createAttackOrderForUser(
    { id: "user-1" },
    {
      targetKingdomId: "kingdom-2",
      units: [
        { unitType: "INFANTRY", quantity: 60 },
        { unitType: "INFANTRY", quantity: 60 },
      ],
    },
    createFakeDependencies(state),
  );

  assert.equal(result.ok === false && result.reason, "INSUFFICIENT_UNITS");
  assertGarrisonUntouched(state, DEFAULT_GARRISON);
  assert.equal(state.movementOrders.length, 0);
});

test("beginner-protected targets cannot be attacked", async () => {
  const state = createFakeState({
    targetKingdoms: [createKingdom("kingdom-2", "user-2", "Al Madinah", JEDDAH, activeProtection)],
  });
  const result = await createAttackOrderForUser(
    { id: "user-1" },
    { targetKingdomId: "kingdom-2", units: [{ unitType: "INFANTRY", quantity: 1 }] },
    createFakeDependencies(state),
  );

  assert.deepEqual(result, {
    ok: false,
    reason: "TARGET_PROTECTED",
    message: "That kingdom is under beginner protection and cannot be attacked.",
  });
  assertGarrisonUntouched(state, DEFAULT_GARRISON);
  assert.equal(state.movementOrders.length, 0);
});

test("protection that expires exactly at departure is already over", async () => {
  const state = createFakeState({
    targetKingdoms: [createKingdom("kingdom-2", "user-2", "Al Madinah", JEDDAH, now)],
  });
  const result = await createAttackOrderForUser(
    { id: "user-1" },
    { targetKingdomId: "kingdom-2", units: [{ unitType: "INFANTRY", quantity: 1 }] },
    createFakeDependencies(state),
  );

  assert.equal(result.ok, true);
});

test("a protected source kingdom may still attack an unprotected target", async () => {
  const state = createFakeState({
    sourceKingdom: createKingdom("kingdom-1", "user-1", "Al Riyadh", RIYADH, activeProtection),
  });
  const result = await createAttackOrderForUser(
    { id: "user-1" },
    { targetKingdomId: "kingdom-2", units: [{ unitType: "INFANTRY", quantity: 1 }] },
    createFakeDependencies(state),
  );

  assert.equal(result.ok, true);
});
test("the happy path reserves every unit type exactly and writes an ATTACK order", async () => {
  const state = createFakeState();
  const result = await createAttackOrderForUser(
    { id: "user-1" },
    {
      targetKingdomId: "kingdom-2",
      units: [
        { unitType: "INFANTRY", quantity: 30 },
        { unitType: "ARCHERS", quantity: 4 },
      ],
    },
    createFakeDependencies(state),
  );

  assert.equal(result.ok, true);

  if (!result.ok) {
    throw new Error("expected a successful attack order");
  }

  assert.equal(result.movementOrderId, "movement-order-1");
  assert.equal(result.targetKingdomId, "kingdom-2");
  assert.equal(result.targetKingdomName, "Al Madinah");
  assert.equal(result.totalUnits, 34);
  assert.equal(result.departureAt, now.toISOString());

  // BOTH stacks are decremented by exactly the requested quantity.
  assert.equal(findStack(state, "INFANTRY").quantity, 20);
  assert.equal(findStack(state, "ARCHERS").quantity, 6);

  const expectedTravel = calculateTravelTime({
    distanceM: result.distanceM,
    unitTypes: ["INFANTRY", "ARCHERS"],
  });

  assert.equal(result.slowestUnitType, expectedTravel.slowestUnitType);
  assert.equal(result.travelTicks, expectedTravel.travelTicks);
  assert.equal(
    result.arrivalAt,
    new Date(now.getTime() + expectedTravel.travelTicks * 10 * 60 * 1000).toISOString(),
  );

  assert.equal(state.movementOrders.length, 1);

  const order = state.movementOrders[0];

  assert.equal(order.sourceKingdomId, "kingdom-1");
  assert.equal(order.targetKingdomId, "kingdom-2");
  assert.equal(order.orderType, "ATTACK");
  assert.equal(order.status, "IN_TRANSIT");
  // `unitsJson` is the normalized manifest, in request order.
  assert.deepEqual(order.unitsJson, [
    { unitType: "INFANTRY", quantity: 30 },
    { unitType: "ARCHERS", quantity: 4 },
  ]);
  assert.equal(order.distanceM, result.distanceM);
  assert.equal(order.travelTicks, expectedTravel.travelTicks);
  assert.equal(order.departureAt.getTime(), now.getTime());
  assert.equal(order.arrivalAt.toISOString(), result.arrivalAt);
});

test("unitsJson stores the normalized manifest the validator returned", async () => {
  const state = createFakeState();
  const result = await createAttackOrderForUser(
    { id: "user-1" },
    {
      targetKingdomId: "kingdom-2",
      // A client that reorders the manifest must get the normalized result back,
      // not its own array shape persisted verbatim.
      units: [
        { unitType: "ARCHERS", quantity: 2 },
        { unitType: "INFANTRY", quantity: 5 },
      ],
    },
    createFakeDependencies(state),
  );

  assert.equal(result.ok, true);
  assert.deepEqual(state.movementOrders[0].unitsJson, [
    { unitType: "ARCHERS", quantity: 2 },
    { unitType: "INFANTRY", quantity: 5 },
  ]);

  // The stored manifest matches what the result reported, not the raw array.
  assert.deepEqual(state.movementOrders[0].unitsJson, result.ok ? result.units : null);
});

test("a SIEGE unit type sets the army's pace through the shared travel formula", async () => {
  const state = createFakeState({
    unitStacks: [
      createStack("kingdom-1", "INFANTRY", 50),
      createStack("kingdom-1", "SIEGE", 10),
      createStack("kingdom-1", "SCOUTS", 10),
    ],
  });
  const result = await createAttackOrderForUser(
    { id: "user-1" },
    { targetKingdomId: "kingdom-2", units: [{ unitType: "SIEGE", quantity: 2 }] },
    createFakeDependencies(state),
  );

  assert.equal(result.ok, true);

  if (!result.ok) {
    throw new Error("expected a successful attack order");
  }

  // The pace rule belongs to the shared travel formula, not a second copy here.
  const expected = calculateTravelTime({ distanceM: result.distanceM, unitTypes: ["SIEGE"] });

  assert.equal(result.slowestUnitType, "SIEGE");
  assert.equal(result.travelTicks, expected.travelTicks);
  assert.equal(findStack(state, "SIEGE").quantity, 8);
});
test("the all-or-nothing rollback undoes an earlier unit type when a later one fails", async () => {
  const state = createFakeState({
    unitStacks: [
      createStack("kingdom-1", "INFANTRY", 50),
      createStack("kingdom-1", "ARCHERS", 10),
    ],
    // The SECOND unit type in the manifest loses its conditional race, after the
    // first has already been decremented inside this same transaction.
    failingUnitType: "ARCHERS",
  });
  const result = await createAttackOrderForUser(
    { id: "user-1" },
    {
      targetKingdomId: "kingdom-2",
      units: [
        { unitType: "INFANTRY", quantity: 30 },
        { unitType: "ARCHERS", quantity: 4 },
      ],
    },
    createFakeDependencies(state),
  );

  assert.deepEqual(result, {
    ok: false,
    reason: "INSUFFICIENT_UNITS",
    message: "You do not have enough units in your garrison for that army.",
  });

  // The whole point of the test: the earlier INFANTRY decrement is rolled back
  // too. The attacker must not have lost 30 infantry and gained no order.
  assert.equal(findStack(state, "INFANTRY").quantity, 50);
  assert.equal(findStack(state, "ARCHERS").quantity, 10);
  // And no partial order row survives the rollback.
  assert.equal(state.movementOrders.length, 0);
});

test("a lost race on the FIRST unit type also writes nothing", async () => {
  const state = createFakeState({ failingUnitType: "INFANTRY" });
  const result = await createAttackOrderForUser(
    { id: "user-1" },
    {
      targetKingdomId: "kingdom-2",
      units: [
        { unitType: "INFANTRY", quantity: 30 },
        { unitType: "ARCHERS", quantity: 4 },
      ],
    },
    createFakeDependencies(state),
  );

  assert.equal(result.ok === false && result.reason, "INSUFFICIENT_UNITS");
  assertGarrisonUntouched(state, DEFAULT_GARRISON);
  assert.equal(state.movementOrders.length, 0);
});

test("duplicate entries for one unit type reserve a single aggregated quantity", async () => {
  const state = createFakeState({ unitStacks: [createStack("kingdom-1", "INFANTRY", 100)] });
  const result = await createAttackOrderForUser(
    { id: "user-1" },
    {
      targetKingdomId: "kingdom-2",
      units: [
        { unitType: "INFANTRY", quantity: 40 },
        { unitType: "INFANTRY", quantity: 40 },
      ],
    },
    createFakeDependencies(state),
  );

  assert.equal(result.ok, true);

  if (!result.ok) {
    throw new Error("expected a successful attack order");
  }

  assert.equal(result.totalUnits, 80);
  // The validator preserves both entries in `unitsJson`...
  assert.deepEqual(state.movementOrders[0].unitsJson, [
    { unitType: "INFANTRY", quantity: 40 },
    { unitType: "INFANTRY", quantity: 40 },
  ]);
  // ...but the reservation is a single aggregated decrement of 80, not 40 + 40.
  assert.equal(findStack(state, "INFANTRY").quantity, 20);
});

test("the distance between source and target is the great-circle distance", async () => {
  const state = createFakeState();
  const result = await createAttackOrderForUser(
    { id: "user-1" },
    { targetKingdomId: "kingdom-2", units: [{ unitType: "INFANTRY", quantity: 1 }] },
    createFakeDependencies(state),
  );

  assert.equal(result.ok, true);

  if (!result.ok) {
    throw new Error("expected a successful attack order");
  }

  // Riyadh -> Jeddah is roughly 850 km; assert a wide, non-brittle band.
  assert.ok(
    result.distanceM > 800_000 && result.distanceM < 900_000,
    `unexpected distance ${result.distanceM}`,
  );
});

test("unknown database errors map to UNKNOWN_ERROR", async () => {
  const state = createFakeState({ transactionError: new Error("connection reset") });
  const result = await createAttackOrderForUser(
    { id: "user-1" },
    { targetKingdomId: "kingdom-2", units: [{ unitType: "INFANTRY", quantity: 1 }] },
    createFakeDependencies(state),
  );

  assert.deepEqual(result, {
    ok: false,
    reason: "UNKNOWN_ERROR",
    message: "Launching the attack failed. Try again later.",
  });
});

test("attack order result messages are user-facing and stable", () => {
  assert.equal(
    getCreateAttackOrderResultMessage({
      ok: true,
      movementOrderId: "movement-order-1",
      targetKingdomId: "kingdom-2",
      targetKingdomName: "Al Madinah",
      units: [{ unitType: "INFANTRY", quantity: 34 }],
      totalUnits: 34,
      slowestUnitType: "INFANTRY",
      distanceM: 850_000,
      travelTicks: 5,
      departureAt: now.toISOString(),
      arrivalAt: new Date(now.getTime() + 5 * 600_000).toISOString(),
    }),
    "Sent 34 units to Al Madinah. The attack arrives in 5 ticks.",
  );
  assert.equal(
    getCreateAttackOrderResultMessage({
      ok: false,
      reason: "INSUFFICIENT_UNITS",
      message: "You do not have enough units in your garrison for that army.",
    }),
    "You do not have enough units in your garrison for that army.",
  );
});
/** Assert no garrison row was touched at all, by comparing against a snapshot. */
function assertGarrisonUntouched(state: FakeState, snapshot: readonly FakeUnitStack[]): void {
  assert.deepEqual(
    state.unitStacks.map((stack) => ({ ...stack })),
    snapshot.map((stack) => ({ ...stack })),
  );
}

function findStack(state: FakeState, unitType: string): FakeUnitStack {
  const stack = state.unitStacks.find(
    (current) => current.kingdomId === "kingdom-1" && current.unitType === unitType,
  );

  if (!stack) {
    throw new Error(`no fixture stack for ${unitType}`);
  }

  return stack;
}

function createKingdom(
  id: string,
  userId: string,
  name: string,
  center: { lat: number; lng: number },
  protectionEndsAt: Date,
): FakeKingdom {
  return {
    id,
    userId,
    name,
    centerLat: center.lat,
    centerLng: center.lng,
    protectionEndsAt,
  };
}

function createStack(
  kingdomId: string,
  unitType: string,
  quantity: number,
  overrides: Partial<FakeUnitStack> = {},
): FakeUnitStack {
  return {
    kingdomId,
    unitType,
    locationType: "GARRISON",
    quantity,
    ...overrides,
  };
}

function createFakeState(overrides: Partial<FakeState> = {}): FakeState {
  return {
    transactionCount: 0,
    transactionError: null,
    failingUnitType: null,
    reservationCount: null,
    sourceKingdom: createKingdom(
      "kingdom-1",
      "user-1",
      "Al Riyadh",
      RIYADH,
      expiredProtection,
    ),
    targetKingdoms: [
      createKingdom("kingdom-2", "user-2", "Al Madinah", JEDDAH, expiredProtection),
    ],
    unitStacks: DEFAULT_GARRISON.map((stack) => ({ ...stack })),
    movementOrders: [],
    ...overrides,
  };
}

function createFakeDependencies(state: FakeState): CreateAttackOrderDependencies {
  return {
    now: () => now,
    db: {
      async $transaction(callback) {
        state.transactionCount += 1;

        if (state.transactionError) {
          throw state.transactionError;
        }

        // Snapshot the writable state so the fake can model a REAL rollback. A
        // real database discards every write in the transaction when it is
        // aborted, and the all-or-nothing test depends on that behaviour.
        const stackSnapshot = state.unitStacks.map((stack) => ({ ...stack }));
        const orderCount = state.movementOrders.length;

        try {
          return await callback(createFakeTransaction(state));
        } catch (error) {
          for (let index = 0; index < state.unitStacks.length; index += 1) {
            const restored = stackSnapshot[index];

            if (restored) {
              state.unitStacks[index] = { ...restored };
            }
          }

          state.movementOrders.length = orderCount;

          throw error;
        }
      },
    },
  };
}
/**
 * The shape the kingdom selects return. The fake always returns the full record so
 * one `findUnique` implementation can serve both the source lookup
 * (`where.userId`) and the target lookup (`where.id`), matching the fact that both
 * Prisma selects request the same kingdom columns.
 */
type FakeKingdomRecord = {
  id: string;
  name: string;
  centerLat: number;
  centerLng: number;
  // The target lookup selects this, and the shared validator treats a missing or
  // invalid protection deadline as TARGET_NOT_FOUND, so the fake MUST return it.
  protectionEndsAt: Date | null;
  unitStacks: Array<{ unitType: string; quantity: number }>;
};

function createFakeTransaction(state: FakeState) {
  return {
    kingdom: {
      async findUnique(args: unknown): Promise<FakeKingdomRecord | null> {
        const where = getNested<Record<string, unknown>>(args, ["where"]);
        const stackWhere = getNested<Record<string, unknown>>(
          args,
          ["select", "unitStacks", "where"],
          {},
        );

        const kingdom = findFakeKingdom(state, where);

        if (!kingdom) {
          return null;
        }

        return {
          id: kingdom.id,
          name: kingdom.name,
          centerLat: kingdom.centerLat,
          centerLng: kingdom.centerLng,
          protectionEndsAt: kingdom.protectionEndsAt,
          unitStacks: resolveGarrisonStacks(state, kingdom.id, stackWhere),
        };
      },
    },
    unitStack: {
      async updateMany(args: unknown): Promise<{ count: number }> {
        const kingdomId = getNested<string>(args, ["where", "kingdomId"]);
        const unitType = getNested<string>(args, ["where", "unitType"]);
        const locationType = getNested<string>(args, ["where", "locationType"]);
        const minimumQuantity = getNested<number>(args, ["where", "quantity", "gte"]);
        const decrement = getNested<number>(args, ["data", "quantity", "decrement"]);

        // Simulate a lost reservation race for one specific unit type: a
        // concurrent order already spent those units, so the guarded update
        // matched zero rows.
        if (state.failingUnitType === unitType) {
          return { count: 0 };
        }

        if (state.reservationCount !== null) {
          return { count: state.reservationCount };
        }

        const stack = state.unitStacks.find(
          (current) =>
            current.kingdomId === kingdomId &&
            current.unitType === unitType &&
            current.locationType === locationType,
        );

        if (!stack || stack.quantity < minimumQuantity) {
          return { count: 0 };
        }

        stack.quantity -= decrement;

        return { count: 1 };
      },
    },
    movementOrder: {
      async create(args: unknown): Promise<{ id: string }> {
        const order: FakeMovementOrder = {
          id: `movement-order-${state.movementOrders.length + 1}`,
          sourceKingdomId: getNested<string>(args, ["data", "sourceKingdomId"]),
          targetKingdomId: getNested<string>(args, ["data", "targetKingdomId"]),
          orderType: getNested<string>(args, ["data", "orderType"]),
          status: getNested<string>(args, ["data", "status"]),
          unitsJson: getNested<unknown>(args, ["data", "unitsJson"]),
          distanceM: getNested<number>(args, ["data", "distanceM"]),
          travelTicks: getNested<number>(args, ["data", "travelTicks"]),
          departureAt: getNested<Date>(args, ["data", "departureAt"]),
          arrivalAt: getNested<Date>(args, ["data", "arrivalAt"]),
        };

        state.movementOrders.push(order);

        return { id: order.id };
      },
    },
  };
}

function findFakeKingdom(
  state: FakeState,
  where: Record<string, unknown>,
): FakeKingdom | null {
  const candidates = [state.sourceKingdom, ...state.targetKingdoms];

  if (typeof where.userId === "string") {
    return candidates.find((kingdom) => kingdom?.userId === where.userId) ?? null;
  }

  if (typeof where.id === "string") {
    return candidates.find((kingdom) => kingdom?.id === where.id) ?? null;
  }

  return null;
}

function resolveGarrisonStacks(
  state: FakeState,
  kingdomId: string,
  stackWhere: Record<string, unknown>,
): Array<{ unitType: string; quantity: number }> {
  return state.unitStacks
    .filter((stack) => stack.kingdomId === kingdomId)
    .filter(
      (stack) =>
        typeof stackWhere.unitType !== "string" || stack.unitType === stackWhere.unitType,
    )
    .filter(
      (stack) =>
        typeof stackWhere.locationType !== "string" ||
        stack.locationType === stackWhere.locationType,
    )
    .map((stack) => ({ unitType: stack.unitType, quantity: stack.quantity }));
}

function getNested<T>(value: unknown, path: string[], fallback?: T): T {
  let current: unknown = value;

  for (const segment of path) {
    if (!isRecord(current) || !(segment in current)) {
      if (fallback !== undefined) {
        return fallback;
      }

      throw new Error(`Missing fake path: ${path.join(".")}`);
    }

    current = current[segment];
  }

  return current as T;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}