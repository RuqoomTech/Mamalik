import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateMovementDistanceMeters,
  calculateTravelTime,
  getMovementArrivalAt,
  validateAttackOrder,
  type AttackArmyEntry,
} from "@mamalik/game";
import {
  createAttackOrderForUser,
  type CreateAttackOrderDependencies,
} from "./attack-orders";
import {
  ATTACK_ARMY_MANIFEST_MIN_TOTAL_UNITS,
  ATTACK_TARGET_OPTION_LIMIT,
  getAttackArmyStacksForUser,
  getAttackTargetOptionsForUser,
  type AttackArmyStackOption,
  type AttackTargetOption,
  type AttackTargetOptionDependencies,
} from "./attack-target-options";

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
  unitStacks: FakeUnitStack[];
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

/** Garrison every fixture kingdom starts with, for the caller especially. */
const GARRISON: FakeUnitStack[] = [
  { kingdomId: "kingdom-1", unitType: "INFANTRY", locationType: "GARRISON", quantity: 50 },
  { kingdomId: "kingdom-1", unitType: "ARCHERS", locationType: "GARRISON", quantity: 10 },
];
test("the caller's own kingdom is never offered as an attack target", async () => {
  const state = createFakeState();
  const options = await getAttackTargetOptionsForUser(
    "user-1",
    createFakeReadModelDependencies(state),
  );

  assert.ok(options.length > 0, "expected at least one target");
  assert.equal(
    options.some((option) => option.kingdomId === "kingdom-1"),
    false,
    "the caller must never be able to attack itself",
  );
  // The exclusion is pushed down into the query, not filtered in memory only.
  assert.equal(state.findManyExcludedId, "kingdom-1");
});

test("the target list is capped at ATTACK_TARGET_OPTION_LIMIT", async () => {
  const state = createFakeState({ kingdoms: createManyKingdoms(25) });
  const options = await getAttackTargetOptionsForUser(
    "user-1",
    createFakeReadModelDependencies(state),
  );

  assert.equal(options.length, ATTACK_TARGET_OPTION_LIMIT);

  // The query fetches more than it returns, so a full page survives once the
  // caller's own kingdom is excluded and the newest kingdoms are dropped.
  assert.ok(
    typeof state.findManyTake === "number" && state.findManyTake > ATTACK_TARGET_OPTION_LIMIT,
    `expected a fetch bound above the limit, got ${state.findManyTake}`,
  );

  // The oldest kingdoms win, because the fake honours `orderBy: { createdAt }`.
  assert.equal(options[0].kingdomId, "kingdom-2");
});

test("a beginner-protected target is listed but cannot be attacked", async () => {
  const state = createFakeState();
  const options = await getAttackTargetOptionsForUser(
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

test("an unprotected target is attackable with no disabled reason", async () => {
  const state = createFakeState();
  const options = await getAttackTargetOptionsForUser(
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
  const options = await getAttackTargetOptionsForUser(
    "user-1",
    createFakeReadModelDependencies(state),
  );

  assert.equal(options[0].isProtected, false);
  assert.equal(options[0].protectionEndsAt, now.toISOString());
  assert.equal(options[0].canTarget, true);
  assert.equal(options[0].disabledReason, null);
});

test("a protected SOURCE kingdom is still offered targets", async () => {
  const state = createFakeState({
    kingdoms: [
      createKingdom("kingdom-1", "user-1", "Al Riyadh", RIYADH, activeProtection, 1),
      createKingdom("kingdom-2", "user-2", "Al Madinah", JEDDAH, expiredProtection, 2),
      createKingdom("kingdom-3", "user-3", "Al Qahirah", CAIRO, expiredProtection, 3),
    ],
  });
  const options = await getAttackTargetOptionsForUser(
    "user-1",
    createFakeReadModelDependencies(state),
  );

  for (const option of options) {
    assert.equal(option.canTarget, true, `expected ${option.kingdomId} to be attackable`);
  }
});

test("distance, travel ticks, and arrival agree with the shared movement formulas", async () => {
  const state = createFakeState();
  const options = await getAttackTargetOptionsForUser(
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
    // The read model probes with one INFANTRY, so the expected pace is INFANTRY's.
    const expectedTravel = calculateTravelTime({
      distanceM: expectedDistance,
      unitTypes: ["INFANTRY"],
    });

    assert.equal(option.distanceM, expectedDistance);
    assert.equal(option.travelTicks, expectedTravel.travelTicks);
    assert.equal(
      option.arrivalAt,
      getMovementArrivalAt(now, expectedTravel.travelTicks).toISOString(),
    );
  }
});

test("users without a kingdom get no attack targets at all", async () => {
  const state = createFakeState();
  const options = await getAttackTargetOptionsForUser(
    "user-missing",
    createFakeReadModelDependencies(state),
  );

  assert.deepEqual(options, []);
});

test("a kingdom with no army is offered nothing attackable", async () => {
  const state = createFakeState({ unitStacks: [] });
  const options = await getAttackTargetOptionsForUser(
    "user-1",
    createFakeReadModelDependencies(state),
  );

  assert.ok(options.length > 0);

  for (const option of options) {
    assert.equal(option.canTarget, false);
    assert.equal(option.disabledReason, "INSUFFICIENT_UNITS");
  }
});
test("a caller with only a non-INFANTRY army is still offered targets", async () => {
  // No INFANTRY at all, so the read model must fall back to the unit type the
  // caller DOES have rather than declaring them army-less.
  const state = createFakeState({
    unitStacks: [
      { kingdomId: "kingdom-1", unitType: "SIEGE", locationType: "GARRISON", quantity: 3 },
    ],
  });
  const options = await getAttackTargetOptionsForUser(
    "user-1",
    createFakeReadModelDependencies(state),
  );

  const openOption = options.find((option) => option.kingdomId === "kingdom-2");

  assert.ok(openOption);
  assert.equal(openOption.canTarget, true);
  assert.equal(openOption.disabledReason, null);

  // The pace shown is the SIEGE pace, because that is what would actually march.
  const expectedDistance = calculateMovementDistanceMeters(RIYADH, JEDDAH);
  const expectedTravel = calculateTravelTime({
    distanceM: expectedDistance,
    unitTypes: ["SIEGE"],
  });

  assert.equal(openOption.travelTicks, expectedTravel.travelTicks);
});

test("a zero-quantity stack is not treated as an army", async () => {
  const state = createFakeState({
    unitStacks: [
      { kingdomId: "kingdom-1", unitType: "INFANTRY", locationType: "GARRISON", quantity: 0 },
    ],
  });
  const options = await getAttackTargetOptionsForUser(
    "user-1",
    createFakeReadModelDependencies(state),
  );

  for (const option of options) {
    assert.equal(option.canTarget, false);
    assert.equal(option.disabledReason, "INSUFFICIENT_UNITS");
  }
});

test("the read model's canTarget never disagrees with the shared validator", async () => {
  const state = createFakeState();
  const options = await getAttackTargetOptionsForUser(
    "user-1",
    createFakeReadModelDependencies(state),
  );

  const garrison: AttackArmyEntry[] = [
    { unitType: "INFANTRY", quantity: 50 },
    { unitType: "ARCHERS", quantity: 10 },
  ];

  for (const option of options) {
    const target = findKingdom(state, option.kingdomId);

    assert.ok(target, `no fixture kingdom for ${option.kingdomId}`);

    const validation = validateAttackOrder({
      sourceKingdomId: "kingdom-1",
      sourceCenterLat: RIYADH.lat,
      sourceCenterLng: RIYADH.lng,
      targetKingdomId: target.id,
      targetCenterLat: target.centerLat,
      targetCenterLng: target.centerLng,
      targetProtectionEndsAt: target.protectionEndsAt,
      units: [
        {
          unitType: "INFANTRY",
          quantity: ATTACK_ARMY_MANIFEST_MIN_TOTAL_UNITS,
        },
      ],
      garrisonUnits: garrison,
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
  const options = await getAttackTargetOptionsForUser(
    "user-1",
    createFakeReadModelDependencies(state),
  );

  assert.ok(options.length >= 2, "expected a protected and an unprotected target");

  for (const option of options) {
    // A fresh state per option, so the mutation's own reservation and order row
    // from an earlier iteration cannot change a later verdict.
    const mutationState = createFakeState();
    const result = await createAttackOrderForUser(
      { id: "user-1" },
      {
        targetKingdomId: option.kingdomId,
        units: [{ unitType: "INFANTRY", quantity: ATTACK_ARMY_MANIFEST_MIN_TOTAL_UNITS }],
      },
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
    assertGarrisonUnchanged(mutationState);
  }
});

test("the option shape carries everything the dropdown renders", async () => {
  const state = createFakeState();
  const options = await getAttackTargetOptionsForUser(
    "user-1",
    createFakeReadModelDependencies(state),
  );

  for (const option of options) {
    const shaped: AttackTargetOption = option;

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
test("the army stacks list only offers sendable garrison units with human labels", async () => {
  const state = createFakeState({
    unitStacks: [
      { kingdomId: "kingdom-1", unitType: "ARCHERS", locationType: "GARRISON", quantity: 10 },
      { kingdomId: "kingdom-1", unitType: "INFANTRY", locationType: "GARRISON", quantity: 50 },
      { kingdomId: "kingdom-1", unitType: "SIEGE", locationType: "GARRISON", quantity: 4 },
      // Excluded: zero in garrison, already marching, or another kingdom's.
      { kingdomId: "kingdom-1", unitType: "CAVALRY", locationType: "GARRISON", quantity: 0 },
      { kingdomId: "kingdom-1", unitType: "SCOUTS", locationType: "MOVING", quantity: 12 },
      { kingdomId: "kingdom-2", unitType: "INFANTRY", locationType: "GARRISON", quantity: 999 },
    ],
  });
  const stacks = await getAttackArmyStacksForUser(
    "user-1",
    createFakeReadModelDependencies(state),
  );

  // A fixed, human-friendly order rather than database row order.
  assert.deepEqual(stacks, [
    { unitType: "INFANTRY", label: "Infantry", quantity: 50 },
    { unitType: "ARCHERS", label: "Archers", quantity: 10 },
    { unitType: "SIEGE", label: "Siege", quantity: 4 },
  ]);

  for (const stack of stacks) {
    const shaped: AttackArmyStackOption = stack;

    assert.equal(typeof shaped.unitType, "string");
    assert.equal(shaped.quantity > 0, true);
  }
});

test("users without a kingdom get no army stacks", async () => {
  const state = createFakeState();
  const stacks = await getAttackArmyStacksForUser(
    "user-missing",
    createFakeReadModelDependencies(state),
  );

  assert.deepEqual(stacks, []);
});

test("a kingdom with an empty garrison gets an empty army stacks list", async () => {
  const state = createFakeState({ unitStacks: [] });
  const stacks = await getAttackArmyStacksForUser(
    "user-1",
    createFakeReadModelDependencies(state),
  );

  assert.deepEqual(stacks, []);
});

test("every stack the army list offers can actually be reserved by the mutation", async () => {
  const state = createFakeState();
  const stacks = await getAttackArmyStacksForUser(
    "user-1",
    createFakeReadModelDependencies(state),
  );

  assert.ok(stacks.length > 0, "expected the fixture garrison to offer stacks");

  for (const stack of stacks) {
    const mutationState = createFakeState();
    const result = await createAttackOrderForUser(
      { id: "user-1" },
      {
        targetKingdomId: "kingdom-2",
        units: [
          {
            unitType: stack.unitType as AttackArmyEntry["unitType"],
            quantity: ATTACK_ARMY_MANIFEST_MIN_TOTAL_UNITS,
          },
        ],
      },
      createFakeMutationDependencies(mutationState),
    );

    assert.equal(
      result.ok,
      true,
      `the read model offered ${stack.unitType} but the mutation rejected it`,
    );
  }
});

test("an empty army list lines up with every target being un-attackable", async () => {
  const state = createFakeState({ unitStacks: [] });
  const stacks = await getAttackArmyStacksForUser(
    "user-1",
    createFakeReadModelDependencies(state),
  );
  const options = await getAttackTargetOptionsForUser(
    "user-1",
    createFakeReadModelDependencies(state),
  );

  assert.deepEqual(stacks, []);
  assert.ok(options.length > 0);

  for (const option of options) {
    assert.equal(option.canTarget, false);
  }
});

test("a caller WITH an army is never blocked on supply grounds", async () => {
  const state = createFakeState();
  const stacks = await getAttackArmyStacksForUser(
    "user-1",
    createFakeReadModelDependencies(state),
  );
  const options = await getAttackTargetOptionsForUser(
    "user-1",
    createFakeReadModelDependencies(state),
  );

  assert.ok(stacks.length > 0, "expected the fixture garrison to offer stacks");

  for (const option of options) {
    assert.notEqual(option.disabledReason, "INSUFFICIENT_UNITS");
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
    unitStacks: GARRISON.map((stack) => ({ ...stack })),
    movementOrders: [],
    transactionCount: 0,
    findManyTake: null,
    findManyExcludedId: null,
    ...overrides,
  };
}

/** Assert no garrison row was decremented by a rejected mutation. */
function assertGarrisonUnchanged(state: FakeState): void {
  assert.deepEqual(
    state.unitStacks.map((stack) => ({ ...stack })),
    GARRISON.map((stack) => ({ ...stack })),
  );
}

function findKingdom(state: FakeState, kingdomId: string): FakeKingdom | null {
  return state.kingdoms.find((kingdom) => kingdom.id === kingdomId) ?? null;
}

/** The garrison rows for one kingdom, honouring the `where` the read model sent. */
function resolveGarrisonStacks(
  state: FakeState,
  kingdomId: string,
  stackWhere: Record<string, unknown>,
): Array<{ unitType: string; quantity: number }> {
  return state.unitStacks
    .filter((stack) => stack.kingdomId === kingdomId)
    .filter(
      (stack) =>
        typeof stackWhere.locationType !== "string" ||
        stack.locationType === stackWhere.locationType,
    )
    .map((stack) => ({ unitType: stack.unitType, quantity: stack.quantity }));
}

function createFakeReadModelDependencies(state: FakeState): AttackTargetOptionDependencies {
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

          const stackWhere = getNested<Record<string, unknown>>(
            args,
            ["select", "unitStacks", "where"],
            {},
          );

          return {
            id: kingdom.id,
            centerLat: kingdom.centerLat,
            centerLng: kingdom.centerLng,
            unitStacks: resolveGarrisonStacks(state, kingdom.id, stackWhere),
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
): CreateAttackOrderDependencies {
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

              const stackWhere = getNested<Record<string, unknown>>(
                args,
                ["select", "unitStacks", "where"],
                {},
              );

              return {
                id: kingdom.id,
                name: kingdom.name,
                centerLat: kingdom.centerLat,
                centerLng: kingdom.centerLng,
                // The shared validator turns a missing deadline into
                // TARGET_NOT_FOUND, so the fake must always supply it.
                protectionEndsAt: kingdom.protectionEndsAt,
                unitStacks: resolveGarrisonStacks(state, kingdom.id, stackWhere),
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