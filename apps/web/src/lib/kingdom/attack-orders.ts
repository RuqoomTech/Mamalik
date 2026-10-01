import {
  validateAttackOrder,
  type AttackArmyEntry,
  type AttackOrderValidationFailureReason,
  type MovementUnitType,
} from "@mamalik/game";
import type { CurrentUser } from "@/lib/auth/current-user";
import { getPrismaClient } from "@/lib/db/client";

export type CreateAttackOrderFailureReason =
  | "UNAUTHENTICATED"
  | "NO_KINGDOM"
  | AttackOrderValidationFailureReason
  | "UNKNOWN_ERROR";

export type CreateAttackOrderResult =
  | {
      ok: true;
      movementOrderId: string;
      targetKingdomId: string;
      targetKingdomName: string;
      /** The NORMALIZED manifest that was validated and stored, never the raw request. */
      units: AttackArmyEntry[];
      totalUnits: number;
      /** The unit type that set the pace of the whole army. */
      slowestUnitType: string;
      distanceM: number;
      travelTicks: number;
      /** ISO-8601 */
      departureAt: string;
      /** ISO-8601 */
      arrivalAt: string;
    }
  | {
      ok: false;
      reason: CreateAttackOrderFailureReason;
      message: string;
    };

export type CreateAttackOrderInput = {
  targetKingdomId: string;
  units: readonly AttackArmyEntry[];
};

type CreateAttackOrderUser = Pick<CurrentUser, "id"> | null;

/**
 * An attacking army is MIXED, so every GARRISON unit type is loaded, not just one
 * type. Selecting a single stack the way the scout mutation does would make a
 * mixed manifest fail validation against a garrison the kingdom actually holds.
 */
type AttackOrderSourceKingdomRecord = {
  id: string;
  name: string;
  centerLat: number;
  centerLng: number;
  unitStacks: Array<{
    unitType: string;
    quantity: number;
  }>;
};

type AttackOrderTargetKingdomRecord = {
  id: string;
  name: string;
  centerLat: number;
  centerLng: number;
  protectionEndsAt: Date | null;
};

type AttackOrderCreatedMovementOrder = {
  id: string;
};

type AttackOrderTransaction = {
  kingdom: {
    findUnique(args: unknown): Promise<AttackOrderSourceKingdomRecord | null>;
  };
  unitStack: {
    updateMany(args: unknown): Promise<{ count: number }>;
  };
  movementOrder: {
    create(args: unknown): Promise<AttackOrderCreatedMovementOrder>;
  };
};

type AttackOrderDb = {
  $transaction<T>(
    callback: (tx: AttackOrderTransaction) => Promise<T>,
    options?: { timeout?: number; isolationLevel?: string },
  ): Promise<T>;
};

export type CreateAttackOrderDependencies = {
  db?: AttackOrderDb;
  now?: () => Date;
};

/**
 * Thrown inside the transaction when a database-level guard fails. The rollback
 * undoes every earlier write in this transaction, and the catch block turns it
 * back into a typed reason instead of a generic failure.
 */
class KnownAttackOrderError extends Error {
  constructor(
    readonly reason: Exclude<CreateAttackOrderFailureReason, "UNAUTHENTICATED" | "UNKNOWN_ERROR">,
  ) {
    super(reason);
  }
}

/**
 * Dispatch an ATTACK `MovementOrder` and reserve the attacking army, in one
 * Serializable transaction.
 *
 * Server-side authority, top to bottom:
 * 1. `user` gates the call before a transaction is ever opened.
 * 2. The source kingdom and its FULL garrison are read inside the transaction.
 * 3. The shared `validateAttackOrder` is the single source of truth for target
 *    eligibility, army validity, and garrison supply. Client-submitted unit
 *    counts are never trusted: the manifest is re-validated and normalized
 *    against the garrison rows read above, and `unitsJson` stores the normalized
 *    result of that validation rather than the raw client payload.
 * 4. Each unit type is reserved with its own conditional decrement, and any
 *    miss rolls the whole transaction back.
 */
export async function createAttackOrderForUser(
  user: CreateAttackOrderUser,
  input: CreateAttackOrderInput,
  dependencies: CreateAttackOrderDependencies = {},
): Promise<CreateAttackOrderResult> {
  if (!user) {
    return attackOrderFailure("UNAUTHENTICATED");
  }

  const targetKingdomId =
    typeof input.targetKingdomId === "string" ? input.targetKingdomId.trim() : "";

  // A blank target id can never identify a kingdom, so reject it before opening a
  // transaction. This mirrors the scout mutation and keeps a junk id from
  // reaching Prisma, where `findUnique` would throw instead of returning null
  // and surface as a generic UNKNOWN_ERROR.
  if (!targetKingdomId) {
    return attackOrderFailure("INVALID_TARGET");
  }

  const db = dependencies.db ?? (getPrismaClient() as unknown as AttackOrderDb);
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
          unitStacks: {
            where: {
              locationType: "GARRISON",
            },
            select: {
              unitType: true,
              quantity: true,
            },
          },
        },
      });

      if (!kingdom) {
        return attackOrderFailure("NO_KINGDOM");
      }

      // A brand-new kingdom has no GARRISON rows at all, so an absent stack list
      // is a legitimate empty army, not missing data.
      const garrisonUnits: AttackArmyEntry[] = kingdom.unitStacks.map((stack) => ({
        unitType: stack.unitType as MovementUnitType,
        quantity: stack.quantity,
      }));

      const targetKingdom = (await tx.kingdom.findUnique({
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
      })) as AttackOrderTargetKingdomRecord | null;

      // An unknown target is deliberately reported THROUGH the shared validator
      // rather than through a bespoke error path, so the read model and this
      // mutation can never disagree about the outcome. Null coordinates and a
      // null protection deadline are exactly the inputs the validator turns into
      // TARGET_NOT_FOUND.
      const validation = validateAttackOrder({
        sourceKingdomId: kingdom.id,
        sourceCenterLat: kingdom.centerLat,
        sourceCenterLng: kingdom.centerLng,
        targetKingdomId,
        targetCenterLat: targetKingdom?.centerLat ?? null,
        targetCenterLng: targetKingdom?.centerLng ?? null,
        targetProtectionEndsAt: targetKingdom?.protectionEndsAt ?? null,
        units: input.units,
        garrisonUnits,
        departureAt: now,
      });

      if (!validation.ok) {
        return attackOrderFailure(validation.reason);
      }

      // Reserve EVERY unit type in the normalized manifest, aggregated per unit
      // type, with one conditional atomic decrement each.
      //
      // Why conditional updates rather than a plain read-then-write: a
      // read-then-write inside this transaction would let two concurrent attacks
      // both read the same garrison quantity, both pass validation, and both
      // spend the same units. Each `updateMany` here is guarded by
      // `quantity >= requested`, so the loser of a race matches zero rows.
      //
      // Why the throw is the whole point: an attack may span several unit types,
      // and the reservation must be ALL-OR-NOTHING. If a later unit type fails
      // its conditional update, throwing rolls the transaction back so the
      // earlier decrements are undone. An attacker must never end up having lost
      // some units and gained no order.
      for (const [unitType, quantity] of aggregateManifest(validation.units)) {
        const reservation = await tx.unitStack.updateMany({
          where: {
            kingdomId: kingdom.id,
            unitType,
            locationType: "GARRISON",
            quantity: {
              gte: quantity,
            },
          },
          data: {
            quantity: {
              decrement: quantity,
            },
          },
        });

        if (reservation.count !== 1) {
          throw new KnownAttackOrderError("INSUFFICIENT_UNITS");
        }
      }

      const movementOrder = await tx.movementOrder.create({
        data: {
          sourceKingdomId: kingdom.id,
          targetKingdomId: validation.targetKingdomId,
          orderType: "ATTACK",
          status: "IN_TRANSIT",
          // The NORMALIZED manifest from the validator, not the client payload.
          unitsJson: validation.units,
          distanceM: validation.distanceM,
          travelTicks: validation.travelTicks,
          // The validator returns `arrivalAt` but not `departureAt`; departure is
          // the server-side `now` that was handed to it, never a client value.
          departureAt: now,
          arrivalAt: validation.arrivalAt,
          // `returnAt`, `parentOrderId`, `resolvedAt`, and `cancelledAt` stay
          // null: there is no return leg and no resolution at dispatch time.
        },
        select: {
          id: true,
        },
      });

      /*
       * Deliberate omissions for S5-005:
       * - No `Report` row is written at dispatch. The battle is resolved on
       *   arrival and the report is written by S5-010; writing a placeholder here
       *   would imply a result that does not exist yet.
       * - No battle is resolved and no combat math runs. That is S5-006's job.
       * - No defender bonuses are applied. That is S5-007's job, and it happens
       *   on arrival, not at dispatch.
       * - No siege behaviour is implemented. That is S5-008's job.
       * - No war land capture happens. That is S5-009's job.
       * - No return leg is created, no arrival is resolved, and no tick-worker
       *   processing runs. The full order lifecycle, including the `RETURN` row
       *   linked by `parentOrderId`, belongs to S5-006 onward.
       * - No alliance check is performed. Sprint 6 still has no `Alliance`
       *   schema, so there is nothing authoritative to check against; adding one
       *   now would be guesswork about a later design. The shared validator
       *   carries the identical note.
       * - There is NO `ATTACK_ORDER_MIN_UNITS` floor and NO maximum army size.
       *   A minimum or maximum army is a balance decision, so it is deliberately
       *   deferred to future balance work rather than invented here, exactly as
       *   `SCOUT_ORDER_MAX_SCOUTS` was in S5-003. The only size rule enforced is
       *   the correctness floor that the manifest must be non-empty.
       */

      return {
        ok: true,
        movementOrderId: movementOrder.id,
        targetKingdomId: validation.targetKingdomId,
        targetKingdomName: targetKingdom?.name ?? "",
        units: validation.units,
        totalUnits: validation.totalUnits,
        slowestUnitType: validation.slowestUnitType,
        distanceM: validation.distanceM,
        travelTicks: validation.travelTicks,
        departureAt: now.toISOString(),
        arrivalAt: validation.arrivalAt.toISOString(),
      };
    }, { timeout: 30_000, isolationLevel: "Serializable" });
  } catch (error) {
    if (error instanceof KnownAttackOrderError) {
      return attackOrderFailure(error.reason);
    }

    return attackOrderFailure("UNKNOWN_ERROR");
  }
}

export function getCreateAttackOrderResultMessage(result: CreateAttackOrderResult): string {
  if (!result.ok) {
    return result.message;
  }

  const tickLabel = result.travelTicks === 1 ? "tick" : "ticks";

  return `Sent ${formatNumber(result.totalUnits)} units to ${
    result.targetKingdomName
  }. The attack arrives in ${formatNumber(result.travelTicks)} ${tickLabel}.`;
}

/**
 * Collapse the normalized manifest into one total per unit type.
 *
 * The validator deliberately preserves request order and does NOT merge duplicate
 * entries, but reservation must be aggregated: a client that splits one unit type
 * into 60 + 60 must still be reserved against a single 120-unit requirement, or
 * the second conditional update would match zero rows and wrongly fail a legal
 * order.
 */
function aggregateManifest(
  units: readonly AttackArmyEntry[],
): Array<[MovementUnitType, number]> {
  const totals = new Map<MovementUnitType, number>();

  for (const entry of units) {
    totals.set(entry.unitType, (totals.get(entry.unitType) ?? 0) + entry.quantity);
  }

  return [...totals.entries()];
}

function attackOrderFailure(reason: CreateAttackOrderFailureReason): CreateAttackOrderResult {
  return {
    ok: false,
    reason,
    message: ATTACK_ORDER_ERROR_MESSAGES[reason],
  };
}

const ATTACK_ORDER_ERROR_MESSAGES: Record<CreateAttackOrderFailureReason, string> = {
  UNAUTHENTICATED: "You must be signed in to launch an attack.",
  NO_KINGDOM: "Create a kingdom before launching an attack.",
  INVALID_TARGET: "Choose a valid kingdom to attack.",
  SELF_TARGET: "You cannot attack your own kingdom.",
  TARGET_NOT_FOUND: "That kingdom no longer exists.",
  TARGET_PROTECTED: "That kingdom is under beginner protection and cannot be attacked.",
  INVALID_ARMY: "Send at least one whole unit in your army.",
  INVALID_UNIT_TYPE: "That army contains an unknown unit type.",
  INSUFFICIENT_UNITS: "You do not have enough units in your garrison for that army.",
  UNKNOWN_ERROR: "Launching the attack failed. Try again later.",
};

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}
