import assert from "node:assert/strict";
import test from "node:test";
import {
  formatAdminEnumLabel,
  getAdminReportReadState,
  shapeAdminBuildingRow,
  shapeAdminDistrictRow,
  shapeAdminReportRow,
  shapeAdminTickLogRow,
  shapeAdminUnitRow,
} from "./admin-data";

test("formats admin enum values for display", () => {
  assert.equal(formatAdminEnumLabel("LAND_PURCHASE"), "Land Purchase");
  assert.equal(formatAdminEnumLabel("DEFENSIVE"), "Defensive");
});

test("shapes admin district rows with free land", () => {
  const row = shapeAdminDistrictRow({
    type: "ECONOMIC",
    allocatedLandM2: 15_000,
    usedLandM2: 2_000,
    kingdom: {
      name: "Riyadh Realm",
    },
  });

  assert.deepEqual(row, {
    kingdomName: "Riyadh Realm",
    type: "ECONOMIC",
    typeLabel: "Economic",
    allocatedLandM2: 15_000,
    usedLandM2: 2_000,
    freeLandM2: 13_000,
  });
});

test("shapes admin building rows with readable labels", () => {
  const row = shapeAdminBuildingRow({
    type: "SCHOLAR_HALL",
    level: 1,
    status: "ACTIVE",
    landUsedM2: 1_000,
    kingdom: {
      name: "Knowledge Keep",
    },
    district: {
      type: "RESEARCH",
    },
  });

  assert.equal(row.typeLabel, "Scholar Hall");
  assert.equal(row.statusLabel, "Active");
  assert.equal(row.districtLabel, "Research");
});

test("shapes admin unit rows with readable location labels", () => {
  const row = shapeAdminUnitRow({
    unitType: "INFANTRY",
    quantity: 100,
    locationType: "GARRISON",
    kingdom: {
      name: "Garrison Test",
    },
  });

  assert.deepEqual(row, {
    kingdomName: "Garrison Test",
    unitType: "INFANTRY",
    unitLabel: "Infantry",
    quantity: 100,
    locationType: "GARRISON",
    locationLabel: "Garrison",
  });
});

test("reports read and unread states consistently", () => {
  assert.equal(getAdminReportReadState(null), "Unread");
  assert.equal(getAdminReportReadState(new Date("2026-06-17T00:00:00.000Z")), "Read");
});

test("shapes report preview rows without exposing report body", () => {
  const row = shapeAdminReportRow({
    type: "LAND_PURCHASE",
    title: "Land purchase completed",
    readAt: null,
    createdAt: new Date("2026-06-17T00:00:00.000Z"),
    kingdom: {
      name: "Preview Kingdom",
    },
  });

  assert.deepEqual(row, {
    type: "LAND_PURCHASE",
    typeLabel: "Land Purchase",
    title: "Land purchase completed",
    kingdomName: "Preview Kingdom",
    createdAt: new Date("2026-06-17T00:00:00.000Z"),
    readState: "Unread",
  });
});

test("shapes TickLog rows for admin display", () => {
  const row = shapeAdminTickLogRow({
    tickKey: "2026-06-21T20:00:00.000Z",
    status: "COMPLETED",
    processedKingdomCount: 2,
    startedAt: new Date("2026-06-21T20:00:01.000Z"),
    finishedAt: new Date("2026-06-21T20:00:05.000Z"),
    errorMessage: null,
  });

  assert.deepEqual(row, {
    tickKey: "2026-06-21T20:00:00.000Z",
    status: "COMPLETED",
    statusLabel: "Completed",
    processedKingdomCount: 2,
    startedAt: new Date("2026-06-21T20:00:01.000Z"),
    finishedAt: new Date("2026-06-21T20:00:05.000Z"),
    errorMessage: null,
  });
});
