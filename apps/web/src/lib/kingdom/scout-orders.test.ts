import assert from "node:assert/strict";
import test from "node:test";
import { calculateTravelTime, SCOUT_ORDER_UNIT_TYPE } from "@mamalik/game";
import {
  createScoutOrderForUser,
  getCreateScoutOrderResultMessage,
  type CreateScoutOrderDependencies,
} from "./scout-orders";

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
  /** Forces the conditional `updateMany` reservation to report a lost race. */
  reservationCount: number | null;
  sourceKingdom: FakeKingdom | null;
  targetKingdoms: FakeKingdom[];
  scoutStacks: FakeUnitStack[];
  movementOrders: FakeMovementOrder[];
};

const now = new Date("2026-10-01T12:00:00.000Z");
const expiredProtection = new Date("2026-09-01T00:00:00.000Z");
const activeProtection = new Date("2026-10-05T00:00:00.000Z");

/** Riyadh. A close, unprotected target. */
const RIYADH = { lat: 24.7136, lng: 46.6753 };
/** Jeddah, roughly 850 km away. */
const JEDDAH = { lat: 21.4858, lng: 39.1925 };

test("unauthenticated users cannot create scout orders and open no transaction", async () => {
  const state = createFakeState();
  const result = await createScoutOrderForUser(
    null,
    { targetKingdomId: "kingdom-2", scoutCount: 1 },
    createFakeDependencies(state),
  );

  assert.deepEqual(result, {
    ok: false,
    reason: "UNAUTHENTICATED",
    message: "You must be signed in to send scouts.",
  });
  assert.equal(state.transactionCount, 0);
  assert.equal(state.movementOrders.length, 0);
});

test("a blank target id is rejected before opening a transaction", async () => {
  const state = createFakeState();
  const result = await createScoutOrderForUser(
    { id: "user-1" },
    { targetKingdomId: "   ", scoutCount: 1 },
    createFakeDependencies(state),
  );

  assert.equal(result.ok, false);
  assert.equal(result.ok === false && result.reason, "INVALID_TARGET");
  assert.equal(state.transactionCount, 0);
});

test("users without a kingdom cannot create scout orders", async () => {
  const state = createFakeState({ sourceKingdom: null });
  const result = await createScoutOrderForUser(
    { id: "user-1" },
    { targetKingdomId: "kingdom-2", scoutCount: 1 },
    createFakeDependencies(state),
  );

  assert.deepEqual(result, {
    ok: false,
    reason: "NO_KINGDOM",
    message: "Create a kingdom before sending scouts.",
  });
  assert.equal(state.movementOrders.length, 0);
});

test("unknown targets are rejected through the shared validator", async () => {
  const state = createFakeState();
  const result = await createScoutOrderForUser(
    { id: "user-1" },
    { targetKingdomId: "kingdom-missing", scoutCount: 1 },
    createFakeDependencies(state),
  );

  assert.deepEqual(result, {
    ok: false,
    reason: "TARGET_NOT_FOUND",
    message: "That kingdom no longer exists.",
  });
  assert.equal(state.scoutStacks[0].quantity, 5);
  assert.equal(state.movementOrders.length, 0);
});

test("a kingdom cannot scout itself", async () => {
  const state = createFakeState();
  const result = await createScoutOrderForUser(
    { id: "user-1" },
    { targetKingdomId: "kingdom-1", scoutCount: 1 },
    createFakeDependencies(state),
  );

  assert.deepEqual(result, {
    ok: false,
    reason: "SELF_TARGET",
    message: "You cannot scout your own kingdom.",
  });
  assert.equal(state.scoutStacks[0].quantity, 5);
  assert.equal(state.movementOrders.length, 0);
});

test("insufficient garrison scouts are rejected without writing anything", async () => {
  const state = createFakeState({ scoutStacks: [createScoutStack("kingdom-1", 2)] });
  const result = await createScoutOrderForUser(
    { id: "user-1" },
    { targetKingdomId: "kingdom-2", scoutCount: 3 },
    createFakeDependencies(state),
  );

  assert.deepEqual(result, {
    ok: false,
    reason: "NOT_ENOUGH_SCOUTS",
    message: "You do not have enough scouts in your garrison.",
  });
  // No unit-stack mutation and no movement-order row may exist on failure.
  assert.equal(state.scoutStacks[0].quantity, 2);
  assert.equal(state.movementOrders.length, 0);
});

test("a kingdom with no SCOUTS stack at all cannot scout", async () => {
  const state = createFakeState({ scoutStacks: [] });
  const result = await createScoutOrderForUser(
    { id: "user-1" },
    { targetKingdomId: "kingdom-2", scoutCount: 1 },
    createFakeDependencies(state),
  );

  assert.equal(result.ok, false);
  assert.equal(result.ok === false && result.reason, "NOT_ENOUGH_SCOUTS");
  assert.equal(state.movementOrders.length, 0);
});

test("a non-positive scout count is rejected as invalid", async () => {
  const state = createFakeState();
  const result = await createScoutOrderForUser(
    { id: "user-1" },
    { targetKingdomId: "kingdom-2", scoutCount: 0 },
    createFakeDependencies(state),
  );

  assert.equal(result.ok, false);
  assert.equal(result.ok === false && result.reason, "INVALID_SCOUT_COUNT");
  assert.equal(state.scoutStacks[0].quantity, 5);
  assert.equal(state.movementOrders.length, 0);
});

test("the happy path reserves exactly the requested scouts and writes a SCOUT order", async () => {
  const state = createFakeState();
  const result = await createScoutOrderForUser(
    { id: "user-1" },
    { targetKingdomId: "kingdom-2", scoutCount: 2 },
    createFakeDependencies(state),
  );

  assert.equal(result.ok, true);

  if (!result.ok) {
    throw new Error("expected a successful scout order");
  }

  assert.equal(result.movementOrderId, "movement-order-1");
  assert.equal(result.targetKingdomId, "kingdom-2");
  assert.equal(result.targetKingdomName, "Al Madinah");
  assert.equal(result.scoutCount, 2);
  assert.equal(result.departureAt, now.toISOString());

  // The garrison is decremented by exactly the requested count.
  assert.equal(state.scoutStacks[0].quantity, 3);

  const expectedTravel = calculateTravelTime({
    distanceM: result.distanceM,
    unitTypes: [SCOUT_ORDER_UNIT_TYPE],
  });

  assert.equal(result.travelTicks, expectedTravel.travelTicks);
  assert.equal(
    result.arrivalAt,
    new Date(now.getTime() + expectedTravel.travelTicks * 10 * 60 * 1000).toISOString(),
  );

  assert.equal(state.movementOrders.length, 1);

  const order = state.movementOrders[0];

  assert.equal(order.sourceKingdomId, "kingdom-1");
  assert.equal(order.targetKingdomId, "kingdom-2");
  assert.equal(order.orderType, "SCOUT");
  assert.equal(order.status, "IN_TRANSIT");
  assert.deepEqual(order.unitsJson, [{ unitType: "SCOUTS", quantity: 2 }]);
  assert.equal(order.distanceM, result.distanceM);
  assert.equal(order.travelTicks, expectedTravel.travelTicks);
  assert.equal(order.departureAt.getTime(), now.getTime());
  assert.equal(order.arrivalAt.toISOString(), result.arrivalAt);
});

test("the distance between source and target is the great-circle distance", async () => {
  const state = createFakeState();
  const result = await createScoutOrderForUser(
    { id: "user-1" },
    { targetKingdomId: "kingdom-2", scoutCount: 1 },
    createFakeDependencies(state),
  );

  assert.equal(result.ok, true);

  if (!result.ok) {
    throw new Error("expected a successful scout order");
  }

  // Riyadh -> Jeddah is roughly 850 km; assert a wide, non-brittle band.
  assert.ok(
    result.distanceM > 800_000 && result.distanceM < 900_000,
    `unexpected distance ${result.distanceM}`,
  );
});

test("the lost-race reservation reports NOT_ENOUGH_SCOUTS and creates nothing", async () => {
  const state = createFakeState({ reservationCount: 0 });
  const result = await createScoutOrderForUser(
    { id: "user-1" },
    { targetKingdomId: "kingdom-2", scoutCount: 1 },
    createFakeDependencies(state),
  );

  assert.deepEqual(result, {
    ok: false,
    reason: "NOT_ENOUGH_SCOUTS",
    message: "You do not have enough scouts in your garrison.",
  });
  // The conditional decrement matched nothing, so the transaction rolled back
  // and no order row exists.
  assert.equal(state.scoutStacks[0].quantity, 5);
  assert.equal(state.movementOrders.length, 0);
});

test("unknown database errors map to UNKNOWN_ERROR", async () => {
  const state = createFakeState({ transactionError: new Error("connection reset") });
  const result = await createScoutOrderForUser(
    { id: "user-1" },
    { targetKingdomId: "kingdom-2", scoutCount: 1 },
    createFakeDependencies(state),
  );

  assert.deepEqual(result, {
    ok: false,
    reason: "UNKNOWN_ERROR",
    message: "Sending scouts failed. Try again later.",
  });
});

test("scout order result messages are user-facing and stable", () => {
  assert.equal(
    getCreateScoutOrderResultMessage({
      ok: true,
      movementOrderId: "movement-order-1",
      targetKingdomId: "kingdom-2",
      targetKingdomName: "Al Madinah",
      scoutCount: 1,
      distanceM: 850_000,
      travelTicks: 5,
      departureAt: now.toISOString(),
      arrivalAt: new Date(now.getTime() + 5 * 600_000).toISOString(),
    }),
    "Sent 1 scout to Al Madinah. The order arrives in 5 ticks.",
  );
  assert.equal(
    getCreateScoutOrderResultMessage({
      ok: false,
      reason: "NOT_ENOUGH_SCOUTS",
      message: "You do not have enough scouts in your garrison.",
    }),
    "You do not have enough scouts in your garrison.",
  );
});

test("beginner-protected targets cannot be scouted", async () => {
  const state = createFakeState({
    targetKingdoms: [createKingdom("kingdom-2", "user-2", "Al Madinah", JEDDAH, activeProtection)],
  });
  const result = await createScoutOrderForUser(
    { id: "user-1" },
    { targetKingdomId: "kingdom-2", scoutCount: 1 },
    createFakeDependencies(state),
  );

  assert.deepEqual(result, {
    ok: false,
    reason: "TARGET_PROTECTED",
    message: "That kingdom is under beginner protection and cannot be scouted.",
  });
  assert.equal(state.scoutStacks[0].quantity, 5);
  assert.equal(state.movementOrders.length, 0);
});

test("a protected source kingdom may still scout an unprotected target", async () => {
  const state = createFakeState({
    sourceKingdom: { ...createKingdom("kingdom-1", "user-1", "Al Riyadh", RIYADH, expiredProtection), protectionEndsAt: activeProtection },
  });
  const result = await createScoutOrderForUser(
    { id: "user-1" },
    { targetKingdomId: "kingdom-2", scoutCount: 1 },
    createFakeDependencies(state),
  );

  assert.equal(result.ok, true);
});
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

function createScoutStack(
  kingdomId: string,
  quantity: number,
  overrides: Partial<FakeUnitStack> = {},
): FakeUnitStack {
  return {
    kingdomId,
    unitType: SCOUT_ORDER_UNIT_TYPE,
    locationType: "GARRISON",
    quantity,
    ...overrides,
  };
}

function createFakeState(overrides: Partial<FakeState> = {}): FakeState {
  return {
    transactionCount: 0,
    transactionError: null,
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
    scoutStacks: [createScoutStack("kingdom-1", 5)],
    movementOrders: [],
    ...overrides,
  };
}

function createFakeDependencies(state: FakeState): CreateScoutOrderDependencies {
  return {
    now: () => now,
    db: {
      async $transaction(callback) {
        state.transactionCount += 1;

        if (state.transactionError) {
          throw state.transactionError;
        }

        return callback(createFakeTransaction(state));
      },
    },
  };
}

/**
 * The shape the kingdom selects return. The fake always returns the full record
 * so one `findUnique` implementation can serve both the source lookup
 * (`where.userId`) and the target lookup (`where.id`), matching the fact that
 * both Prisma selects request the same kingdom columns.
 */
type FakeKingdomRecord = {
  id: string;
  name: string;
  centerLat: number;
  centerLng: number;
  protectionEndsAt: Date | null;
  unitStacks: Array<{ quantity: number }>;
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
        // Simulate a lost reservation race: the conditional decrement matched no
        // rows because a concurrent order already spent the same scouts.
        if (state.reservationCount !== null) {
          return { count: state.reservationCount };
        }

        const kingdomId = getNested<string>(args, ["where", "kingdomId"]);
        const unitType = getNested<string>(args, ["where", "unitType"]);
        const locationType = getNested<string>(args, ["where", "locationType"]);
        const minimumQuantity = getNested<number>(args, ["where", "quantity", "gte"]);
        const decrement = getNested<number>(args, ["data", "quantity", "decrement"]);

        const stack = state.scoutStacks.find(
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
): Array<{ quantity: number }> {
  return state.scoutStacks
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
    .map((stack) => ({ quantity: stack.quantity }));
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
