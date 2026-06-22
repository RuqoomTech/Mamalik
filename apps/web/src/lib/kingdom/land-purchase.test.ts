import assert from "node:assert/strict";
import test from "node:test";
import { createLandPurchaseOptions } from "./land-purchase-options";
import {
  purchaseLandForUser,
  type PurchaseLandDependencies,
} from "./land-purchase";

type FakeKingdom = {
  id: string;
  userId: string;
  usableLandM2: number;
  areaType: string;
};

type FakeStockpile = {
  kingdomId: string;
  money: number;
};

type FakeCooldown = {
  id: string;
  kingdomId: string;
  packageSizeM2: number;
  availableAt: Date;
};

type FakeReport = {
  kingdomId: string;
  type: string;
  title: string;
  bodyJson: Record<string, unknown>;
};

type FakeState = {
  transactionCount: number;
  kingdom: FakeKingdom | null;
  stockpile: FakeStockpile | null;
  cooldowns: FakeCooldown[];
  reports: FakeReport[];
};

const now = new Date("2026-06-23T12:00:00.000Z");

test("unauthenticated users cannot buy land", async () => {
  const state = createFakeState();
  const result = await purchaseLandForUser(null, "LAND_500", createFakeDependencies(state));

  assert.deepEqual(result, {
    ok: false,
    reason: "UNAUTHENTICATED",
    message: "You must be signed in to buy land.",
  });
  assert.equal(state.transactionCount, 0);
});

test("users without a kingdom cannot buy land", async () => {
  const state = createFakeState({ kingdom: null, stockpile: null, cooldowns: [] });
  const result = await purchaseLandForUser({ id: "user-1" }, "LAND_500", createFakeDependencies(state));

  assert.deepEqual(result, {
    ok: false,
    reason: "NO_KINGDOM",
    message: "Create a kingdom before buying land.",
  });
});

test("invalid packages are rejected before mutation", async () => {
  const state = createFakeState();
  const result = await purchaseLandForUser({ id: "user-1" }, "LAND_750", createFakeDependencies(state));

  assert.deepEqual(result, {
    ok: false,
    reason: "INVALID_PACKAGE",
    message: "Choose a valid land package.",
  });
  assert.equal(state.transactionCount, 0);
});

test("missing stockpile is rejected", async () => {
  const state = createFakeState({ stockpile: null });
  const result = await purchaseLandForUser({ id: "user-1" }, "LAND_500", createFakeDependencies(state));

  assert.deepEqual(result, {
    ok: false,
    reason: "MISSING_STOCKPILE",
    message: "Your kingdom resource stockpile is missing.",
  });
});

test("insufficient Money is rejected", async () => {
  const state = createFakeState({
    stockpile: {
      kingdomId: "kingdom-1",
      money: 999,
    },
  });
  const result = await purchaseLandForUser({ id: "user-1" }, "LAND_500", createFakeDependencies(state));

  assert.deepEqual(result, {
    ok: false,
    reason: "INSUFFICIENT_MONEY",
    message: "You do not have enough Money to buy this land package.",
  });
  assert.equal(state.kingdom?.usableLandM2, 50_000);
});

test("active cooldown is rejected without changing Money or land", async () => {
  const state = createFakeState({
    cooldowns: [
      {
        id: "cooldown-1000",
        kingdomId: "kingdom-1",
        packageSizeM2: 1_000,
        availableAt: new Date("2026-06-23T13:00:00.000Z"),
      },
    ],
  });
  const result = await purchaseLandForUser({ id: "user-1" }, "LAND_1000", createFakeDependencies(state));

  assert.deepEqual(result, {
    ok: false,
    reason: "COOLDOWN_ACTIVE",
    message: "This land package is still on cooldown.",
  });
  assert.equal(state.stockpile?.money, 100_000);
  assert.equal(state.kingdom?.usableLandM2, 50_000);
});

test("successful 500 m2 purchase subtracts Money, increases land, and creates report without blocking cooldown", async () => {
  const state = createFakeState();
  const result = await purchaseLandForUser({ id: "user-1" }, "LAND_500", createFakeDependencies(state));

  assert.deepEqual(result, {
    ok: true,
    packageKey: "LAND_500",
    packageSizeM2: 500,
    pricePaid: 1_000,
    newUsableLandM2: 50_500,
  });
  assert.equal(state.stockpile?.money, 99_000);
  assert.equal(state.kingdom?.usableLandM2, 50_500);
  assert.equal(state.cooldowns.find((cooldown) => cooldown.packageSizeM2 === 500)?.availableAt.toISOString(), now.toISOString());
  assert.equal(state.reports.length, 1);
  assert.equal(state.reports[0].type, "LAND_PURCHASE");
  assert.equal(state.reports[0].bodyJson.pricePaid, 1_000);
  assert.equal(state.reports[0].bodyJson.cooldownUntil, null);
});

test("successful 1,000 m2 purchase sets six hour cooldown and recomputes price server-side", async () => {
  const state = createFakeState();
  const result = await purchaseLandForUser({ id: "user-1" }, "LAND_1000", createFakeDependencies(state));

  assert.deepEqual(result, {
    ok: true,
    packageKey: "LAND_1000",
    packageSizeM2: 1_000,
    pricePaid: 2_000,
    newUsableLandM2: 51_000,
    cooldownUntil: "2026-06-23T18:00:00.000Z",
  });
  assert.equal(state.stockpile?.money, 98_000);
  assert.equal(state.kingdom?.usableLandM2, 51_000);
  assert.equal(state.cooldowns.find((cooldown) => cooldown.packageSizeM2 === 1_000)?.availableAt.toISOString(), "2026-06-23T18:00:00.000Z");
  assert.equal(state.reports[0].bodyJson.packageKey, "LAND_1000");
  assert.equal(state.reports[0].bodyJson.areaType, "STANDARD");
});

test("immediate repeat purchase is rejected by cooldown and does not double mutate", async () => {
  const state = createFakeState();
  const dependencies = createFakeDependencies(state);

  const first = await purchaseLandForUser({ id: "user-1" }, "LAND_1000", dependencies);
  const second = await purchaseLandForUser({ id: "user-1" }, "LAND_1000", dependencies);

  assert.equal(first.ok, true);
  assert.deepEqual(second, {
    ok: false,
    reason: "COOLDOWN_ACTIVE",
    message: "This land package is still on cooldown.",
  });
  assert.equal(state.stockpile?.money, 98_000);
  assert.equal(state.kingdom?.usableLandM2, 51_000);
  assert.equal(state.reports.length, 1);
});

test("land purchase options expose affordability and cooldown state", () => {
  const options = createLandPurchaseOptions({
    kingdom: {
      usableLandM2: 50_000,
      areaType: "STANDARD",
    },
    stockpile: {
      money: 1_500,
    },
    cooldowns: [
      {
        packageSizeM2: 1_000,
        availableAt: new Date("2026-06-23T13:00:00.000Z"),
      },
    ],
    now,
  });

  assert.deepEqual(
    options.map((option) => ({
      key: option.packageKey,
      canBuyNow: option.canBuyNow,
      disabledReason: option.disabledReason,
      price: option.price.totalPrice,
    })),
    [
      { key: "LAND_500", canBuyNow: true, disabledReason: null, price: 1_000 },
      { key: "LAND_1000", canBuyNow: false, disabledReason: "COOLDOWN_ACTIVE", price: 2_000 },
      { key: "LAND_5000", canBuyNow: false, disabledReason: "INSUFFICIENT_MONEY", price: 10_000 },
      { key: "LAND_10000", canBuyNow: false, disabledReason: "INSUFFICIENT_MONEY", price: 20_000 },
    ],
  );
  assert.equal(options[1].cooldownRemainingMs, 60 * 60 * 1000);
});

function createFakeState(overrides: Partial<FakeState> = {}): FakeState {
  return {
    transactionCount: 0,
    kingdom: {
      id: "kingdom-1",
      userId: "user-1",
      usableLandM2: 50_000,
      areaType: "STANDARD",
    },
    stockpile: {
      kingdomId: "kingdom-1",
      money: 100_000,
    },
    cooldowns: [],
    reports: [],
    ...overrides,
  };
}

function createFakeDependencies(state: FakeState): PurchaseLandDependencies {
  return {
    now: () => now,
    db: {
      async $transaction(callback) {
        state.transactionCount += 1;
        return callback(createFakeTransaction(state));
      },
    },
  };
}

function createFakeTransaction(state: FakeState) {
  return {
    kingdom: {
      async findUnique(args: unknown) {
        const userId = getNested<string>(args, ["where", "userId"]);

        if (!state.kingdom || state.kingdom.userId !== userId) {
          return null;
        }

        const packageSizeM2 = getNested<number>(args, [
          "select",
          "landCooldowns",
          "where",
          "packageSizeM2",
        ]);

        return {
          id: state.kingdom.id,
          usableLandM2: state.kingdom.usableLandM2,
          areaType: state.kingdom.areaType,
          resourceStockpile: state.stockpile
            ? {
                money: state.stockpile.money,
              }
            : null,
          landCooldowns: state.cooldowns
            .filter((cooldown) => cooldown.packageSizeM2 === packageSizeM2)
            .slice(0, 1)
            .map((cooldown) => ({
              id: cooldown.id,
              packageSizeM2: cooldown.packageSizeM2,
              availableAt: cooldown.availableAt,
            })),
        };
      },
      async update(args: unknown) {
        if (!state.kingdom) {
          throw new Error("Missing fake kingdom");
        }

        state.kingdom.usableLandM2 += getNested<number>(args, [
          "data",
          "usableLandM2",
          "increment",
        ]);

        return {
          usableLandM2: state.kingdom.usableLandM2,
        };
      },
    },
    resourceStockpile: {
      async updateMany(args: unknown) {
        const kingdomId = getNested<string>(args, ["where", "kingdomId"]);
        const minimumMoney = getNested<number>(args, ["where", "money", "gte"]);
        const decrement = getNested<number>(args, ["data", "money", "decrement"]);

        if (!state.stockpile || state.stockpile.kingdomId !== kingdomId || state.stockpile.money < minimumMoney) {
          return { count: 0 };
        }

        state.stockpile.money -= decrement;
        return { count: 1 };
      },
    },
    landPurchaseCooldown: {
      async updateMany(args: unknown) {
        const id = getNested<string>(args, ["where", "id"]);
        const lteDate = getNested<Date | undefined>(args, ["where", "availableAt", "lte"], undefined);
        const availableAt = getNested<Date>(args, ["data", "availableAt"]);
        const cooldown = state.cooldowns.find((currentCooldown) => currentCooldown.id === id);

        if (!cooldown || (lteDate && cooldown.availableAt.getTime() > lteDate.getTime())) {
          return { count: 0 };
        }

        cooldown.availableAt = availableAt;
        return { count: 1 };
      },
      async create(args: unknown) {
        const data = getNested<Record<string, unknown>>(args, ["data"]);
        const packageSizeM2 = data.packageSizeM2 as number;

        if (state.cooldowns.some((cooldown) => cooldown.packageSizeM2 === packageSizeM2)) {
          throw new Error("duplicate cooldown");
        }

        state.cooldowns.push({
          id: `cooldown-${packageSizeM2}`,
          kingdomId: data.kingdomId as string,
          packageSizeM2,
          availableAt: data.availableAt as Date,
        });
      },
      async upsert(args: unknown) {
        const packageSizeM2 = getNested<number>(args, [
          "where",
          "kingdomId_packageSizeM2",
          "packageSizeM2",
        ]);
        const cooldown = state.cooldowns.find(
          (currentCooldown) => currentCooldown.packageSizeM2 === packageSizeM2,
        );
        const availableAt = cooldown
          ? getNested<Date>(args, ["update", "availableAt"])
          : getNested<Date>(args, ["create", "availableAt"]);

        if (cooldown) {
          cooldown.availableAt = availableAt;
          return;
        }

        state.cooldowns.push({
          id: `cooldown-${packageSizeM2}`,
          kingdomId: getNested<string>(args, ["where", "kingdomId_packageSizeM2", "kingdomId"]),
          packageSizeM2,
          availableAt,
        });
      },
    },
    report: {
      async create(args: unknown) {
        const data = getNested<FakeReport>(args, ["data"]);
        state.reports.push(data);
      },
    },
  };
}

function getNested<T>(value: unknown, path: string[], fallback?: T): T {
  let current: unknown = value;

  for (const segment of path) {
    if (!isRecord(current) || !(segment in current)) {
      if (arguments.length === 3) {
        return fallback as T;
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
