import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateMaxAffordableUnits,
  getHighestBarracksLevel,
  planBuildingUpgrade,
  planNewBuilding,
  planTraining,
  type KingdomActionState,
} from "./construction-rules";

function createState(overrides: Partial<KingdomActionState> = {}): KingdomActionState {
  return {
    stockpile: { money: 10_000, manpower: 500 },
    buildings: [
      { id: "palace", type: "PALACE", level: 1, status: "ACTIVE", districtType: "RESIDENTIAL" },
      { id: "farm", type: "FARM", level: 1, status: "ACTIVE", districtType: "ECONOMIC" },
      { id: "barracks", type: "BARRACKS", level: 1, status: "ACTIVE", districtType: "MILITARY" },
    ],
    districts: [
      { type: "ECONOMIC", allocatedLandM2: 15_000, usedLandM2: 2_000 },
      { type: "RESIDENTIAL", allocatedLandM2: 12_000, usedLandM2: 2_000 },
      { type: "MILITARY", allocatedLandM2: 8_000, usedLandM2: 1_000 },
      { type: "DEFENSIVE", allocatedLandM2: 1_500, usedLandM2: 1_000 },
      { type: "RESEARCH", allocatedLandM2: 7_000, usedLandM2: 1_000 },
    ],
    activeTrainingQueues: 0,
    ...overrides,
  };
}

test("plans a new farm with level 1 cost, ticks, and footprint", () => {
  assert.deepEqual(planNewBuilding(createState(), "FARM"), {
    ok: true,
    buildingType: "FARM",
    targetLevel: 1,
    cost: { money: 1_200, manpower: 40 },
    ticks: 3,
    landFootprintM2: 1_000,
    districtType: "ECONOMIC",
  });
});

test("rejects unknown, unbuildable, and capped buildings", () => {
  assert.deepEqual(planNewBuilding(createState(), "CASTLE"), { ok: false, reason: "INVALID_BUILDING" });
  assert.deepEqual(planNewBuilding(createState(), "STABLES"), { ok: false, reason: "NOT_BUILDABLE" });
  assert.deepEqual(planNewBuilding(createState(), "PALACE"), { ok: false, reason: "MAX_INSTANCES" });
});

test("rejects new buildings when the district lacks free land", () => {
  assert.deepEqual(planNewBuilding(createState(), "WALL"), { ok: false, reason: "NOT_ENOUGH_LAND" });
});

test("only one construction slot is available", () => {
  const state = createState();
  state.buildings[1] = { ...state.buildings[1]!, status: "UPGRADING", level: 2 };

  assert.deepEqual(planNewBuilding(state, "MARKET"), { ok: false, reason: "SLOT_BUSY" });
  assert.deepEqual(planBuildingUpgrade(state, "palace"), { ok: false, reason: "SLOT_BUSY" });
});

test("rejects construction the kingdom cannot afford", () => {
  assert.deepEqual(planNewBuilding(createState({ stockpile: { money: 100, manpower: 500 } }), "FARM"), {
    ok: false,
    reason: "INSUFFICIENT_MONEY",
  });
  assert.deepEqual(planNewBuilding(createState({ stockpile: { money: 10_000, manpower: 1 } }), "FARM"), {
    ok: false,
    reason: "INSUFFICIENT_MANPOWER",
  });
  assert.deepEqual(planNewBuilding(createState({ stockpile: null }), "FARM"), {
    ok: false,
    reason: "MISSING_STOCKPILE",
  });
});

test("plans an upgrade with cost and time scaled to the target level", () => {
  assert.deepEqual(planBuildingUpgrade(createState(), "farm"), {
    ok: true,
    buildingType: "FARM",
    targetLevel: 2,
    cost: { money: 2_400, manpower: 80 },
    ticks: 6,
    landFootprintM2: 0,
    districtType: "ECONOMIC",
  });
  assert.deepEqual(planBuildingUpgrade(createState(), "missing"), { ok: false, reason: "BUILDING_NOT_FOUND" });
});

test("rejects upgrades past the max level", () => {
  const state = createState();
  state.buildings[1] = { ...state.buildings[1]!, level: 10 };

  assert.deepEqual(planBuildingUpgrade(state, "farm"), { ok: false, reason: "MAX_LEVEL" });
});

test("plans training and enforces barracks level, queue, and quantity", () => {
  assert.deepEqual(planTraining(createState(), "INFANTRY", 50), {
    ok: true,
    unitType: "INFANTRY",
    quantity: 50,
    cost: { money: 1_000, manpower: 50 },
    ticks: 2,
  });
  assert.deepEqual(planTraining(createState(), "CAVALRY", 5), { ok: false, reason: "BARRACKS_LEVEL_TOO_LOW" });
  assert.deepEqual(planTraining(createState({ activeTrainingQueues: 1 }), "INFANTRY", 5), {
    ok: false,
    reason: "QUEUE_BUSY",
  });
  assert.deepEqual(planTraining(createState(), "INFANTRY", 0), { ok: false, reason: "INVALID_QUANTITY" });
  assert.deepEqual(planTraining(createState(), "INFANTRY", 1.5), { ok: false, reason: "INVALID_QUANTITY" });
  assert.deepEqual(planTraining(createState({ buildings: [] }), "INFANTRY", 5), { ok: false, reason: "NO_BARRACKS" });
});

test("an upgrading barracks still counts at its previous level", () => {
  assert.equal(
    getHighestBarracksLevel([{ id: "b", type: "BARRACKS", level: 3, status: "UPGRADING", districtType: "MILITARY" }]),
    2,
  );
  assert.equal(
    getHighestBarracksLevel([{ id: "b", type: "BARRACKS", level: 1, status: "CONSTRUCTING", districtType: "MILITARY" }]),
    0,
  );
});

test("max affordable units respects money, manpower, and batch cap", () => {
  assert.equal(calculateMaxAffordableUnits({ money: 1_000, manpower: 500 }, "INFANTRY"), 50);
  assert.equal(calculateMaxAffordableUnits({ money: 100_000, manpower: 20 }, "INFANTRY"), 20);
  assert.equal(calculateMaxAffordableUnits({ money: 1_000_000, manpower: 10_000 }, "INFANTRY"), 500);
  assert.equal(calculateMaxAffordableUnits(null, "INFANTRY"), 0);
});
