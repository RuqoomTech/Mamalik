import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateFreeLandM2,
  getProtectionRemainingText,
  shapeKingdomDashboardData,
  type DashboardSourceKingdom,
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
  ],
  buildings: [
    {
      id: "building_1",
      type: "HOUSES",
      level: 1,
      status: "ACTIVE",
      landUsedM2: 1_000,
      district: { type: "RESIDENTIAL" },
    },
  ],
  unitStacks: [
    { id: "unit_1", unitType: "INFANTRY", quantity: 100, locationType: "GARRISON" },
  ],
};

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

test("shapes dashboard data from stored kingdom records", () => {
  const dashboardData = shapeKingdomDashboardData(
    sourceKingdom,
    new Date("2026-06-17T00:00:00.000Z"),
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
    ],
  );
  assert.deepEqual(dashboardData.buildings[0], {
    id: "building_1",
    type: "HOUSES",
    label: "Houses",
    level: 1,
    status: "ACTIVE",
    statusLabel: "Active",
    landUsedM2: 1_000,
    districtType: "RESIDENTIAL",
    districtLabel: "Residential",
  });
  assert.deepEqual(dashboardData.army[0], {
    id: "unit_1",
    unitType: "INFANTRY",
    label: "Infantry",
    quantity: 100,
    locationType: "GARRISON",
    locationLabel: "Garrison",
  });
});
