import {
  SCOUT_ORDER_UNIT_TYPE,
  validateScoutOrder,
  type ScoutOrderValidationFailureReason,
} from "@mamalik/game";
import type { CurrentUser } from "@/lib/auth/current-user";
import { getPrismaClient } from "@/lib/db/client";

export type CreateScoutOrderFailureReason =
  | "UNAUTHENTICATED"
  | "NO_KINGDOM"
  | ScoutOrderValidationFailureReason
  | "UNKNOWN_ERROR";

export type CreateScoutOrderResult =
  | {
      ok: true;
      movementOrderId: string;
      targetKingdomId: string;
      targetKingdomName: string;
      scoutCount: number;
      distanceM: number;
      travelTicks: number;
      /** ISO-8601 */
      departureAt: string;
      /** ISO-8601 */
      arrivalAt: string;
    }
  | {
      ok: false;
      reason: CreateScoutOrderFailureReason;
      message: string;
    };

export type CreateScoutOrderInput = {
  targetKingdomId: string;
  scoutCount: number;
};

type CreateScoutOrderUser = Pick<CurrentUser, "id"> | null;

type ScoutOrderSourceKingdomRecord = {
  id: string;
  name: string;
  centerLat: number;
  centerLng: number;
  protectionEndsAt: Date | null;
  unitStacks: Array<{
    quantity: number;
  }>;
};

type ScoutOrderTargetKingdomRecord = {
  id: string;
  name: string;
  centerLat: number;
  centerLng: number;
  protectionEndsAt: Date | null;
};

type ScoutOrderCreatedMovementOrder = {
  id: string;
};

type ScoutOrderTransaction = {
  kingdom: {
    findUnique(args: unknown): Promise<ScoutOrderSourceKingdomRecord | null>;
  };
  unitStack: {
    updateMany(args: unknown): Promise<{ count: number }>;
  };
  movementOrder: {
    create(args: unknown): Promise<ScoutOrderCreatedMovementOrder>;
  };
};

type ScoutOrderDb = {
  $transaction<T>(
    callback: (tx: ScoutOrderTransaction) => Promise<T>,
    options?: { timeout?: number; isolationLevel?: string },
  ): Promise<T>;
};

export type CreateScoutOrderDependencies = {
  db?: ScoutOrderDb;
  now?: () => Date;
};

/**
 * Thrown inside the transaction when a database-level guard fails. The rollback
 * undoes any earlier write in this transaction, and the catch block turns it
 * back into a typed reason instead of a generic failure.
 */
class KnownScoutOrderError extends Error {
  constructor(
    readonly reason: Exclude<CreateScoutOrderFailureReason, "UNAUTHENTICATED" | "UNKNOWN_ERROR">,
  ) {
    super(reason);
  }
}

export async function createScoutOrderForUser(
  user: CreateScoutOrderUser,
  input: CreateScoutOrderInput,
  dependencies: CreateScoutOrderDependencies = {},
): Promise<CreateScoutOrderResult> {
  if (!user) {
    return scoutOrderFailure("UNAUTHENTICATED");
  }

  const targetKingdomId = input.targetKingdomId.trim();

  // A blank target id can never identify a kingdom, so reject it before opening
  // a transaction. This mirrors the district-allocation pre-check and keeps a
  // junk id from reaching Prisma, where `findUnique` would throw instead of
  // returning null and surface as a generic UNKNOWN_ERROR.
  if (!targetKingdomId) {
    return scoutOrderFailure("INVALID_TARGET");
  }

  const db = dependencies.db ?? (getPrismaClient() as unknown as ScoutOrderDb);
  const now = dependencies.now?.() ?? new Date();

  try {
    return await db.$transaction(async (tx) => {
      const kingdom = await tx.kingdom.findUnique({
        where: {
          userId: user.id,
        },
        select: {
          id: true,
          name: true,
          centerLat: true,
          centerLng: true,
          protectionEndsAt: true,
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

      if (!kingdom) {
        return scoutOrderFailure("NO_KINGDOM");
      }

      // A brand-new kingdom has no SCOUTS garrison row at all, so an absent
      // stack is a legitimate zero, not missing data.
      const garrisonScouts = kingdom.unitStacks[0]?.quantity ?? 0;

      const targetKingdom = await tx.kingdom.findUnique({
        where: {
          id: targetKingdomId,
        },
        select: {
          id: true,
          name: true,
          centerLat: true,
          centerLng: true,
          protectionEndsAt: true,
        },
      }) as ScoutOrderTargetKingdomRecord | null;

      // An unknown target is deliberately reported through the shared
      // validator rather than through a bespoke error path, so the read model
      // and the mutation can never disagree about the outcome.
      const validation = validateScoutOrder({
        sourceKingdomId: kingdom.id,
        sourceCenterLat: kingdom.centerLat,
        sourceCenterLng: kingdom.centerLng,
        targetKingdomId,
        targetCenterLat: targetKingdom?.centerLat ?? null,
        targetCenterLng: targetKingdom?.centerLng ?? null,
        targetProtectionEndsAt: targetKingdom?.protectionEndsAt ?? null,
        garrisonScouts,
        requestedScouts: input.scoutCount,
        departureAt: now,
      });

      if (!validation.ok) {
        return scoutOrderFailure(validation.reason);
      }

      // Reserve the scouts with a conditional decrement guarded by
      // `quantity >= scoutCount`. Two concurrent orders cannot both spend the
      // same scout: the loser's update matches zero rows and rolls back.
      const reservation = await tx.unitStack.updateMany({
        where: {
          kingdomId: kingdom.id,
          unitType: SCOUT_ORDER_UNIT_TYPE,
          locationType: "GARRISON",
          quantity: {
            gte: validation.scoutCount,
          },
        },
        data: {
          quantity: {
            decrement: validation.scoutCount,
          },
        },
      });

      if (reservation.count !== 1) {
        throw new KnownScoutOrderError("NOT_ENOUGH_SCOUTS");
      }

      const movementOrder = await tx.movementOrder.create({
        data: {
          sourceKingdomId: kingdom.id,
          targetKingdomId: validation.targetKingdomId,
          orderType: "SCOUT",
          status: "IN_TRANSIT",
          unitsJson: [
            {
              unitType: SCOUT_ORDER_UNIT_TYPE,
              quantity: validation.scoutCount,
            },
          ],
          distanceM: validation.distanceM,
          travelTicks: validation.travelTicks,
          // The validator returns `arrivalAt` but not `departureAt`; departure is
          // the server-side `now` that was handed to it, never a client value.
          departureAt: now,
          arrivalAt: validation.arrivalAt,
        },
        select: {
          id: true,
        },
      });

      /*
       * Deliberate omissions for S5-003:
       * - No `Report` row is written at dispatch. The approximate scout report is
       *   produced on arrival, which is S5-004's job; writing a placeholder here
       *   would imply a result that does not exist yet.
       * - No return leg is created, no arrival is resolved, and no tick-worker
       *   processing runs. S5-004 onward owns the full order lifecycle, including
       *   the `RETURN` row linked by `parentOrderId`.
       * - No alliance check is performed. Sprint 6 still has no `Alliance`
       *   schema, so there is nothing authoritative to check against; adding one
       *   now would be guesswork about a later design.
       * - No `SCOUT_ORDER_MAX_SCOUTS` cap exists. Only the shared
       *   `SCOUT_ORDER_MIN_SCOUTS` floor is enforced, because that floor is a
       *   correctness rule. An upper cap is a balance decision, so it is
       *   deliberately deferred to future balance work rather than invented here.
       */

      return {
        ok: true,
        movementOrderId: movementOrder.id,
        targetKingdomId: validation.targetKingdomId,
        targetKingdomName: targetKingdom?.name ?? "",
        scoutCount: validation.scoutCount,
        distanceM: validation.distanceM,
        travelTicks: validation.travelTicks,
        departureAt: now.toISOString(),
        arrivalAt: validation.arrivalAt.toISOString(),
      };
    }, { timeout: 30_000, isolationLevel: "Serializable" });
  } catch (error) {
    if (error instanceof KnownScoutOrderError) {
      return scoutOrderFailure(error.reason);
    }

    return scoutOrderFailure("UNKNOWN_ERROR");
  }
}

export function getCreateScoutOrderResultMessage(result: CreateScoutOrderResult): string {
  if (!result.ok) {
    return result.message;
  }

  const scoutLabel = result.scoutCount === 1 ? "scout" : "scouts";
  const tickLabel = result.travelTicks === 1 ? "tick" : "ticks";

  return `Sent ${formatNumber(result.scoutCount)} ${scoutLabel} to ${
    result.targetKingdomName
  }. The order arrives in ${formatNumber(result.travelTicks)} ${tickLabel}.`;
}

function scoutOrderFailure(reason: CreateScoutOrderFailureReason): CreateScoutOrderResult {
  return {
    ok: false,
    reason,
    message: SCOUT_ORDER_ERROR_MESSAGES[reason],
  };
}

const SCOUT_ORDER_ERROR_MESSAGES: Record<CreateScoutOrderFailureReason, string> = {
  UNAUTHENTICATED: "You must be signed in to send scouts.",
  NO_KINGDOM: "Create a kingdom before sending scouts.",
  INVALID_TARGET: "Choose a valid kingdom to scout.",
  SELF_TARGET: "You cannot scout your own kingdom.",
  TARGET_NOT_FOUND: "That kingdom no longer exists.",
  TARGET_PROTECTED: "That kingdom is under beginner protection and cannot be scouted.",
  INVALID_SCOUT_COUNT: "Enter a positive whole number of scouts.",
  NOT_ENOUGH_SCOUTS: "You do not have enough scouts in your garrison.",
  UNKNOWN_ERROR: "Sending scouts failed. Try again later.",
};

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}
