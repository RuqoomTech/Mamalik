import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { TICK_DURATION_MS } from "../../../packages/game/src/constants";
import { getMovementReturnAt } from "../../../packages/game/src/movement/travel-time";
import {
  processMovementArrivals,
  type ArrivingMovementOrder,
  type AttackDefenderGarrisonState,
  type MovementArrivalTransaction,
  type ScoutTargetObservationState,
} from "./movement-arrival";

const TICK_KEY = "2026-06-19T12:30:00.000Z";
const NOW = new Date("2026-06-19T13:00:00.000Z");
const SOURCE_KINGDOM_ID = "kingdom-source";
const TARGET_KINGDOM_ID = "kingdom-target";

type FakeOrder = ArrivingMovementOrder & {
  orderType: "SCOUT" | "RETURN" | "ATTACK";
  status: string;
  parentOrderId: string | null;
  resolvedAt: Date | null;
  returnAt: Date | null;
};

type FakeReport = {
  kingdomId: string;
  type: "SCOUT";
  title: string;
  bodyJson: Record<string, string | number>;
};

type FakeUnitStack = {
  kingdomId: string;
  unitType: string;
  locationType: "GARRISON";
  quantity: number;
};

/**
 * Hand-rolled in-memory stand-in for the tick transaction.
 *
 * It implements only the slice `processMovementArrivals` declares, so the tests
 * exercise the real arrival code paths without needing a live database.
 */
function createFakeTransaction(options: {
  orders?: FakeOrder[];
  kingdoms?: Record<string, ScoutTargetObservationState | AttackDefenderGarrisonState>;
  failingOrderIds?: string[];
  failReportForOrderIds?: string[];
  initialUnitStacks?: FakeUnitStack[];
} = {}) {
  const orders: FakeOrder[] = [...(options.orders ?? [])];
  const kingdoms = options.kingdoms ?? {};
  const failingOrderIds = new Set(options.failingOrderIds ?? []);
  const failReportForOrderIds = new Set(options.failReportForOrderIds ?? []);

  const reports: FakeReport[] = [];
  const unitStacks: FakeUnitStack[] = [...(options.initialUnitStacks ?? [])];
  const callLog: string[] = [];

  const tx: MovementArrivalTransaction = {
    movementOrder: {
      async findMany(args) {
        const { orderType, status, arrivalAt } = args.where;
        const due = orders.filter(
          (order) =>
            order.orderType === orderType &&
            order.status === status &&
            order.arrivalAt.getTime() <= arrivalAt.lte.getTime(),
        );

        return due
          .slice()
          .sort((a, b) => a.arrivalAt.getTime() - b.arrivalAt.getTime())
          .map((order) => ({ ...order }));
      },
      async findFirst(args) {
        const match = orders.find((order) => order.parentOrderId === args.where.parentOrderId);
        return match ? { id: match.id } : null;
      },
      async update(args) {
        const order = orders.find((candidate) => candidate.id === args.where.id);

        if (!order) {
          throw new Error(`Movement order ${args.where.id} not found`);
        }

        if (failingOrderIds.has(order.id)) {
          throw new Error(`update failed for ${order.id}`);
        }

        Object.assign(order, args.data);
        callLog.push(`update:${order.id}:${args.data.status}`);

        return order;
      },
      async create(args) {
        const created: FakeOrder = {
          id: `return-leg-${orders.length + 1}`,
          orderType: args.data.orderType,
          status: args.data.status,
          sourceKingdomId: args.data.sourceKingdomId,
          targetKingdomId: args.data.targetKingdomId,
          unitsJson: args.data.unitsJson,
          distanceM: args.data.distanceM,
          travelTicks: args.data.travelTicks,
          departureAt: args.data.departureAt,
          arrivalAt: args.data.arrivalAt,
          parentOrderId: args.data.parentOrderId,
          resolvedAt: null,
          returnAt: null,
        };

        // The real schema enforces this with a UNIQUE constraint.
        if (orders.some((order) => order.parentOrderId === created.parentOrderId)) {
          throw new Error("Unique constraint failed on parentOrderId");
        }

        orders.push(created);
        callLog.push(`create:${created.id}:${created.parentOrderId}`);

        return created;
      },
    },
    kingdom: {
      async findUnique(args) {
        return kingdoms[args.where.id] ?? null;
      },
    },
    unitStack: {
      async upsert(args) {
        const { kingdomId, unitType, locationType } = args.where.kingdomId_unitType_locationType;
        const existing = unitStacks.find(
          (stack) =>
            stack.kingdomId === kingdomId &&
            stack.unitType === unitType &&
            stack.locationType === locationType,
        );

        if (existing) {
          existing.quantity += args.update.quantity.increment;
          return existing;
        }

        const created: FakeUnitStack = {
          kingdomId,
          unitType,
          locationType,
          quantity: args.create.quantity,
        };
        unitStacks.push(created);

        return created;
      },
      async update(args) {
        const { kingdomId, unitType, locationType } = args.where.kingdomId_unitType_locationType;
        const existing = unitStacks.find(
          (stack) =>
            stack.kingdomId === kingdomId &&
            stack.unitType === unitType &&
            stack.locationType === locationType,
        );

        if (!existing) {
          throw new Error(`Unit stack not found for ${kingdomId} ${unitType}`);
        }

        existing.quantity = args.data.quantity;
        callLog.push(`update-stack:${kingdomId}:${unitType}:${existing.quantity}`);

        return existing;
      },
    },
    report: {
      async create(args) {
        const movementOrderId = args.data.bodyJson.movementOrderId;

        // A test can make report creation fail for a specific order by id; the
        // id travels in the body the shared scout-report builder produced.
        if (typeof movementOrderId === "string" && failReportForOrderIds.has(movementOrderId)) {
          callLog.push(`report-failed:${movementOrderId}`);
          throw new Error(`report insert failed for ${movementOrderId}`);
        }

        callLog.push(`report:${args.data.kingdomId}`);

        const created: FakeReport = {
          kingdomId: args.data.kingdomId,
          type: args.data.type,
          title: args.data.title,
          bodyJson: args.data.bodyJson,
        };

        reports.push(created);

        return created;
      },
    },
  };

  return { tx, orders, reports, unitStacks, callLog };
}
function createTargetKingdom(
  overrides: Partial<ScoutTargetObservationState> = {},
): ScoutTargetObservationState {
  return {
    name: "Rivergate",
    usableLandM2: 50_000,
    resourceStockpile: { food: 400 },
    unitStacks: [{ quantity: 12 }, { quantity: 8 }],
    buildings: [
      { type: "WALL", level: 2 },
      { type: "WATCHTOWER", level: 1 },
      { type: "WALL", level: 4 },
    ],
    districts: [{ allocatedLandM2: 6_000 }],
    ...overrides,
  };
}

function createOutboundScoutOrder(overrides: Partial<FakeOrder> = {}): FakeOrder {
  return {
    id: "order-scout-1",
    orderType: "SCOUT",
    status: "IN_TRANSIT",
    sourceKingdomId: SOURCE_KINGDOM_ID,
    targetKingdomId: TARGET_KINGDOM_ID,
    unitsJson: [{ unitType: "SCOUTS", quantity: 3 }],
    distanceM: 240_000,
    travelTicks: 4,
    departureAt: new Date(NOW.getTime() - 4 * TICK_DURATION_MS),
    arrivalAt: NOW,
    parentOrderId: null,
    resolvedAt: null,
    returnAt: null,
    ...overrides,
  };
}

function createReturnLegOrder(overrides: Partial<FakeOrder> = {}): FakeOrder {
  return {
    id: "order-return-1",
    orderType: "RETURN",
    status: "IN_TRANSIT",
    sourceKingdomId: SOURCE_KINGDOM_ID,
    targetKingdomId: TARGET_KINGDOM_ID,
    unitsJson: [{ unitType: "SCOUTS", quantity: 5 }],
    distanceM: 240_000,
    travelTicks: 4,
    departureAt: new Date(NOW.getTime() - 4 * TICK_DURATION_MS),
    arrivalAt: NOW,
    parentOrderId: "order-scout-1",
    resolvedAt: null,
    returnAt: null,
    ...overrides,
  };
}

function createDefenderKingdom(
  unitStacks: { unitType: string; quantity: number }[],
): AttackDefenderGarrisonState {
  return { unitStacks };
}

function createOutboundAttackOrder(overrides: Partial<FakeOrder> = {}): FakeOrder {
  return {
    id: "order-attack-1",
    orderType: "ATTACK",
    status: "IN_TRANSIT",
    sourceKingdomId: SOURCE_KINGDOM_ID,
    targetKingdomId: TARGET_KINGDOM_ID,
    unitsJson: [{ unitType: "INFANTRY", quantity: 100 }],
    distanceM: 240_000,
    travelTicks: 4,
    departureAt: new Date(NOW.getTime() - 4 * TICK_DURATION_MS),
    arrivalAt: NOW,
    parentOrderId: null,
    resolvedAt: null,
    returnAt: null,
    ...overrides,
  };
}

describe("movement arrival resolution", () => {
  it("resolves an arriving scout order into one report, one RESOLVED order, and one return leg", async () => {
    const fake = createFakeTransaction({
      orders: [createOutboundScoutOrder()],
      kingdoms: { [TARGET_KINGDOM_ID]: createTargetKingdom() },
    });

    const summary = await processMovementArrivals(fake.tx, { now: NOW, tickKey: TICK_KEY });

    assert.equal(summary.ordersArrived, 1);
    assert.equal(summary.scoutReportsCreated, 1);
    assert.equal(summary.returnLegsCreated, 1);
    assert.equal(summary.unitsReturned, 0);
    assert.equal(summary.ordersCompleted, 0);
    assert.deepEqual(summary.warnings, []);

    assert.equal(fake.reports.length, 1);
    assert.equal(fake.reports[0].kingdomId, SOURCE_KINGDOM_ID);
    assert.equal(fake.reports[0].type, "SCOUT");
    assert.equal(fake.reports[0].title, "Scout report: Rivergate");
    assert.equal(fake.reports[0].bodyJson.movementOrderId, "order-scout-1");
    assert.equal(fake.reports[0].bodyJson.travelTicks, 4);

    const outbound = fake.orders.find((order) => order.id === "order-scout-1");
    assert.equal(outbound?.status, "RESOLVED");
    assert.equal(outbound?.resolvedAt?.toISOString(), NOW.toISOString());

    const returnLegs = fake.orders.filter((order) => order.parentOrderId === "order-scout-1");
    assert.equal(returnLegs.length, 1);

    const returnLeg = returnLegs[0];
    assert.equal(returnLeg?.orderType, "RETURN");
    assert.equal(returnLeg?.status, "IN_TRANSIT");
    assert.equal(returnLeg?.sourceKingdomId, SOURCE_KINGDOM_ID);
    assert.equal(returnLeg?.targetKingdomId, TARGET_KINGDOM_ID);
    assert.equal(returnLeg?.distanceM, 240_000);
    // The return leg must reuse the OUTBOUND order's own travelTicks, not a
    // freshly recomputed value.
    assert.equal(returnLeg?.travelTicks, 4);
    assert.deepEqual(returnLeg?.unitsJson, [{ unitType: "SCOUTS", quantity: 3 }]);
    assert.equal(returnLeg?.departureAt.toISOString(), NOW.toISOString());
    assert.equal(
      returnLeg?.arrivalAt.toISOString(),
      getMovementReturnAt(NOW, 4).toISOString(),
    );
  });

  it("band the scout report down instead of revealing exact enemy values", async () => {
    const fake = createFakeTransaction({
      orders: [createOutboundScoutOrder()],
      kingdoms: { [TARGET_KINGDOM_ID]: createTargetKingdom() },
    });

    await processMovementArrivals(fake.tx, { now: NOW, tickKey: TICK_KEY });

    const body = fake.reports[0].bodyJson;

    assert.equal(body.targetKingdomName, "Rivergate");
    // 12 + 8 garrison units is far below SCOUT_ARMY_MEDIUM_MIN_UNITS.
    assert.equal(body.army, "SMALL");
    // Highest WALL level 4, highest WATCHTOWER level 1, 6000 m2 defensive land.
    assert.equal(body.wall, "HIGH");
    assert.equal(body.food, "LOW");
    assert.equal(body.landBandM2, 50_000);

    for (const value of Object.values(body)) {
      assert.equal(typeof value === "string" || typeof value === "number", true);
    }
  });
it("credits a returning leg into the source garrison and completes the order", async () => {
    const fake = createFakeTransaction({ orders: [createReturnLegOrder()] });

    const summary = await processMovementArrivals(fake.tx, { now: NOW, tickKey: TICK_KEY });

    assert.equal(summary.ordersArrived, 1);
    assert.equal(summary.unitsReturned, 5);
    assert.equal(summary.ordersCompleted, 1);
    assert.equal(summary.scoutReportsCreated, 0);
    assert.equal(summary.returnLegsCreated, 0);
    assert.deepEqual(summary.warnings, []);

    assert.equal(fake.unitStacks.length, 1);
    assert.equal(fake.unitStacks[0].kingdomId, SOURCE_KINGDOM_ID);
    assert.equal(fake.unitStacks[0].unitType, "SCOUTS");
    assert.equal(fake.unitStacks[0].locationType, "GARRISON");
    // The row did not exist before, so it must be created at the manifest size.
    assert.equal(fake.unitStacks[0].quantity, 5);

    const order = fake.orders.find((candidate) => candidate.id === "order-return-1");
    assert.equal(order?.status, "COMPLETED");
    assert.equal(order?.returnAt?.toISOString(), NOW.toISOString());
  });

  it("increments an existing garrison stack instead of creating a duplicate", async () => {
    const fake = createFakeTransaction({ orders: [createReturnLegOrder()] });
    fake.unitStacks.push({
      kingdomId: SOURCE_KINGDOM_ID,
      unitType: "SCOUTS",
      locationType: "GARRISON",
      quantity: 7,
    });

    const summary = await processMovementArrivals(fake.tx, { now: NOW, tickKey: TICK_KEY });

    assert.equal(fake.unitStacks.length, 1);
    assert.equal(fake.unitStacks[0].quantity, 12);
    assert.equal(summary.unitsReturned, 5);
    assert.equal(summary.ordersCompleted, 1);
  });

  it("returns home before any scout arrival is processed in the same tick", async () => {
    const fake = createFakeTransaction({
      orders: [
        createOutboundScoutOrder(),
        // A different outbound order, so this leg does not satisfy the scout
        // order under test when the return-leg guard runs in PASS 2.
        createReturnLegOrder({ id: "order-return-earlier", parentOrderId: "order-scout-earlier" }),
      ],
      kingdoms: { [TARGET_KINGDOM_ID]: createTargetKingdom() },
    });

    const summary = await processMovementArrivals(fake.tx, { now: NOW, tickKey: TICK_KEY });

    assert.equal(summary.ordersArrived, 2);
    assert.equal(summary.ordersCompleted, 1);
    assert.equal(summary.scoutReportsCreated, 1);
    assert.equal(summary.returnLegsCreated, 1);
    assert.equal(summary.unitsReturned, 5);
    assert.deepEqual(summary.warnings, []);

    const completedIndex = fake.callLog.indexOf("update:order-return-earlier:COMPLETED");
    const reportIndex = fake.callLog.indexOf(`report:${SOURCE_KINGDOM_ID}`);
    assert.equal(completedIndex >= 0, true);
    assert.equal(reportIndex >= 0, true);
    assert.equal(completedIndex < reportIndex, true);
  });

  it("ignores orders whose arrivalAt is still in the future", async () => {
    const futureArrival = new Date(NOW.getTime() + 5 * TICK_DURATION_MS);
    const fake = createFakeTransaction({
      orders: [
        createOutboundScoutOrder({ id: "scout-later", arrivalAt: futureArrival }),
        createReturnLegOrder({ id: "return-later", arrivalAt: futureArrival }),
      ],
      kingdoms: { [TARGET_KINGDOM_ID]: createTargetKingdom() },
    });

    const summary = await processMovementArrivals(fake.tx, { now: NOW, tickKey: TICK_KEY });

    assert.deepEqual(summary, {
      ordersArrived: 0,
      scoutReportsCreated: 0,
      returnLegsCreated: 0,
      unitsReturned: 0,
      ordersCompleted: 0,
      battlesResolved: 0,
      attackerWins: 0,
      defenderHolds: 0,
      attackerUnitsLost: 0,
      defenderUnitsLost: 0,
      warnings: [],
    });
    assert.equal(fake.reports.length, 0);
    assert.equal(fake.unitStacks.length, 0);
    assert.equal(fake.orders.length, 2);
    assert.equal(fake.orders[0].status, "IN_TRANSIT");
    assert.equal(fake.orders[1].status, "IN_TRANSIT");
  });
it("is a no-op on a second pass over already resolved and completed orders", async () => {
    const fake = createFakeTransaction({
      orders: [createOutboundScoutOrder(), createReturnLegOrder()],
      kingdoms: { [TARGET_KINGDOM_ID]: createTargetKingdom() },
    });

    const first = await processMovementArrivals(fake.tx, { now: NOW, tickKey: TICK_KEY });
    const ordersAfterFirstPass = fake.orders.length;
    const reportsAfterFirstPass = fake.reports.length;
    const unitQuantityAfterFirstPass = fake.unitStacks[0].quantity;

    assert.equal(first.ordersArrived, 2);
    assert.equal(first.scoutReportsCreated, 1);
    assert.equal(first.ordersCompleted, 1);

    const second = await processMovementArrivals(fake.tx, { now: NOW, tickKey: TICK_KEY });

    assert.deepEqual(second, {
      ordersArrived: 0,
      scoutReportsCreated: 0,
      returnLegsCreated: 0,
      unitsReturned: 0,
      ordersCompleted: 0,
      battlesResolved: 0,
      attackerWins: 0,
      defenderHolds: 0,
      attackerUnitsLost: 0,
      defenderUnitsLost: 0,
      warnings: [],
    });
    assert.equal(fake.orders.length, ordersAfterFirstPass);
    assert.equal(fake.reports.length, reportsAfterFirstPass);
    assert.equal(fake.unitStacks.length, 1);
    assert.equal(fake.unitStacks[0].quantity, unitQuantityAfterFirstPass);
  });

  it("never creates a second return leg for the same outbound order", async () => {
    // Simulates the self-healing case where marking the outbound order RESOLVED
    // failed, so the order is still IN_TRANSIT and gets re-read next tick while
    // its return leg already exists. The UNIQUE parentOrderId guard has to turn
    // that re-read into a no-op instead of a constraint failure.
    const fake = createFakeTransaction({
      orders: [createOutboundScoutOrder()],
      kingdoms: { [TARGET_KINGDOM_ID]: createTargetKingdom() },
    });

    await processMovementArrivals(fake.tx, { now: NOW, tickKey: TICK_KEY });
    const existingReturnLeg = fake.orders.find((order) => order.parentOrderId === "order-scout-1");
    assert.equal(existingReturnLeg !== undefined, true);

    // Roll the outbound order back to IN_TRANSIT, leaving the return leg in place.
    const outbound = fake.orders.find((order) => order.id === "order-scout-1");
    if (outbound) {
      outbound.status = "IN_TRANSIT";
      outbound.resolvedAt = null;
    }

    const rerun = await processMovementArrivals(fake.tx, { now: NOW, tickKey: TICK_KEY });

    assert.equal(rerun.returnLegsCreated, 0);
    assert.equal(
      fake.orders.filter((order) => order.parentOrderId === "order-scout-1").length,
      1,
    );
    assert.equal(rerun.warnings.length, 1);
    assert.match(rerun.warnings[0], /already has RETURN leg/);
    assert.match(rerun.warnings[0], /order-scout-1/);
  });
it("isolates one failing order into a warning without blocking the others", async () => {
    const fake = createFakeTransaction({
      orders: [
        createOutboundScoutOrder({ id: "scout-broken" }),
        createOutboundScoutOrder({ id: "scout-healthy" }),
        createReturnLegOrder({ id: "return-healthy", parentOrderId: "order-scout-earlier" }),
      ],
      kingdoms: { [TARGET_KINGDOM_ID]: createTargetKingdom() },
      // The RESOLVED transition of this one order fails inside the database.
      failingOrderIds: ["scout-broken"],
    });

    const summary = await processMovementArrivals(fake.tx, { now: NOW, tickKey: TICK_KEY });

    assert.equal(summary.ordersArrived, 3);
    // Every order was still visited and every report still written.
    assert.equal(summary.scoutReportsCreated, 2);
    assert.equal(summary.returnLegsCreated, 2);
    assert.equal(summary.ordersCompleted, 1);
    assert.equal(summary.unitsReturned, 5);

    // Only the broken order produced a warning.
    assert.equal(summary.warnings.length, 1);
    assert.match(summary.warnings[0], /could not be marked RESOLVED/);
    assert.match(summary.warnings[0], /scout-broken/);

    // The healthy orders are completely unaffected.
    const healthy = fake.orders.find((order) => order.id === "scout-healthy");
    assert.equal(healthy?.status, "RESOLVED");
    assert.equal(
      fake.orders.some((order) => order.parentOrderId === "scout-healthy"),
      true,
    );

    const returning = fake.orders.find((order) => order.id === "return-healthy");
    assert.equal(returning?.status, "COMPLETED");

    // Even the broken order still got its scouts sent home, so nothing is lost
    // off-map just because its bookkeeping write failed.
    assert.equal(
      fake.orders.some((order) => order.parentOrderId === "scout-broken"),
      true,
    );
  });

  it("still resolves the order and returns the scouts when the report insert fails", async () => {
    const fake = createFakeTransaction({
      orders: [createOutboundScoutOrder()],
      kingdoms: { [TARGET_KINGDOM_ID]: createTargetKingdom() },
      failReportForOrderIds: ["order-scout-1"],
    });

    const summary = await processMovementArrivals(fake.tx, { now: NOW, tickKey: TICK_KEY });

    assert.equal(summary.scoutReportsCreated, 0);
    assert.equal(fake.reports.length, 0);
    // The order must not be left stranded and the scouts must come home.
    assert.equal(summary.returnLegsCreated, 1);

    const outbound = fake.orders.find((order) => order.id === "order-scout-1");
    assert.equal(outbound?.status, "RESOLVED");
    assert.equal(outbound?.resolvedAt?.toISOString(), NOW.toISOString());

    const returnLegs = fake.orders.filter((order) => order.parentOrderId === "order-scout-1");
    assert.equal(returnLegs.length, 1);
    assert.deepEqual(returnLegs[0].unitsJson, [{ unitType: "SCOUTS", quantity: 3 }]);

    assert.equal(summary.warnings.length, 1);
    assert.match(summary.warnings[0], /failed to write its scout report/);
    assert.match(summary.warnings[0], /order-scout-1/);
  });

  it("resolves and returns the scouts when the target kingdom has vanished", async () => {
    const fake = createFakeTransaction({
      orders: [createOutboundScoutOrder()],
      kingdoms: {},
    });

    const summary = await processMovementArrivals(fake.tx, { now: NOW, tickKey: TICK_KEY });

    assert.equal(summary.scoutReportsCreated, 0);
    assert.equal(fake.reports.length, 0);
    assert.equal(summary.returnLegsCreated, 1);
    assert.equal(summary.ordersArrived, 1);

    const outbound = fake.orders.find((order) => order.id === "order-scout-1");
    assert.equal(outbound?.status, "RESOLVED");

    const returnLegs = fake.orders.filter((order) => order.parentOrderId === "order-scout-1");
    assert.equal(returnLegs.length, 1);
    assert.equal(returnLegs[0].status, "IN_TRANSIT");

    assert.equal(summary.warnings.length, 1);
    assert.match(summary.warnings[0], /no longer exists/);
    assert.match(summary.warnings[0], /order-scout-1/);
  });
it("never drives a garrison negative from a bad unit manifest", async () => {
    const fake = createFakeTransaction({
      orders: [
        createReturnLegOrder({
          id: "return-bad-quantities",
          unitsJson: [
            { unitType: "SCOUTS", quantity: 0 },
            { unitType: "SCOUTS", quantity: -4 },
            { unitType: "SCOUTS", quantity: Number.NaN },
            { unitType: "DRAGONS", quantity: 9 },
            null,
            "not-an-entry",
            { unitType: "SCOUTS", quantity: 2.9 },
            { unitType: "CAVALRY", quantity: 6 },
          ],
        }),
      ],
    });

    const summary = await processMovementArrivals(fake.tx, { now: NOW, tickKey: TICK_KEY });

    // Only the two well-formed positive entries survive the manifest parse:
    // 2.9 floors to 2 SCOUTS and 6 CAVALRY.
    assert.equal(summary.unitsReturned, 8);
    assert.equal(summary.ordersCompleted, 1);
    assert.equal(summary.warnings.length, 1);
    assert.match(summary.warnings[0], /unusable unit manifest/);

    for (const stack of fake.unitStacks) {
      assert.equal(stack.quantity >= 0, true);
    }

    const scouts = fake.unitStacks.find((stack) => stack.unitType === "SCOUTS");
    const cavalry = fake.unitStacks.find((stack) => stack.unitType === "CAVALRY");
    assert.equal(scouts?.quantity, 2);
    assert.equal(cavalry?.quantity, 6);
    assert.equal(
      fake.unitStacks.some((stack) => stack.unitType === "DRAGONS"),
      false,
    );

    // A completely unusable manifest still closes the order out rather than
    // leaving it IN_TRANSIT forever.
    const order = fake.orders.find((candidate) => candidate.id === "return-bad-quantities");
    assert.equal(order?.status, "COMPLETED");
  });

  it("completes a return leg with a corrupt non-array manifest and credits nothing", async () => {
    const fake = createFakeTransaction({
      orders: [createReturnLegOrder({ id: "return-corrupt", unitsJson: { scouts: 3 } })],
    });

    const summary = await processMovementArrivals(fake.tx, { now: NOW, tickKey: TICK_KEY });

    assert.equal(summary.unitsReturned, 0);
    assert.equal(summary.ordersCompleted, 1);
    assert.equal(fake.unitStacks.length, 0);
    assert.equal(summary.warnings.length, 1);
    assert.match(summary.warnings[0], /unusable unit manifest/);

    const order = fake.orders.find((candidate) => candidate.id === "return-corrupt");
    assert.equal(order?.status, "COMPLETED");
    assert.equal(order?.returnAt?.toISOString(), NOW.toISOString());
  });

  it("rejects an invalid clock instead of writing wrong arrival timestamps", async () => {
    const fake = createFakeTransaction({
      orders: [createOutboundScoutOrder()],
      kingdoms: { [TARGET_KINGDOM_ID]: createTargetKingdom() },
    });

    await assert.rejects(
      () => processMovementArrivals(fake.tx, { now: new Date("invalid"), tickKey: TICK_KEY }),
      RangeError,
    );
  });

  it("reports exact counters for a mixed tick of scout arrivals and returns", async () => {
    const fake = createFakeTransaction({
      orders: [
        createOutboundScoutOrder({ id: "scout-a", unitsJson: [{ unitType: "SCOUTS", quantity: 2 }] }),
        createOutboundScoutOrder({ id: "scout-b", unitsJson: [{ unitType: "SCOUTS", quantity: 4 }] }),
        createReturnLegOrder({ id: "return-a", unitsJson: [{ unitType: "SCOUTS", quantity: 3 }] }),
        createReturnLegOrder({
          id: "return-b",
          unitsJson: [
            { unitType: "SCOUTS", quantity: 1 },
            { unitType: "CAVALRY", quantity: 10 },
          ],
        }),
      ],
      kingdoms: { [TARGET_KINGDOM_ID]: createTargetKingdom() },
    });

    const summary = await processMovementArrivals(fake.tx, { now: NOW, tickKey: TICK_KEY });

    assert.deepEqual(summary, {
      ordersArrived: 4,
      scoutReportsCreated: 2,
      returnLegsCreated: 2,
      unitsReturned: 14,
      ordersCompleted: 2,
      battlesResolved: 0,
      attackerWins: 0,
      defenderHolds: 0,
      attackerUnitsLost: 0,
      defenderUnitsLost: 0,
      warnings: [],
    });

    assert.equal(fake.reports.length, 2);
    assert.equal(fake.unitStacks.length, 2);
    assert.equal(fake.orders.length, 6);
  });

  it("resolves a winning attack, applies defender losses, and returns the survivors", async () => {
    const fake = createFakeTransaction({
      orders: [createOutboundAttackOrder()],
      kingdoms: { [TARGET_KINGDOM_ID]: createDefenderKingdom([{ unitType: "INFANTRY", quantity: 10 }]) },
      initialUnitStacks: [
        { kingdomId: TARGET_KINGDOM_ID, unitType: "INFANTRY", locationType: "GARRISON", quantity: 10 },
      ],
    });

    const summary = await processMovementArrivals(fake.tx, { now: NOW, tickKey: TICK_KEY });

    // 100 INFANTRY attack (500) beats 10 INFANTRY defense (60).
    assert.equal(summary.ordersArrived, 1);
    assert.equal(summary.battlesResolved, 1);
    assert.equal(summary.attackerWins, 1);
    assert.equal(summary.defenderHolds, 0);
    assert.equal(summary.attackerUnitsLost, 10);
    assert.equal(summary.defenderUnitsLost, 3);
    assert.equal(summary.scoutReportsCreated, 0);
    assert.equal(summary.returnLegsCreated, 1);
    assert.deepEqual(summary.warnings, []);

    const defenderStack = fake.unitStacks.find(
      (stack) => stack.kingdomId === TARGET_KINGDOM_ID && stack.unitType === "INFANTRY",
    );
    assert.equal(defenderStack?.quantity, 7);

    const outbound = fake.orders.find((order) => order.id === "order-attack-1");
    assert.equal(outbound?.status, "RESOLVED");
    assert.equal(outbound?.resolvedAt?.toISOString(), NOW.toISOString());

    const returnLegs = fake.orders.filter((order) => order.parentOrderId === "order-attack-1");
    assert.equal(returnLegs.length, 1);
    assert.equal(returnLegs[0].orderType, "RETURN");
    assert.equal(returnLegs[0].status, "IN_TRANSIT");
    assert.equal(returnLegs[0].travelTicks, 4);
    assert.deepEqual(returnLegs[0].unitsJson, [{ unitType: "INFANTRY", quantity: 90 }]);
    assert.equal(
      returnLegs[0].arrivalAt.toISOString(),
      getMovementReturnAt(NOW, 4).toISOString(),
    );
  });

  it("lets the defender hold on a tie and takes 30 percent from the attacker", async () => {
    const fake = createFakeTransaction({
      orders: [
        createOutboundAttackOrder({
          unitsJson: [{ unitType: "INFANTRY", quantity: 6 }],
        }),
      ],
      kingdoms: { [TARGET_KINGDOM_ID]: createDefenderKingdom([{ unitType: "INFANTRY", quantity: 5 }]) },
      initialUnitStacks: [
        { kingdomId: TARGET_KINGDOM_ID, unitType: "INFANTRY", locationType: "GARRISON", quantity: 5 },
      ],
    });

    const summary = await processMovementArrivals(fake.tx, { now: NOW, tickKey: TICK_KEY });

    // 6 INFANTRY attack (30) ties 5 INFANTRY defense (30): the tie holds.
    assert.equal(summary.battlesResolved, 1);
    assert.equal(summary.attackerWins, 0);
    assert.equal(summary.defenderHolds, 1);
    assert.equal(summary.attackerUnitsLost, 1);
    assert.equal(summary.defenderUnitsLost, 0);

    const defenderStack = fake.unitStacks.find(
      (stack) => stack.kingdomId === TARGET_KINGDOM_ID && stack.unitType === "INFANTRY",
    );
    assert.equal(defenderStack?.quantity, 5);

    const returnLegs = fake.orders.filter((order) => order.parentOrderId === "order-attack-1");
    assert.equal(returnLegs.length, 1);
    assert.deepEqual(returnLegs[0].unitsJson, [{ unitType: "INFANTRY", quantity: 5 }]);
  });

  it("lets a lone attacker take an empty garrison", async () => {
    const fake = createFakeTransaction({
      orders: [
        createOutboundAttackOrder({
          unitsJson: [{ unitType: "INFANTRY", quantity: 10 }],
        }),
      ],
      kingdoms: { [TARGET_KINGDOM_ID]: createDefenderKingdom([]) },
    });

    const summary = await processMovementArrivals(fake.tx, { now: NOW, tickKey: TICK_KEY });

    assert.equal(summary.battlesResolved, 1);
    assert.equal(summary.attackerWins, 1);
    assert.equal(summary.defenderHolds, 0);
    assert.equal(summary.attackerUnitsLost, 1);
    assert.equal(summary.defenderUnitsLost, 0);
    assert.deepEqual(summary.warnings, []);

    const returnLegs = fake.orders.filter((order) => order.parentOrderId === "order-attack-1");
    assert.equal(returnLegs.length, 1);
    assert.deepEqual(returnLegs[0].unitsJson, [{ unitType: "INFANTRY", quantity: 9 }]);
  });

  it("drops a malformed attack manifest before the battle and still resolves", async () => {
    const fake = createFakeTransaction({
      orders: [
        createOutboundAttackOrder({
          unitsJson: [
            { unitType: "INFANTRY", quantity: 10 },
            { unitType: "DRAGONS", quantity: 9 },
            { unitType: "INFANTRY", quantity: -4 },
            null,
          ],
        }),
      ],
      kingdoms: { [TARGET_KINGDOM_ID]: createDefenderKingdom([{ unitType: "INFANTRY", quantity: 1 }]) },
      initialUnitStacks: [
        { kingdomId: TARGET_KINGDOM_ID, unitType: "INFANTRY", locationType: "GARRISON", quantity: 1 },
      ],
    });

    const summary = await processMovementArrivals(fake.tx, { now: NOW, tickKey: TICK_KEY });

    // Only the 10 INFANTRY fight: 50 attack beats 6 defense.
    assert.equal(summary.battlesResolved, 1);
    assert.equal(summary.attackerWins, 1);
    assert.equal(summary.attackerUnitsLost, 1);
    assert.equal(summary.warnings.length, 1);
    assert.match(summary.warnings[0], /unusable unit manifest/);
    assert.match(summary.warnings[0], /order-attack-1/);

    const outbound = fake.orders.find((order) => order.id === "order-attack-1");
    assert.equal(outbound?.status, "RESOLVED");

    const returnLegs = fake.orders.filter((order) => order.parentOrderId === "order-attack-1");
    assert.equal(returnLegs.length, 1);
    assert.deepEqual(returnLegs[0].unitsJson, [{ unitType: "INFANTRY", quantity: 9 }]);
  });

  it("resolves and returns the full army when the attack target has vanished", async () => {
    const fake = createFakeTransaction({
      orders: [createOutboundAttackOrder()],
      kingdoms: {},
    });

    const summary = await processMovementArrivals(fake.tx, { now: NOW, tickKey: TICK_KEY });

    assert.equal(summary.ordersArrived, 1);
    assert.equal(summary.battlesResolved, 0);
    assert.equal(summary.attackerWins, 0);
    assert.equal(summary.defenderHolds, 0);
    assert.equal(summary.returnLegsCreated, 1);

    const outbound = fake.orders.find((order) => order.id === "order-attack-1");
    assert.equal(outbound?.status, "RESOLVED");

    const returnLegs = fake.orders.filter((order) => order.parentOrderId === "order-attack-1");
    assert.equal(returnLegs.length, 1);
    assert.deepEqual(returnLegs[0].unitsJson, [{ unitType: "INFANTRY", quantity: 100 }]);

    assert.equal(summary.warnings.length, 1);
    assert.match(summary.warnings[0], /no longer exists/);
    assert.match(summary.warnings[0], /order-attack-1/);
  });

  it("is idempotent across a second pass over a resolved attack", async () => {
    const fake = createFakeTransaction({
      orders: [createOutboundAttackOrder()],
      kingdoms: { [TARGET_KINGDOM_ID]: createDefenderKingdom([{ unitType: "INFANTRY", quantity: 10 }]) },
      initialUnitStacks: [
        { kingdomId: TARGET_KINGDOM_ID, unitType: "INFANTRY", locationType: "GARRISON", quantity: 10 },
      ],
    });

    const first = await processMovementArrivals(fake.tx, { now: NOW, tickKey: TICK_KEY });
    assert.equal(first.battlesResolved, 1);
    const defenderAfterFirst = fake.unitStacks.find(
      (stack) => stack.kingdomId === TARGET_KINGDOM_ID,
    )?.quantity;
    const ordersAfterFirst = fake.orders.length;

    const second = await processMovementArrivals(fake.tx, { now: NOW, tickKey: TICK_KEY });

    assert.deepEqual(second, {
      ordersArrived: 0,
      scoutReportsCreated: 0,
      returnLegsCreated: 0,
      unitsReturned: 0,
      ordersCompleted: 0,
      battlesResolved: 0,
      attackerWins: 0,
      defenderHolds: 0,
      attackerUnitsLost: 0,
      defenderUnitsLost: 0,
      warnings: [],
    });
    assert.equal(fake.orders.length, ordersAfterFirst);
    assert.equal(
      fake.unitStacks.find((stack) => stack.kingdomId === TARGET_KINGDOM_ID)?.quantity,
      defenderAfterFirst,
    );
  });

  it("isolates one failing attack order without blocking the others", async () => {
    const fake = createFakeTransaction({
      orders: [
        createOutboundAttackOrder({ id: "attack-broken" }),
        createOutboundAttackOrder({
          id: "attack-healthy",
          unitsJson: [{ unitType: "INFANTRY", quantity: 50 }],
        }),
      ],
      kingdoms: {
        [TARGET_KINGDOM_ID]: createDefenderKingdom([{ unitType: "INFANTRY", quantity: 10 }]),
      },
      initialUnitStacks: [
        { kingdomId: TARGET_KINGDOM_ID, unitType: "INFANTRY", locationType: "GARRISON", quantity: 10 },
      ],
      failingOrderIds: ["attack-broken"],
    });

    const summary = await processMovementArrivals(fake.tx, { now: NOW, tickKey: TICK_KEY });

    assert.equal(summary.ordersArrived, 2);
    assert.equal(summary.battlesResolved, 2);
    assert.equal(summary.returnLegsCreated, 2);
    assert.equal(summary.warnings.length, 1);
    assert.match(summary.warnings[0], /could not be marked RESOLVED/);
    assert.match(summary.warnings[0], /attack-broken/);

    const healthy = fake.orders.find((order) => order.id === "attack-healthy");
    assert.equal(healthy?.status, "RESOLVED");
    assert.equal(
      fake.orders.some((order) => order.parentOrderId === "attack-healthy"),
      true,
    );

    // Even the broken order still got its survivors sent home.
    assert.equal(
      fake.orders.some((order) => order.parentOrderId === "attack-broken"),
      true,
    );
  });

  it("never drives a defender garrison negative from a small battle", async () => {
    const fake = createFakeTransaction({
      orders: [
        createOutboundAttackOrder({
          unitsJson: [{ unitType: "INFANTRY", quantity: 1 }],
        }),
      ],
      kingdoms: { [TARGET_KINGDOM_ID]: createDefenderKingdom([{ unitType: "INFANTRY", quantity: 1 }]) },
      initialUnitStacks: [
        { kingdomId: TARGET_KINGDOM_ID, unitType: "INFANTRY", locationType: "GARRISON", quantity: 1 },
      ],
    });

    const summary = await processMovementArrivals(fake.tx, { now: NOW, tickKey: TICK_KEY });

    assert.equal(summary.battlesResolved, 1);
    assert.equal(summary.defenderHolds, 1);

    for (const stack of fake.unitStacks) {
      assert.equal(stack.quantity >= 0, true);
    }

    const defenderStack = fake.unitStacks.find(
      (stack) => stack.kingdomId === TARGET_KINGDOM_ID,
    );
    assert.equal(defenderStack?.quantity, 1);

    const returnLegs = fake.orders.filter((order) => order.parentOrderId === "order-attack-1");
    assert.equal(returnLegs.length, 1);

    for (const entry of returnLegs[0].unitsJson as { quantity: number }[]) {
      assert.equal(entry.quantity >= 0, true);
    }
  });

  it("completes returning legs before resolving an attack in the same tick", async () => {
    const fake = createFakeTransaction({
      orders: [
        createOutboundAttackOrder(),
        createReturnLegOrder({ id: "order-return-earlier", parentOrderId: "order-scout-earlier" }),
      ],
      kingdoms: { [TARGET_KINGDOM_ID]: createDefenderKingdom([{ unitType: "INFANTRY", quantity: 10 }]) },
      initialUnitStacks: [
        { kingdomId: TARGET_KINGDOM_ID, unitType: "INFANTRY", locationType: "GARRISON", quantity: 10 },
      ],
    });

    const summary = await processMovementArrivals(fake.tx, { now: NOW, tickKey: TICK_KEY });

    assert.equal(summary.ordersArrived, 2);
    assert.equal(summary.ordersCompleted, 1);
    assert.equal(summary.battlesResolved, 1);
    assert.equal(summary.returnLegsCreated, 1);

    const completedIndex = fake.callLog.indexOf("update:order-return-earlier:COMPLETED");
    const resolvedIndex = fake.callLog.indexOf("update:order-attack-1:RESOLVED");
    assert.equal(completedIndex >= 0, true);
    assert.equal(resolvedIndex >= 0, true);
    assert.equal(completedIndex < resolvedIndex, true);
  });
});