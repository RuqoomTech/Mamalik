/**
 * Movement arrival resolution for the tick worker (S5-004 through S5-006).
 *
 * Three ordered passes run inside the caller's tick transaction:
 *
 *   PASS 1 - RETURN legs that reached their `arrivalAt` put their units back
 *            into the source kingdom garrison and close out.
 *   PASS 2 - SCOUT orders that reached their `arrivalAt` write the scout report
 *            on the SOURCE kingdom, resolve the outbound order, and spawn the
 *            RETURN leg that carries the scouts home.
 *   PASS 3 - ATTACK orders that reached their `arrivalAt` resolve the S5-006
 *            basic battle against the defender garrison, apply defender
 *            losses, resolve the outbound order, and spawn the RETURN leg that
 *            carries the surviving attackers home.
 *
 * ORDERING IS LOAD-BEARING: the RETURN pass runs FIRST so a unit coming home
 * this tick is back in its garrison before any same-tick bookkeeping observes
 * kingdom army totals (food consumption, next-tick scouting supply).
 *
 * This module never throws for a single bad row. One poisoned movement order
 * must not abort the whole tick and take every other arrival down with it, so
 * every order is processed inside its own try/catch and failures become
 * `warnings` on the returned summary.
 */

import {
  resolveBasicBattle,
  type BattleArmyEntry,
} from "../../../packages/game/src/movement/battle-formula";
import {
  approximateScoutObservation,
  buildScoutReportBody,
  type ScoutObservationInput,
} from "../../../packages/game/src/movement/scout-report";
import {
  getMovementReturnAt,
  isMovementUnitType,
  type MovementUnitType,
} from "../../../packages/game/src/movement/travel-time";
import { toErrorMessage } from "./tick-log";

export type MovementArrivalSummary = {
  /** Due orders picked up this tick, across all passes. */
  ordersArrived: number;
  scoutReportsCreated: number;
  returnLegsCreated: number;
  /** Units credited back into garrisons this tick, summed over all manifest entries. */
  unitsReturned: number;
  /** RETURN legs closed out as COMPLETED this tick. */
  ordersCompleted: number;
  /** ATTACK orders that fought a battle this tick (vanished targets excluded). */
  battlesResolved: number;
  attackerWins: number;
  defenderHolds: number;
  attackerUnitsLost: number;
  defenderUnitsLost: number;
  warnings: string[];
};

/** A unit type plus count, as stored in `MovementOrder.unitsJson`. */
export type MovementUnitManifestEntry = {
  unitType: MovementUnitType;
  quantity: number;
};

/** The columns an arriving order needs, from any pass. */
export type ArrivingMovementOrder = {
  id: string;
  sourceKingdomId: string;
  targetKingdomId: string;
  unitsJson: unknown;
  distanceM: number;
  travelTicks: number;
  departureAt: Date;
  arrivalAt: Date;
};

/** Exact enemy state the arrival pass reads before banding it down. */
export type ScoutTargetObservationState = {
  name: string;
  usableLandM2: number;
  resourceStockpile: { food: number } | null;
  unitStacks: { quantity: number }[];
  buildings: { type: string; level: number }[];
  districts: { allocatedLandM2: number }[];
};

/** Defender garrison state for an ATTACK arrival (S5-006, no buildings). */
export type AttackDefenderGarrisonState = {
  unitStacks: { unitType: string; quantity: number }[];
};

const MOVEMENT_ARRIVAL_ORDER_SELECT = {
  id: true,
  sourceKingdomId: true,
  targetKingdomId: true,
  unitsJson: true,
  distanceM: true,
  travelTicks: true,
  departureAt: true,
  arrivalAt: true,
} as const;

const SCOUT_TARGET_SELECT = {
  name: true,
  usableLandM2: true,
  resourceStockpile: {
    select: {
      food: true,
    },
  },
  unitStacks: {
    where: {
      locationType: "GARRISON",
    },
    select: {
      quantity: true,
    },
  },
  buildings: {
    where: {
      type: {
        in: ["WALL", "WATCHTOWER"],
      },
    },
    select: {
      type: true,
      level: true,
    },
  },
  districts: {
    where: {
      type: "DEFENSIVE",
    },
    select: {
      allocatedLandM2: true,
    },
  },
} as const;

const ATTACK_DEFENDER_SELECT = {
  unitStacks: {
    where: {
      locationType: "GARRISON",
    },
    select: {
      unitType: true,
      quantity: true,
    },
  },
} as const;

type DueMovementOrderWhere = {
  orderType: "SCOUT" | "RETURN" | "ATTACK";
  status: "IN_TRANSIT";
  arrivalAt: { lte: Date };
};

/**
 * Mirror of the generated `MovementOrderStatus` enum, declared here as a literal
 * union so the worker keeps its existing "no direct Prisma enum import" style
 * while still narrowing statuses to the values the database actually accepts.
 */
type MovementOrderStatusValue =
  | "IN_TRANSIT"
  | "ARRIVED"
  | "RESOLVED"
  | "RETURNING"
  | "COMPLETED"
  | "CANCELLED";
/**
 * The slice of the tick transaction this module uses.
 *
 * Declared structurally rather than as the generated Prisma transaction client
 * so the arrival logic can be exercised against a hand-rolled fake in tests
 * without a live database.
 */
export type MovementArrivalTransaction = {
  movementOrder: {
    findMany(args: {
      where: DueMovementOrderWhere;
      select: typeof MOVEMENT_ARRIVAL_ORDER_SELECT;
      orderBy: { arrivalAt: "asc" };
    }): Promise<ArrivingMovementOrder[]>;
    findFirst(args: {
      where: { parentOrderId: string };
      select: { id: true };
    }): Promise<{ id: string } | null>;
    update(args: {
      where: { id: string };
      data: { status: MovementOrderStatusValue; resolvedAt?: Date; returnAt?: Date };
    }): Promise<unknown>;
    create(args: {
      data: {
        sourceKingdomId: string;
        targetKingdomId: string;
        orderType: "RETURN";
        status: "IN_TRANSIT";
        unitsJson: unknown;
        distanceM: number;
        travelTicks: number;
        departureAt: Date;
        arrivalAt: Date;
        parentOrderId: string;
      };
    }): Promise<unknown>;
  };
  kingdom: {
    findUnique(args: {
      where: { id: string };
      select: typeof SCOUT_TARGET_SELECT | typeof ATTACK_DEFENDER_SELECT;
    }): Promise<ScoutTargetObservationState | AttackDefenderGarrisonState | null>;
  };
  unitStack: {
    upsert(args: {
      where: {
        kingdomId_unitType_locationType: {
          kingdomId: string;
          unitType: MovementUnitType;
          locationType: "GARRISON";
        };
      };
      create: {
        kingdomId: string;
        unitType: MovementUnitType;
        quantity: number;
        locationType: "GARRISON";
      };
      update: { quantity: { increment: number } };
    }): Promise<unknown>;
    update(args: {
      where: {
        kingdomId_unitType_locationType: {
          kingdomId: string;
          unitType: MovementUnitType;
          locationType: "GARRISON";
        };
      };
      data: { quantity: number };
    }): Promise<unknown>;
  };
  report: {
    create(args: {
      data: {
        kingdomId: string;
        type: "SCOUT";
        title: string;
        bodyJson: Record<string, string | number>;
      };
    }): Promise<unknown>;
  };
};
export async function processMovementArrivals(
  tx: MovementArrivalTransaction,
  options: { now: Date; tickKey: string },
): Promise<MovementArrivalSummary> {
  const now = options.now;
  const tickKey = options.tickKey;

  // A bad clock is a caller bug, not a data problem, so it throws instead of
  // silently writing wrong arrival timestamps into every order it touches.
  if (!(now instanceof Date) || !Number.isFinite(now.getTime())) {
    throw new RangeError("Invalid `now` date for movement arrival resolution.");
  }

  const summary: MovementArrivalSummary = {
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
  };

  // PASS 1 first: units already home this tick must be back in the garrison
  // before PASS 2 (and before the rest of the tick) reads any army total.
  await processReturningOrders(tx, now, tickKey, summary);
  await processArrivingScoutOrders(tx, now, tickKey, summary);
  await processArrivingAttackOrders(tx, now, tickKey, summary);

  return summary;
}
/**
 * PASS 1 - RETURN legs reaching their destination.
 *
 * The units were already decremented from the source garrison when the outbound
 * order was dispatched, so arrival is purely a credit back plus closing the leg.
 */
async function processReturningOrders(
  tx: MovementArrivalTransaction,
  now: Date,
  tickKey: string,
  summary: MovementArrivalSummary,
): Promise<void> {
  const returningOrders = await tx.movementOrder.findMany({
    where: {
      orderType: "RETURN",
      status: "IN_TRANSIT",
      arrivalAt: { lte: now },
    },
    select: MOVEMENT_ARRIVAL_ORDER_SELECT,
    orderBy: { arrivalAt: "asc" },
  });

  for (const order of returningOrders) {
    summary.ordersArrived += 1;

    // SAFETY: per-order isolation. An uncaught throw here would roll back the
    // entire tick transaction and lose every other arrival with it, so a bad
    // order degrades to a warning instead.
    try {
      const { manifest, invalidEntryCount } = parseUnitManifest(order.unitsJson);

      if (invalidEntryCount > 0) {
        summary.warnings.push(
          `Movement order ${order.id} (RETURN) had ${invalidEntryCount} unusable unit manifest entr${invalidEntryCount === 1 ? "y" : "ies"}; those units were not credited back. (tick ${tickKey})`,
        );
      }

      let returnedUnits = 0;

      for (const entry of manifest) {
        // Quantities are normalized to positive integers by the manifest parse,
        // so this increment can never drive a garrison negative.
        await tx.unitStack.upsert({
          where: {
            kingdomId_unitType_locationType: {
              kingdomId: order.sourceKingdomId,
              unitType: entry.unitType,
              locationType: "GARRISON",
            },
          },
          create: {
            kingdomId: order.sourceKingdomId,
            unitType: entry.unitType,
            quantity: entry.quantity,
            locationType: "GARRISON",
          },
          update: {
            quantity: { increment: entry.quantity },
          },
        });

        returnedUnits += entry.quantity;
      }

      summary.unitsReturned += returnedUnits;

      // SAFETY: never leave an order in IN_TRANSIT past its arrivalAt. Even a
      // half-applied return is closed out rather than retried, because a retry
      // would double-credit the entries that already succeeded. Closing costs
      // at most the remaining units and surfaces the loss in the tick warnings.
      await tx.movementOrder.update({
        where: { id: order.id },
        data: {
          status: "COMPLETED",
          returnAt: now,
        },
      });

      summary.ordersCompleted += 1;
    } catch (error) {
      summary.warnings.push(
        `Movement order ${order.id} (RETURN) failed to return its units: ${toErrorMessage(error)} (tick ${tickKey})`,
      );
    }
  }
}
/**
 * PASS 2 - SCOUT orders reaching their target.
 *
 * Report first, then resolve, then spawn the return leg: if report creation
 * fails the order is still resolved and the scouts still come home, because
 * losing the scouts is far worse than losing one report.
 */
async function processArrivingScoutOrders(
  tx: MovementArrivalTransaction,
  now: Date,
  tickKey: string,
  summary: MovementArrivalSummary,
): Promise<void> {
  const arrivingScoutOrders = await tx.movementOrder.findMany({
    where: {
      orderType: "SCOUT",
      status: "IN_TRANSIT",
      arrivalAt: { lte: now },
    },
    select: MOVEMENT_ARRIVAL_ORDER_SELECT,
    orderBy: { arrivalAt: "asc" },
  });

  for (const order of arrivingScoutOrders) {
    summary.ordersArrived += 1;

    // SAFETY: per-order isolation, same reasoning as the RETURN pass.
    try {
      await createScoutReportForOrder(tx, order, now, tickKey, summary);
    } catch (error) {
      summary.warnings.push(
        `Movement order ${order.id} (SCOUT) failed to write its scout report: ${toErrorMessage(error)} (tick ${tickKey})`,
      );
    }

    // SAFETY: this block runs even when the report above failed. Resolving and
    // sending the scouts home is what guarantees no order is stranded
    // IN_TRANSIT past its arrivalAt and no scouts are lost off-map.
    try {
      await tx.movementOrder.update({
        where: { id: order.id },
        data: {
          status: "RESOLVED",
          resolvedAt: now,
        },
      });
    } catch (error) {
      summary.warnings.push(
        `Movement order ${order.id} (SCOUT) could not be marked RESOLVED: ${toErrorMessage(error)} (tick ${tickKey})`,
      );
    }

    try {
      await createReturnLegForOrder(tx, order, now, tickKey, summary);
    } catch (error) {
      summary.warnings.push(
        `Movement order ${order.id} (SCOUT) failed to create its RETURN leg: ${toErrorMessage(error)} (tick ${tickKey})`,
      );
    }
  }
}
/**
 * PASS 3 - ATTACK orders reaching their target (S5-006).
 *
 * The S5-006 basic battle reads only raw unit power: no WALL, WATCHTOWER,
 * district, or tech multipliers (S5-007), no siege rules (S5-008), no land
 * capture (S5-009), and no battle report (S5-010). Defender losses are applied
 * as absolute `unitStack.update` writes clamped at zero, the outbound order
 * is marked RESOLVED, and the surviving attackers get a RETURN leg home.
 */
async function processArrivingAttackOrders(
  tx: MovementArrivalTransaction,
  now: Date,
  tickKey: string,
  summary: MovementArrivalSummary,
): Promise<void> {
  const arrivingAttackOrders = await tx.movementOrder.findMany({
    where: {
      orderType: "ATTACK",
      status: "IN_TRANSIT",
      arrivalAt: { lte: now },
    },
    select: MOVEMENT_ARRIVAL_ORDER_SELECT,
    orderBy: { arrivalAt: "asc" },
  });

  for (const order of arrivingAttackOrders) {
    summary.ordersArrived += 1;

    // SAFETY: per-order isolation, same reasoning as the other passes.
    try {
      await resolveAttackOrder(tx, order, now, tickKey, summary);
    } catch (error) {
      summary.warnings.push(
        `Movement order ${order.id} (ATTACK) failed to resolve its battle: ${toErrorMessage(error)} (tick ${tickKey})`,
      );
    }
  }
}

async function resolveAttackOrder(
  tx: MovementArrivalTransaction,
  order: ArrivingMovementOrder,
  now: Date,
  tickKey: string,
  summary: MovementArrivalSummary,
): Promise<void> {
  const { manifest, invalidEntryCount } = parseUnitManifest(order.unitsJson);

  if (invalidEntryCount > 0) {
    summary.warnings.push(
      `Movement order ${order.id} (ATTACK) had ${invalidEntryCount} unusable unit manifest entr${invalidEntryCount === 1 ? "y" : "ies"}; those units were dropped before the battle. (tick ${tickKey})`,
    );
  }

  const defender = (await tx.kingdom.findUnique({
    where: { id: order.targetKingdomId },
    select: ATTACK_DEFENDER_SELECT,
  })) as AttackDefenderGarrisonState | null;

  if (!defender) {
    // SAFETY: a vanished target must not strand the attackers. No battle is
    // fought, so no battle counters move, but the order still resolves and
    // the full surviving manifest still comes home.
    summary.warnings.push(
      `Movement order ${order.id} (ATTACK) target kingdom ${order.targetKingdomId} no longer exists; no battle was fought and the full army was returned instead. (tick ${tickKey})`,
    );

    try {
      await tx.movementOrder.update({
        where: { id: order.id },
        data: {
          status: "RESOLVED",
          resolvedAt: now,
        },
      });
    } catch (error) {
      summary.warnings.push(
        `Movement order ${order.id} (ATTACK) could not be marked RESOLVED: ${toErrorMessage(error)} (tick ${tickKey})`,
      );
    }

    try {
      await createReturnLegForOrder(tx, order, now, tickKey, summary, {
        unitsJson: manifest,
        orderLabel: "ATTACK",
      });
    } catch (error) {
      summary.warnings.push(
        `Movement order ${order.id} (ATTACK) failed to create its RETURN leg: ${toErrorMessage(error)} (tick ${tickKey})`,
      );
    }

    return;
  }

  const defenderEntries = toBattleEntries(defender.unitStacks);
  const battle = resolveBasicBattle({ attackers: manifest, defenders: defenderEntries });

  // Apply defender losses as absolute writes clamped at zero. Each stack gets
  // its own try/catch so one missing row cannot skip the remaining types and
  // cannot skip resolving the order or sending the survivors home.
  const defenderQuantityByType = aggregateManifestQuantities(defenderEntries);

  for (const loss of battle.defenderLosses) {
    if (loss.quantity <= 0) {
      continue;
    }

    if (!isMovementUnitType(loss.unitType)) {
      continue;
    }

    const currentQuantity = defenderQuantityByType.get(loss.unitType) ?? 0;
    const nextQuantity = Math.max(0, currentQuantity - loss.quantity);

    try {
      await tx.unitStack.update({
        where: {
          kingdomId_unitType_locationType: {
            kingdomId: order.targetKingdomId,
            unitType: loss.unitType,
            locationType: "GARRISON",
          },
        },
        data: { quantity: nextQuantity },
      });
    } catch (error) {
      summary.warnings.push(
        `Movement order ${order.id} (ATTACK) could not apply ${loss.quantity} ${loss.unitType} losses to the defender: ${toErrorMessage(error)} (tick ${tickKey})`,
      );
    }
  }

  summary.battlesResolved += 1;

  if (battle.winner === "ATTACKER") {
    summary.attackerWins += 1;
  } else {
    summary.defenderHolds += 1;
  }

  summary.attackerUnitsLost += battle.attackerUnitsLost;
  summary.defenderUnitsLost += battle.defenderUnitsLost;

  try {
    await tx.movementOrder.update({
      where: { id: order.id },
      data: {
        status: "RESOLVED",
        resolvedAt: now,
      },
    });
  } catch (error) {
    summary.warnings.push(
      `Movement order ${order.id} (ATTACK) could not be marked RESOLVED: ${toErrorMessage(error)} (tick ${tickKey})`,
    );
  }

  try {
    await createReturnLegForOrder(tx, order, now, tickKey, summary, {
      unitsJson: battle.attackerSurvivors,
      orderLabel: "ATTACK",
    });
  } catch (error) {
    summary.warnings.push(
      `Movement order ${order.id} (ATTACK) failed to create its RETURN leg: ${toErrorMessage(error)} (tick ${tickKey})`,
    );
  }
}
async function createScoutReportForOrder(
  tx: MovementArrivalTransaction,
  order: ArrivingMovementOrder,
  now: Date,
  tickKey: string,
  summary: MovementArrivalSummary,
): Promise<void> {
  const target = (await tx.kingdom.findUnique({
    where: { id: order.targetKingdomId },
    select: SCOUT_TARGET_SELECT,
  })) as ScoutTargetObservationState | null;

  if (!target) {
    // SAFETY: a vanished target must not strand the scouts. The report is
    // skipped, but the caller still resolves the order and sends them home.
    summary.warnings.push(
      `Movement order ${order.id} (SCOUT) target kingdom ${order.targetKingdomId} no longer exists; no report was written and the scouts were returned instead. (tick ${tickKey})`,
    );
    return;
  }

  const approximation = approximateScoutObservation(toScoutObservationInput(target));
  const bodyJson = buildScoutReportBody({
    approximation,
    movementOrderId: order.id,
    targetKingdomId: order.targetKingdomId,
    arrivedAt: now,
    travelTicks: order.travelTicks,
  });

  // The report lands on the SOURCE kingdom: that is the kingdom that paid for
  // the scouts and the only one allowed to read the result.
  await tx.report.create({
    data: {
      kingdomId: order.sourceKingdomId,
      type: "SCOUT",
      title: `Scout report: ${toDisplayName(target.name)}`,
      bodyJson,
    },
  });

  summary.scoutReportsCreated += 1;
}
async function createReturnLegForOrder(
  tx: MovementArrivalTransaction,
  order: ArrivingMovementOrder,
  now: Date,
  tickKey: string,
  summary: MovementArrivalSummary,
  options?: { unitsJson?: unknown; orderLabel?: "SCOUT" | "ATTACK" },
): Promise<void> {
  const orderLabel = options?.orderLabel ?? "SCOUT";
  const unitsJson = options?.unitsJson ?? order.unitsJson;

  // SAFETY: `parentOrderId` is UNIQUE, so return-leg creation is single-shot by
  // schema. The inbound query filters IN_TRANSIT and the outbound order is
  // resolved in this same transaction, but if the resolve above failed the
  // order would be re-read next tick - this guard is what makes that re-run a
  // no-op instead of a unique-constraint crash.
  const existingReturnLeg = await tx.movementOrder.findFirst({
    where: { parentOrderId: order.id },
    select: { id: true },
  });

  if (existingReturnLeg) {
    summary.warnings.push(
      `Movement order ${order.id} (${orderLabel}) already has RETURN leg ${existingReturnLeg.id}; no second return leg was created. (tick ${tickKey})`,
    );
    return;
  }

  // `travelTicks` is copied from the OUTBOUND order rather than recomputed: the
  // outbound timing was derived from the dispatch clock and its unit manifest,
  // and re-deriving it here from a different clock could silently disagree.
  await tx.movementOrder.create({
    data: {
      sourceKingdomId: order.sourceKingdomId,
      targetKingdomId: order.targetKingdomId,
      orderType: "RETURN",
      status: "IN_TRANSIT",
      unitsJson,
      distanceM: order.distanceM,
      travelTicks: order.travelTicks,
      departureAt: now,
      arrivalAt: getMovementReturnAt(now, order.travelTicks),
      parentOrderId: order.id,
    },
  });

  summary.returnLegsCreated += 1;
}
function toScoutObservationInput(kingdom: ScoutTargetObservationState): ScoutObservationInput {
  return {
    kingdomName: kingdom.name,
    totalGarrisonUnits: kingdom.unitStacks.reduce(
      (total, unitStack) => total + toNonNegativeInteger(unitStack.quantity),
      0,
    ),
    highestWallLevel: highestBuildingLevel(kingdom.buildings, "WALL"),
    highestWatchtowerLevel: highestBuildingLevel(kingdom.buildings, "WATCHTOWER"),
    defensiveDistrictLandM2: kingdom.districts.reduce(
      (total, district) => total + toNonNegativeInteger(district.allocatedLandM2),
      0,
    ),
    foodStockpile: kingdom.resourceStockpile
      ? toNonNegativeInteger(kingdom.resourceStockpile.food)
      : 0,
    usableLandM2: toNonNegativeInteger(kingdom.usableLandM2),
  };
}

function highestBuildingLevel(buildings: { type: string; level: number }[], type: string): number {
  return buildings.reduce((highest, building) => {
    if (building.type !== type) {
      return highest;
    }

    return Math.max(highest, toNonNegativeInteger(building.level));
  }, 0);
}

/**
 * Convert defender garrison rows into battle entries.
 *
 * The battle formula already drops hostile rows, so this helper only needs to
 * pass the stored rows through without inventing units.
 */
function toBattleEntries(
  unitStacks: AttackDefenderGarrisonState["unitStacks"] | null | undefined,
): BattleArmyEntry[] {
  if (!Array.isArray(unitStacks)) {
    return [];
  }

  return unitStacks.map((stack) => ({
    unitType: typeof stack?.unitType === "string" ? stack.unitType : "",
    quantity: typeof stack?.quantity === "number" ? stack.quantity : 0,
  }));
}

function aggregateManifestQuantities(entries: readonly BattleArmyEntry[]): Map<string, number> {
  const totals = new Map<string, number>();

  for (const entry of entries) {
    if (typeof entry !== "object" || entry === null) {
      continue;
    }

    if (typeof entry.unitType !== "string" || !isMovementUnitType(entry.unitType)) {
      continue;
    }

    const quantity = toNonNegativeInteger(entry.quantity);

    if (quantity <= 0) {
      continue;
    }

    totals.set(entry.unitType, (totals.get(entry.unitType) ?? 0) + quantity);
  }

  return totals;
}

/**
 * Parse `MovementOrder.unitsJson` into a manifest that can only ever credit
 * positive whole units of a known unit type.
 *
 * Zero, negative, fractional, NaN, and unknown-unit-type entries are dropped and
 * counted instead of being written through, which is what guarantees a bad
 * manifest can never decrement - or decrement-by-proxy - a garrison below zero.
 */
function parseUnitManifest(value: unknown): {
  manifest: MovementUnitManifestEntry[];
  invalidEntryCount: number;
} {
  if (!Array.isArray(value)) {
    return { manifest: [], invalidEntryCount: 1 };
  }

  const manifest: MovementUnitManifestEntry[] = [];
  let invalidEntryCount = 0;

  for (const rawEntry of value) {
    if (typeof rawEntry !== "object" || rawEntry === null) {
      invalidEntryCount += 1;
      continue;
    }

    const entry = rawEntry as Record<string, unknown>;

    if (typeof entry.unitType !== "string" || !isMovementUnitType(entry.unitType)) {
      invalidEntryCount += 1;
      continue;
    }

    const quantity = toNonNegativeInteger(entry.quantity);

    if (quantity <= 0) {
      invalidEntryCount += 1;
      continue;
    }

    manifest.push({ unitType: entry.unitType, quantity });
  }

  return { manifest, invalidEntryCount };
}

function toNonNegativeInteger(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return 0;
  }

  return Math.floor(value);
}

function toDisplayName(name: string): string {
  return typeof name === "string" && name.trim().length > 0 ? name.trim() : "unknown kingdom";
}
