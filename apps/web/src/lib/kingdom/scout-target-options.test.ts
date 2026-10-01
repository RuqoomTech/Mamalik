import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateMovementDistanceMeters,
  calculateTravelTime,
  getMovementArrivalAt,
  SCOUT_ORDER_MIN_SCOUTS,
  SCOUT_ORDER_UNIT_TYPE,
  validateScoutOrder,
} from "@mamalik/game";
import {
  createScoutOrderForUser,
  type CreateScoutOrderDependencies,
} from "./scout-orders";
import {
  getScoutTargetOptionsForUser,
  SCOUT_TARGET_OPTION_LIMIT,
  type ScoutTargetOption,
  type ScoutTargetOptionDependencies,
} from "./scout-target-options";

type FakeKingdom = {
  id: string;
  userId: string;
  name: string;
  centerLat: number;
  centerLng: number;
  protectionEndsAt: Date | null;
  /** Drives the read model's deterministic `orderBy: { createdAt: "asc" }`. */
  createdAt: Date;
};

type FakeUnitStack = {
  kingdomId: string;
  unitType: string;
  locationType: string;
  quantity: number;
};

type FakeState = {
  kingdoms: FakeKingdom[];
  scoutStacks: FakeUnitStack[];
  movementOrders: Array<{ id: string; targetKingdomId: string }>;
  transactionCount: number;
  /** Records the `take` the read model asked for, to pin the fetch bound. */
  findManyTake: number | null;
  /** Records the `id: { not }` exclusion the read model applied. */
  findManyExcludedId: string | null;
};

const now = new Date("2026-10-01T12:00:00.000Z");
const expiredProtection = new Date("2026-09-01T00:00:00.000Z");
const activeProtection = new Date("2026-10-05T00:00:00.000Z");

/** Riyadh. The caller's own kingdom centre. */
const RIYADH = { lat: 24.7136, lng: 46.6753 };
/** Jeddah, roughly 850 km away. */
const JEDDAH = { lat: 21.4858, lng: 39.1925 };
/** Cairo, far enough away to need several ticks. */
const CAIRO = { lat: 30.0444, lng: 31.2357 };

/** Garrison scouts every fixture kingdom starts with. */
const GARRISON_SCOUTS = 4;
test("the caller's own kingdom is never offered as a scout target", async () => {
  const state = createFakeState();
  const options = await getScoutTargetOptionsForUser(
    "user-1",
    createFakeReadModelDependencies(state),
  );

  assert.ok(options.length > 0, "expected at least one target");
  assert.equal(
    options.some((option) => option.kingdomId === "kingdom-1"),
    false,
    "the caller must never be able to scout itself",
  );
  // The exclusion is pushed down into the query, not filtered in memory only.
  assert.equal(state.findManyExcludedId, "kingdom-1");
});

test("the target list is capped at SCOUT_TARGET_OPTION_LIMIT", async () => {
  const state = createFakeState({ kingdoms: createManyKingdoms(25) });
  const options = await getScoutTargetOptionsForUser(
    "user-1",
    createFakeReadModelDependencies(state),
  );

  assert.equal(options.length, SCOUT_TARGET_OPTION_LIMIT);

  // The query fetches more than it returns, so a full page survives once the
  // caller's own kingdom is excluded and the newest kingdoms are dropped.
  assert.ok(
    typeof state.findManyTake === "number" && state.findManyTake > SCOUT_TARGET_OPTION_LIMIT,
    `expected a fetch bound above the limit, got ${state.findManyTake}`,
  );

  // The oldest kingdoms win, because the fake honours `orderBy: { createdAt }`.
  assert.equal(options[0].kingdomId, "kingdom-2");
});

test("a beginner-protected target is listed but cannot be targeted", async () => {
  const state = createFakeState();
  const options = await getScoutTargetOptionsForUser(
    "user-1",
    createFakeReadModelDependencies(state),
  );

  const protectedOption = options.find((option) => option.kingdomId === "kingdom-3");

  assert.ok(protectedOption, "expected the protected kingdom to still be listed");
  assert.equal(protectedOption.isProtected, true);
  assert.equal(protectedOption.protectionEndsAt, activeProtection.toISOString());
  assert.equal(protectedOption.canTarget, false);
  assert.equal(protectedOption.disabledReason, "TARGET_PROTECTED");
});

test("an unprotected target is targetable with no disabled reason", async () => {
  const state = createFakeState();
  const options = await getScoutTargetOptionsForUser(
    "user-1",
    createFakeReadModelDependencies(state),
  );

  const openOption = options.find((option) => option.kingdomId === "kingdom-2");

  assert.ok(openOption, "expected the unprotected kingdom to be listed");
  assert.equal(openOption.kingdomName, "Al Madinah");
  assert.equal(openOption.isProtected, false);
  assert.equal(openOption.protectionEndsAt, expiredProtection.toISOString());
  assert.equal(openOption.canTarget, true);
  assert.equal(openOption.disabledReason, null);
});
test("protection that expires exactly now is already over, so the target is open", async () => {
  // `protectionEndsAt` is a non-nullable column, so the meaningful boundary is
  // the exact expiry instant: the shared helper treats protection as active only
  // while the deadline is STRICTLY in the future.
  const state = createFakeState({
    kingdoms: [
      createKingdom("kingdom-1", "user-1", "Al Riyadh", RIYADH, expiredProtection, 1),
      createKingdom("kingdom-2", "user-2", "Al Madinah", JEDDAH, now, 2),
    ],
  });
  const options = await getScoutTargetOptionsForUser(
    "user-1",
    createFakeReadModelDependencies(state),
  );

  assert.equal(options[0].isProtected, false);
  assert.equal(options[0].protectionEndsAt, now.toISOString());
  assert.equal(options[0].canTarget, true);
  assert.equal(options[0].disabledReason, null);
});

test("distance, travel ticks, and arrival agree with the shared movement formulas", async () => {
  const state = createFakeState();
  const options = await getScoutTargetOptionsForUser(
    "user-1",
    createFakeReadModelDependencies(state),
  );

  for (const option of options) {
    const target = findKingdom(state, option.kingdomId);

    assert.ok(target, `no fixture kingdom for ${option.kingdomId}`);

    const expectedDistance = calculateMovementDistanceMeters(RIYADH, {
      lat: target.centerLat,
      lng: target.centerLng,
    });
    const expectedTravel = calculateTravelTime({
      distanceM: expectedDistance,
      unitTypes: [SCOUT_ORDER_UNIT_TYPE],
    });

    assert.equal(option.distanceM, expectedDistance);
    assert.equal(option.travelTicks, expectedTravel.travelTicks);
    assert.equal(
      option.arrivalAt,
      getMovementArrivalAt(now, expectedTravel.travelTicks).toISOString(),
    );
  }
});

test("users without a kingdom get no scout targets at all", async () => {
  const state = createFakeState();
  const options = await getScoutTargetOptionsForUser(
    "user-missing",
    createFakeReadModelDependencies(state),
  );

  assert.deepEqual(options, []);
});

test("a kingdom with no scouts in garrison is offered nothing targetable", async () => {
  const state = createFakeState({ scoutStacks: [] });
  const options = await getScoutTargetOptionsForUser(
    "user-1",
    createFakeReadModelDependencies(state),
  );

  assert.ok(options.length > 0);

  for (const option of options) {
    assert.equal(option.canTarget, false);
    assert.notEqual(option.disabledReason, null);
  }

  // The shared validator returns the EARLIEST blocking rule. Beginner
  // protection is rule 4 and scout supply is rule 6, so a protected target
  // reports TARGET_PROTECTED even when the garrison is also empty. The read
  // model must surface that same rule rather than a supply reason of its own.
  assert.equal(
    options.find((option) => option.kingdomId === "kingdom-2")?.disabledReason,
    "NOT_ENOUGH_SCOUTS",
  );
  assert.equal(
    options.find((option) => option.kingdomId === "kingdom-3")?.disabledReason,
    "TARGET_PROTECTED",
  );
});
test("the read model's canTarget never disagrees with the shared validator", async () => {
  const state = createFakeState();
  const options = await getScoutTargetOptionsForUser(
    "user-1",
    createFakeReadModelDependencies(state),
  );

  for (const option of options) {
    const target = findKingdom(state, option.kingdomId);

    assert.ok(target, `no fixture kingdom for ${option.kingdomId}`);

    const validation = validateScoutOrder({
      sourceKingdomId: "kingdom-1",
      sourceCenterLat: RIYADH.lat,
      sourceCenterLng: RIYADH.lng,
      targetKingdomId: target.id,
      targetCenterLat: target.centerLat,
      targetCenterLng: target.centerLng,
      targetProtectionEndsAt: target.protectionEndsAt,
      garrisonScouts: GARRISON_SCOUTS,
      requestedScouts: SCOUT_ORDER_MIN_SCOUTS,
      departureAt: now,
    });

    assert.equal(
      option.canTarget,
      validation.ok,
      `validator disagreement for ${option.kingdomId}`,
    );
    assert.equal(
      option.disabledReason,
      validation.ok ? null : validation.reason,
      `reason disagreement for ${option.kingdomId}`,
    );
  }
});

test("every option the read model renders agrees with the mutation", async () => {
  const state = createFakeState();
  const options = await getScoutTargetOptionsForUser(
    "user-1",
    createFakeReadModelDependencies(state),
  );

  assert.ok(options.length >= 2, "expected a protected and an unprotected target");

  for (const option of options) {
    // A fresh state per option, so the mutation's own reservation and order row
    // from an earlier iteration cannot change a later verdict.
    const mutationState = createFakeState();
    const result = await createScoutOrderForUser(
      { id: "user-1" },
      { targetKingdomId: option.kingdomId, scoutCount: SCOUT_ORDER_MIN_SCOUTS },
      createFakeMutationDependencies(mutationState),
    );

    assert.equal(
      result.ok,
      option.canTarget,
      `read model and mutation disagreed for ${option.kingdomId}`,
    );

    if (result.ok) {
      assert.equal(option.disabledReason, null);
      assert.equal(result.targetKingdomId, option.kingdomId);
      assert.equal(result.distanceM, option.distanceM);
      assert.equal(result.travelTicks, option.travelTicks);
      assert.equal(result.arrivalAt, option.arrivalAt);
      assert.equal(mutationState.movementOrders.length, 1);
      continue;
    }

    assert.equal(result.reason, option.disabledReason);
    assert.equal(mutationState.movementOrders.length, 0);
    assert.equal(mutationState.scoutStacks[0].quantity, GARRISON_SCOUTS);
  }
});

test("the option shape carries everything the dropdown renders", async () => {
  const state = createFakeState();
  const options = await getScoutTargetOptionsForUser(
    "user-1",
    createFakeReadModelDependencies(state),
  );

  for (const option of options) {
    const shaped: ScoutTargetOption = option;

    assert.equal(typeof shaped.kingdomId, "string");
    assert.equal(typeof shaped.kingdomName, "string");
    assert.equal(Number.isInteger(shaped.distanceM), true);
    assert.equal(Number.isInteger(shaped.travelTicks), true);
    assert.equal(Number.isNaN(Date.parse(shaped.arrivalAt)), false);
    assert.equal(typeof shaped.isProtected, "boolean");
    assert.equal(
      shaped.protectionEndsAt === null || Number.isNaN(Date.parse(shaped.protectionEndsAt)),
      false,
    );
    assert.equal(typeof shaped.canTarget, "boolean");
    assert.equal(shaped.canTarget, shaped.disabledReason === null);
  }
});
function createKingdom(
  id: string,
  userId: string,
  name: string,
  center: { lat: number; lng: number },
  protectionEndsAt: Date | null,
  createdOrder: number,
): FakeKingdom {
  return {
    id,
    userId,
    name,
    centerLat: center.lat,
    centerLng: center.lng,
    protectionEndsAt,
    createdAt: new Date(Date.UTC(2026, 0, createdOrder)),
  };
}

/** The caller's kingdom plus one close unprotected target and one protected target. */
function createDefaultKingdoms(): FakeKingdom[] {
  return [
    createKingdom("kingdom-1", "user-1", "Al Riyadh", RIYADH, expiredProtection, 1),
    createKingdom("kingdom-2", "user-2", "Al Madinah", JEDDAH, expiredProtection, 2),
    createKingdom("kingdom-3", "user-3", "Al Qahirah", CAIRO, activeProtection, 3),
  ];
}

/** A caller plus `targetCount` further kingdoms, all unprotected and in order. */
function createManyKingdoms(targetCount: number): FakeKingdom[] {
  const kingdoms = createDefaultKingdoms();

  for (let index = 0; index < targetCount; index += 1) {
    kingdoms.push(
      createKingdom(
        `kingdom-extra-${index}`,
        `user-extra-${index}`,
        `Extra ${index}`,
        JEDDAH,
        expiredProtection,
        4 + index,
      ),
    );
  }

  return kingdoms;
}

function createFakeState(overrides: Partial<FakeState> = {}): FakeState {
  return {
    kingdoms: createDefaultKingdoms(),
    scoutStacks: [
      {
        kingdomId: "kingdom-1",
        unitType: SCOUT_ORDER_UNIT_TYPE,
        locationType: "GARRISON",
        quantity: GARRISON_SCOUTS,
      },
    ],
    movementOrders: [],
    transactionCount: 0,
    findManyTake: null,
    findManyExcludedId: null,
    ...overrides,
  };
}

function findKingdom(state: FakeState, kingdomId: string): FakeKingdom | null {
  return state.kingdoms.find((kingdom) => kingdom.id === kingdomId) ?? null;
}

function createFakeReadModelDependencies(state: FakeState): ScoutTargetOptionDependencies {
  return {
    now: () => now,
    db: {
      kingdom: {
        async findUnique(args: unknown) {
          const userId = getNested<string>(args, ["where", "userId"]);
          const kingdom = state.kingdoms.find((current) => current.userId === userId);

          if (!kingdom) {
            return null;
          }

          return {
            id: kingdom.id,
            centerLat: kingdom.centerLat,
            centerLng: kingdom.centerLng,
            unitStacks: resolveGarrisonStacks(state, kingdom.id),
          };
        },
        async findMany(args: unknown) {
          const excludedId = getNested<string>(args, ["where", "id", "not"]);
          const take = getOptional<number>(args, ["take"]);

          state.findManyExcludedId = excludedId;
          state.findManyTake = typeof take === "number" ? take : null;

          const ordered = [...state.kingdoms]
            .filter((kingdom) => kingdom.id !== excludedId)
            .sort(
              (current, other) => current.createdAt.getTime() - other.createdAt.getTime(),
            );

          return (typeof take === "number" ? ordered.slice(0, take) : ordered).map(
            (kingdom) => ({
              id: kingdom.id,
              name: kingdom.name,
              centerLat: kingdom.centerLat,
              centerLng: kingdom.centerLng,
              protectionEndsAt: kingdom.protectionEndsAt,
            }),
          );
        },
      },
    },
  };
}
/**
 * The mutation's fake, backed by the same `FakeState`, so the agreement test can
 * replay each read-model option through the real mutation and compare verdicts.
 */
function createFakeMutationDependencies(
  state: FakeState,
): CreateScoutOrderDependencies {
  return {
    now: () => now,
    db: {
      async $transaction(callback) {
        state.transactionCount += 1;

        return callback({
          kingdom: {
            async findUnique(args: unknown) {
              const userId = getOptional<string>(args, ["where", "userId"]);
              const kingdomId = getOptional<string>(args, ["where", "id"]);

              const kingdom =
                typeof userId === "string"
                  ? (state.kingdoms.find((current) => current.userId === userId) ?? null)
                  : typeof kingdomId === "string"
                    ? findKingdom(state, kingdomId)
                    : null;

              if (!kingdom) {
                return null;
              }

              return {
                id: kingdom.id,
                name: kingdom.name,
                centerLat: kingdom.centerLat,
                centerLng: kingdom.centerLng,
                protectionEndsAt: kingdom.protectionEndsAt,
                unitStacks: resolveGarrisonStacks(state, kingdom.id),
              };
            },
          },
          unitStack: {
            async updateMany(args: unknown) {
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
            async create(args: unknown) {
              const order = {
                id: `movement-order-${state.movementOrders.length + 1}`,
                targetKingdomId: getNested<string>(args, ["data", "targetKingdomId"]),
              };

              state.movementOrders.push(order);

              return order;
            },
          },
        });
      },
    },
  };
}

function resolveGarrisonStacks(
  state: FakeState,
  kingdomId: string,
): Array<{ quantity: number }> {
  return state.scoutStacks
    .filter(
      (stack) =>
        stack.kingdomId === kingdomId &&
        stack.unitType === SCOUT_ORDER_UNIT_TYPE &&
        stack.locationType === "GARRISON",
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

/**
 * Reads an optional query path, e.g. distinguishing the `where: { userId }` source
 * lookup from the `where: { id }` target lookup. Unlike `getNested`, an absent
 * path returns `undefined` rather than throwing, because these fake lookups
 * branch on which key the caller supplied.
 */
function getOptional<T>(value: unknown, path: string[]): T | undefined {
  let current: unknown = value;

  for (const segment of path) {
    if (!isRecord(current) || !(segment in current)) {
      return undefined;
    }

    current = current[segment];
  }

  return current as T;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}