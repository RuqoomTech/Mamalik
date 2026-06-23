import assert from "node:assert/strict";
import test from "node:test";

import {
  allocateUnusedLandForUser,
  getAllocateDistrictLandResultMessage,
  type AllocateDistrictLandDependencies,
} from "./district-allocation";

type FakeKingdom = {
  id: string;
  userId: string;
  usableLandM2: number;
};

type FakeDistrict = {
  id: string;
  kingdomId: string;
  type: string;
  allocatedLandM2: number;
  usedLandM2: number;
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
  districts: FakeDistrict[];
  reports: FakeReport[];
};

test("unauthenticated users cannot allocate district land", async () => {
  const state = createFakeState();
  const result = await allocateUnusedLandForUser(
    null,
    { districtId: "district-military", amountM2: 500 },
    createFakeDependencies(state),
  );

  assert.deepEqual(result, {
    ok: false,
    reason: "UNAUTHENTICATED",
    message: "You must be signed in to allocate district land.",
  });
  assert.equal(state.transactionCount, 0);
});

test("users without a kingdom cannot allocate district land", async () => {
  const state = createFakeState({ kingdom: null, districts: [] });
  const result = await allocateUnusedLandForUser(
    { id: "user-1" },
    { districtId: "district-military", amountM2: 500 },
    createFakeDependencies(state),
  );

  assert.deepEqual(result, {
    ok: false,
    reason: "NO_KINGDOM",
    message: "Create a kingdom before allocating district land.",
  });
});

test("target district must belong to the user's kingdom", async () => {
  const state = createFakeState();
  const result = await allocateUnusedLandForUser(
    { id: "user-1" },
    { districtId: "district-other", amountM2: 500 },
    createFakeDependencies(state),
  );

  assert.deepEqual(result, {
    ok: false,
    reason: "DISTRICT_NOT_FOUND",
    message: "Choose a valid district from your kingdom.",
  });
});

test("invalid amount is rejected without mutation", async () => {
  const state = createFakeState();
  const result = await allocateUnusedLandForUser(
    { id: "user-1" },
    { districtId: "district-military", amountM2: -100 },
    createFakeDependencies(state),
  );

  assert.deepEqual(result, {
    ok: false,
    reason: "INVALID_AMOUNT",
    message: "Enter a positive whole number of square meters.",
  });
  assert.equal(findDistrict(state, "district-military").allocatedLandM2, 8_000);
  assert.equal(state.reports.length, 0);
});

test("amount larger than DB-recomputed unallocated land is rejected", async () => {
  const state = createFakeState({
    kingdom: {
      id: "kingdom-1",
      userId: "user-1",
      usableLandM2: 50_500,
    },
  });
  const result = await allocateUnusedLandForUser(
    { id: "user-1" },
    { districtId: "district-military", amountM2: 600 },
    createFakeDependencies(state),
  );

  assert.deepEqual(result, {
    ok: false,
    reason: "AMOUNT_EXCEEDS_UNALLOCATED_LAND",
    message: "You cannot allocate more land than is currently unallocated.",
  });
  assert.equal(findDistrict(state, "district-military").allocatedLandM2, 8_000);
});

test("successful allocation updates the district and creates a report", async () => {
  const state = createFakeState();
  const result = await allocateUnusedLandForUser(
    { id: "user-1" },
    { districtId: "district-military", amountM2: 500 },
    createFakeDependencies(state),
  );

  assert.deepEqual(result, {
    ok: true,
    districtId: "district-military",
    districtType: "MILITARY",
    amountM2: 500,
    newAllocatedLandM2: 8_500,
    unallocatedBeforeM2: 1_500,
    unallocatedAfterM2: 1_000,
  });
  assert.equal(findDistrict(state, "district-military").allocatedLandM2, 8_500);
  assert.equal(state.reports.length, 1);
  assert.equal(state.reports[0].type, "DISTRICT_ALLOCATION");
  assert.equal(state.reports[0].title, "District land allocated");
  assert.equal(state.reports[0].bodyJson.amountM2, 500);
  assert.equal(state.reports[0].bodyJson.unallocatedAfterM2, 1_000);
});

test("overused districts can receive unused land", async () => {
  const state = createFakeState({
    districts: [
      { id: "district-economic", kingdomId: "kingdom-1", type: "ECONOMIC", allocatedLandM2: 15_000, usedLandM2: 2_000 },
      { id: "district-residential", kingdomId: "kingdom-1", type: "RESIDENTIAL", allocatedLandM2: 12_000, usedLandM2: 2_000 },
      { id: "district-military", kingdomId: "kingdom-1", type: "MILITARY", allocatedLandM2: 500, usedLandM2: 1_200 },
      { id: "district-defensive", kingdomId: "kingdom-1", type: "DEFENSIVE", allocatedLandM2: 8_000, usedLandM2: 1_000 },
      { id: "district-research", kingdomId: "kingdom-1", type: "RESEARCH", allocatedLandM2: 7_000, usedLandM2: 1_000 },
    ],
  });
  const result = await allocateUnusedLandForUser(
    { id: "user-1" },
    { districtId: "district-military", amountM2: 700 },
    createFakeDependencies(state),
  );

  assert.equal(result.ok, true);
  assert.equal(findDistrict(state, "district-military").allocatedLandM2, 1_200);
});

test("allocation result messages are user-facing and stable", () => {
  assert.equal(
    getAllocateDistrictLandResultMessage({
      ok: true,
      districtId: "district-military",
      districtType: "MILITARY",
      amountM2: 500,
      newAllocatedLandM2: 8_500,
      unallocatedBeforeM2: 1_500,
      unallocatedAfterM2: 1_000,
    }),
    "Allocated 500 m2 to Military. Unallocated land is now 1,000 m2.",
  );
  assert.equal(
    getAllocateDistrictLandResultMessage({
      ok: false,
      reason: "INVALID_AMOUNT",
      message: "Enter a positive whole number of square meters.",
    }),
    "Enter a positive whole number of square meters.",
  );
});

function createFakeState(overrides: Partial<FakeState> = {}): FakeState {
  return {
    transactionCount: 0,
    kingdom: {
      id: "kingdom-1",
      userId: "user-1",
      usableLandM2: 51_500,
    },
    districts: createStarterDistricts(),
    reports: [],
    ...overrides,
  };
}

function createStarterDistricts(): FakeDistrict[] {
  return [
    { id: "district-economic", kingdomId: "kingdom-1", type: "ECONOMIC", allocatedLandM2: 15_000, usedLandM2: 2_000 },
    { id: "district-residential", kingdomId: "kingdom-1", type: "RESIDENTIAL", allocatedLandM2: 12_000, usedLandM2: 2_000 },
    { id: "district-military", kingdomId: "kingdom-1", type: "MILITARY", allocatedLandM2: 8_000, usedLandM2: 1_000 },
    { id: "district-defensive", kingdomId: "kingdom-1", type: "DEFENSIVE", allocatedLandM2: 8_000, usedLandM2: 1_000 },
    { id: "district-research", kingdomId: "kingdom-1", type: "RESEARCH", allocatedLandM2: 7_000, usedLandM2: 1_000 },
  ];
}

function createFakeDependencies(state: FakeState): AllocateDistrictLandDependencies {
  return {
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

        return {
          id: state.kingdom.id,
          usableLandM2: state.kingdom.usableLandM2,
          districts: state.districts
            .filter((district) => district.kingdomId === state.kingdom?.id)
            .map((district) => ({
              id: district.id,
              type: district.type,
              allocatedLandM2: district.allocatedLandM2,
              usedLandM2: district.usedLandM2,
            })),
        };
      },
    },
    district: {
      async updateMany(args: unknown) {
        const id = getNested<string>(args, ["where", "id"]);
        const kingdomId = getNested<string>(args, ["where", "kingdomId"]);
        const currentAllocatedLandM2 = getNested<number>(args, ["where", "allocatedLandM2"]);
        const increment = getNested<number>(args, ["data", "allocatedLandM2", "increment"]);
        const district = state.districts.find(
          (currentDistrict) =>
            currentDistrict.id === id &&
            currentDistrict.kingdomId === kingdomId &&
            currentDistrict.allocatedLandM2 === currentAllocatedLandM2,
        );

        if (!district) {
          return { count: 0 };
        }

        district.allocatedLandM2 += increment;
        return { count: 1 };
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

function findDistrict(state: FakeState, id: string): FakeDistrict {
  const district = state.districts.find((currentDistrict) => currentDistrict.id === id);

  if (!district) {
    throw new Error(`Missing fake district ${id}`);
  }

  return district;
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
