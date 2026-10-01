import {
  calculateMovementDistanceMeters,
  calculateTravelTime,
  getMovementArrivalAt,
  isKingdomUnderBeginnerProtection,
  SCOUT_ORDER_MIN_SCOUTS,
  SCOUT_ORDER_UNIT_TYPE,
  validateScoutOrder,
  type ScoutOrderValidationFailureReason,
} from "@mamalik/game";
import { getPrismaClient } from "@/lib/db/client";

export type ScoutTargetOption = {
  kingdomId: string;
  kingdomName: string;
  distanceM: number;
  travelTicks: number;
  /** ISO-8601 */
  arrivalAt: string;
  isProtected: boolean;
  /** ISO-8601 */
  protectionEndsAt: string | null;
  canTarget: boolean;
  disabledReason: ScoutOrderValidationFailureReason | null;
};

/** How many scout targets the dropdown is ever allowed to render. */
export const SCOUT_TARGET_OPTION_LIMIT = 10;

/**
 * Fetch comfortably more than the limit so the deterministic `createdAt` order
 * still yields a full page once the caller's own kingdom is excluded.
 */
const SCOUT_TARGET_OPTION_FETCH_LIMIT = SCOUT_TARGET_OPTION_LIMIT * 5;

type ScoutTargetSourceKingdomRecord = {
  id: string;
  centerLat: number;
  centerLng: number;
  unitStacks: Array<{
    quantity: number;
  }>;
};

type ScoutTargetKingdomRecord = {
  id: string;
  name: string;
  centerLat: number;
  centerLng: number;
  protectionEndsAt: Date | null;
};

type ScoutTargetDb = {
  kingdom: {
    findUnique(args: unknown): Promise<ScoutTargetSourceKingdomRecord | null>;
    findMany(args: unknown): Promise<ScoutTargetKingdomRecord[]>;
  };
};

export type ScoutTargetOptionDependencies = {
  db?: ScoutTargetDb;
  now?: () => Date;
};

/**
 * Bounded read model that powers the scout target dropdown.
 *
 * Each option runs the SAME shared `validateScoutOrder` the mutation runs, so a
 * target can never be shown as selectable when `createScoutOrderForUser` would
 * reject it. Options are evaluated at `SCOUT_ORDER_MIN_SCOUTS` because that is
 * the smallest dispatch the UI can produce; the mutation re-validates against
 * the scout count actually chosen, so a larger request is still checked there.
 */
export async function getScoutTargetOptionsForUser(
  userId: string,
  dependencies: ScoutTargetOptionDependencies = {},
): Promise<ScoutTargetOption[]> {
  const db = dependencies.db ?? (getPrismaClient() as unknown as ScoutTargetDb);
  const now = dependencies.now?.() ?? new Date();

  const sourceKingdom = await db.kingdom.findUnique({
    where: {
      userId,
    },
    select: {
      id: true,
      centerLat: true,
      centerLng: true,
      unitStacks: {
        where: {
          unitType: SCOUT_ORDER_UNIT_TYPE,
          locationType: "GARRISON",
        },
        select: {
          quantity: true,
        },
        take: 1,
      },
    },
  });

  if (!sourceKingdom) {
    return [];
  }

  const garrisonScouts = sourceKingdom.unitStacks[0]?.quantity ?? 0;

  const targets = await db.kingdom.findMany({
    where: {
      // Never offer the caller's own kingdom as a scout target.
      id: {
        not: sourceKingdom.id,
      },
    },
    orderBy: {
      createdAt: "asc",
    },
    take: SCOUT_TARGET_OPTION_FETCH_LIMIT,
    select: {
      id: true,
      name: true,
      centerLat: true,
      centerLng: true,
      protectionEndsAt: true,
    },
  });

  return targets
    .map((target) => shapeScoutTargetOption({
      sourceKingdom,
      target,
      garrisonScouts,
      now,
    }))
    .slice(0, SCOUT_TARGET_OPTION_LIMIT);
}

function shapeScoutTargetOption(input: {
  sourceKingdom: ScoutTargetSourceKingdomRecord;
  target: ScoutTargetKingdomRecord;
  garrisonScouts: number;
  now: Date;
}): ScoutTargetOption {
  const distanceM = calculateMovementDistanceMeters(
    {
      lat: input.sourceKingdom.centerLat,
      lng: input.sourceKingdom.centerLng,
    },
    {
      lat: input.target.centerLat,
      lng: input.target.centerLng,
    },
  );

  const travelTime = calculateTravelTime({
    distanceM,
    unitTypes: [SCOUT_ORDER_UNIT_TYPE],
  });

  const validation = validateScoutOrder({
    sourceKingdomId: input.sourceKingdom.id,
    sourceCenterLat: input.sourceKingdom.centerLat,
    sourceCenterLng: input.sourceKingdom.centerLng,
    targetKingdomId: input.target.id,
    targetCenterLat: input.target.centerLat,
    targetCenterLng: input.target.centerLng,
    targetProtectionEndsAt: input.target.protectionEndsAt,
    garrisonScouts: input.garrisonScouts,
    requestedScouts: SCOUT_ORDER_MIN_SCOUTS,
    departureAt: input.now,
  });

  return {
    kingdomId: input.target.id,
    kingdomName: input.target.name,
    distanceM,
    travelTicks: travelTime.travelTicks,
    arrivalAt: getMovementArrivalAt(input.now, travelTime.travelTicks).toISOString(),
    isProtected: isKingdomUnderBeginnerProtection(input.target.protectionEndsAt, input.now),
    protectionEndsAt: input.target.protectionEndsAt?.toISOString() ?? null,
    canTarget: validation.ok,
    disabledReason: validation.ok ? null : validation.reason,
  };
}
