import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateFreeLandM2,
  calculateNetFoodPerTick,
  calculateTicksUntilFoodEmpty,
  getFoodStatus,
  getProtectionRemainingText,
  shapeKingdomDashboardData,
  type DashboardSourceKingdom,
  type DashboardSourceTickLog,
} from "./dashboard-data";

const sourceKingdom: DashboardSourceKingdom = {
  id: "kingdom_1",
  name: "North Realm",
  slug: "north-realm",
  centerLat: 24.7136,
  centerLng: 46.6753,
  protectionEndsAt: new Date("2026-06-20T00:00:00.000Z"),
  usableLandM2: 50_000,
  usedLandM2: 7_000,
  visibleAreaM2: 50_000,
  population: 1_000,
  resourceStockpile: {
    money: 10_000,
    food: 5_000,
    manpower: 500,
    knowledge: 0,
  },
  districts: [
    { id: "district_1", type: "RESIDENTIAL", allocatedLandM2: 12_000, usedLandM2: 2_000 },
    { id: "district_2", type: "ECONOMIC", allocatedLandM2: 15_000, usedLandM2: 2_000 },
    { id: "district_3", type: "RESEARCH", allocatedLandM2: 7_000, usedLandM2: 1_000 },
    { id: "district_4", type: "DEFENSIVE", allocatedLandM2: 8_000, usedLandM2: 1_000 },
  ],
  buildings: [
    {
      id: "building_houses",
      type: "HOUSES",
      level: 1,
      status: "ACTIVE",
      landUsedM2: 1_000,
      constructionRemainingTicks: 0,
      district: { type: "RESIDENTIAL" },
    },
    {
      id: "building_palace",
      type: "PALACE",
      level: 1,
      status: "ACTIVE",
      landUsedM2: 1_000,
      constructionRemainingTicks: 0,
      district: { type: "RESIDENTIAL" },
    },
    {
      id: "building_market",
      type: "MARKET",
      level: 1,
      status: "ACTIVE",
      landUsedM2: 1_000,
      constructionRemainingTicks: 0,
      district: { type: "ECONOMIC" },
    },
    {
      id: "building_farm",
      type: "FARM",
      level: 1,
      status: "ACTIVE",
      landUsedM2: 1_000,
      constructionRemainingTicks: 0,
      district: { type: "ECONOMIC" },
    },
    {
      id: "building_scholar",
      type: "SCHOLAR_HALL",
      level: 1,
      status: "ACTIVE",
      landUsedM2: 1_000,
      constructionRemainingTicks: 0,
      district: { type: "RESEARCH" },
    },
    {
      id: "building_watchtower",
      type: "WATCHTOWER",
      level: 1,
      status: "CONSTRUCTING",
      landUsedM2: 1_000,
      constructionRemainingTicks: 3,
      district: { type: "DEFENSIVE" },
    },
  ],
  unitStacks: [
    { id: "unit_1", unitType: "INFANTRY", quantity: 100, locationType: "GARRISON" },
    { id: "unit_2", unitType: "ARCHERS", quantity: 25, locationType: "GARRISON" },
  ],
  trainingQueueItems: [
    {
      id: "training_1",
      unitType: "CAVALRY",
      quantity: 5,
      remainingTicks: 2,
      status: "ACTIVE",
      createdAt: new Date("2026-06-17T00:00:00.000Z"),
    },
  ],
  reports: [
    {
      id: "report_1",
      type: "TRAINING",
      title: "Training completed",
      bodyJson: {
        unitType: "INFANTRY",
        quantity: 10,
        completedTickKey: "2026-06-17T00:10:00.000Z",
      },
      readAt: null,
      createdAt: new Date("2026-06-17T00:20:00.000Z"),
    },
  ],
};

const latestTickLogs: DashboardSourceTickLog[] = [
  {
    tickKey: "2026-06-17T00:20:00.000Z",
    status: "COMPLETED",
    startedAt: new Date("2026-06-17T00:20:01.000Z"),
    finishedAt: new Date("2026-06-17T00:20:05.000Z"),
    processedKingdomCount: 1,
    errorMessage: null,
  },
];

test("calculates free land from stored total and used land", () => {
  assert.equal(calculateFreeLandM2(50_000, 7_000), 43_000);
  assert.equal(calculateFreeLandM2(1_000, 1_200), -200);
});

test("formats beginner protection remaining time", () => {
  assert.equal(
    getProtectionRemainingText(
      new Date("2026-06-20T03:30:00.000Z"),
      new Date("2026-06-17T00:00:00.000Z"),
    ),
    "3 days, 3 hours",
  );
  assert.equal(
    getProtectionRemainingText(
      new Date("2026-06-17T00:45:00.000Z"),
      new Date("2026-06-17T00:00:00.000Z"),
    ),
    "45 minutes",
  );
  assert.equal(
    getProtectionRemainingText(
      new Date("2026-06-16T00:00:00.000Z"),
      new Date("2026-06-17T00:00:00.000Z"),
    ),
    "Protection ended",
  );
});

test("calculates net Food and ticks until Food is empty", () => {
  assert.equal(calculateNetFoodPerTick(120, 24), 96);
  assert.equal(calculateTicksUntilFoodEmpty(50, -10), 5);
  assert.equal(calculateTicksUntilFoodEmpty(50, 0), null);
  assert.equal(calculateTicksUntilFoodEmpty(0, -10), 0);
});

test("shapes dashboard data with economy and tick read models", () => {
  const dashboardData = shapeKingdomDashboardData(
    sourceKingdom,
    new Date("2026-06-17T00:00:00.000Z"),
    latestTickLogs,
  );

  assert.equal(dashboardData.kingdom.freeLandM2, 43_000);
  assert.equal(dashboardData.kingdom.protectionRemaining, "3 days");
  assert.deepEqual(
    dashboardData.districts.map((district) => [
      district.label,
      district.freeLandM2,
    ]),
    [
      ["Economic", 13_000],
      ["Residential", 10_000],
      ["Defensive", 7_000],
      ["Research", 6_000],
    ],
  );
  assert.deepEqual(dashboardData.economyEstimate.money, {
    populationTax: 50,
    marketBonus: 40,
    taxOfficeBonus: 0,
    palaceBonus: 25,
    total: 115,
  });
  assert.deepEqual(dashboardData.economyEstimate.food, {
    farmProduction: 120,
    generatedTotal: 120,
    populationConsumption: 20,
    armyConsumption: 4,
    consumedTotal: 24,
    net: 96,
  });
  assert.deepEqual(dashboardData.economyEstimate.manpower, {
    populationManpowerGrowth: 10,
    housesBonus: 15,
    total: 25,
  });
  assert.deepEqual(dashboardData.economyEstimate.knowledge, {
    scholarHallProduction: 20,
    total: 20,
  });
  assert.equal(dashboardData.foodStatus.label, "Increasing");
  assert.deepEqual(dashboardData.activeConstruction[0], {
    id: "building_watchtower",
    type: "WATCHTOWER",
    label: "Watchtower",
    level: 1,
    status: "CONSTRUCTING",
    statusLabel: "Constructing",
    remainingTicks: 3,
    estimatedTimeRemaining: "~30 minutes",
    districtLabel: "Defensive",
  });
  assert.deepEqual(dashboardData.trainingQueues[0], {
    id: "training_1",
    unitType: "CAVALRY",
    label: "Cavalry",
    quantity: 5,
    remainingTicks: 2,
    estimatedTimeRemaining: "~20 minutes",
    status: "ACTIVE",
    statusLabel: "Active",
  });
  assert.equal(dashboardData.latestTicks[0].statusLabel, "Completed");
  assert.equal(dashboardData.reports[0].read, false);
  assert.equal(
    dashboardData.reports[0].bodySummary,
    "Unit Type: Infantry - Quantity: 10 - Completed Tick Key: 2026-06-17T00:10:00.000Z",
  );
});

test("food status warns when reserves are low and marks shortage at zero", () => {
  assert.deepEqual(getFoodStatus(30, -10), {
    level: "warning",
    label: "Low Food",
    detail: "Food will reach zero in about 3 ticks (~30 minutes).",
    ticksUntilEmpty: 3,
    estimatedTimeUntilEmpty: "~30 minutes",
  });
  assert.equal(getFoodStatus(0, 20).level, "shortage");
});
