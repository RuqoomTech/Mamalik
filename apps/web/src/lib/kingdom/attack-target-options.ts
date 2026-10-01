import {
  calculateMovementDistanceMeters,
  calculateTravelTime,
  getMovementArrivalAt,
  isKingdomUnderBeginnerProtection,
  validateAttackOrder,
  type AttackArmyEntry,
  type AttackOrderValidationFailureReason,
  type MovementUnitType,
} from "@mamalik/game";
import { getPrismaClient } from "@/lib/db/client";

export type AttackTargetOption = {
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
  disabledReason: AttackOrderValidationFailureReason | null;
};

/**
 * One garrison stack the player may add to an attack manifest, already shaped for
 * a unit-selection control. `label` is the human name ("Infantry"), matching the
 * style used by `STARTER_UNITS` in `packages/game/src/constants.ts`.
 */
export type AttackArmyStackOption = {
  unitType: string;
  label: string;
  quantity: number;
};

/** How many attack targets the dropdown is ever allowed to render. */
export const ATTACK_TARGET_OPTION_LIMIT = 10;

/**
 * The smallest army the attack UI can produce. It exists as a named constant so
 * the read model and the mutation agree on "what counts as an army at all": a
 * manifest must carry at least one whole unit, and nothing smaller is dispatchable.
 */
export const ATTACK_ARMY_MANIFEST_MIN_TOTAL_UNITS = 1;

/**
 * Fetch comfortably more than the limit so the deterministic `createdAt` order
 * still yields a full page once the caller's own kingdom is excluded.
 */
const ATTACK_TARGET_OPTION_FETCH_LIMIT = ATTACK_TARGET_OPTION_LIMIT * 5;

/** The order in which human labels for the five v0.1 unit types are listed. */
const ATTACK_ARMY_STACK_UNIT_ORDER: readonly MovementUnitType[] = [
  "INFANTRY",
  "ARCHERS",
  "CAVALRY",
  "SIEGE",
  "SCOUTS",
];

type AttackTargetSourceKingdomRecord = {
  id: string;
  centerLat: number;
  centerLng: number;
  unitStacks: Array<{
    unitType: string;
    quantity: number;
  }>;
};

type AttackTargetKingdomRecord = {
  id: string;
  name: string;
  centerLat: number;
  centerLng: number;
  protectionEndsAt: Date | null;
};

type AttackTargetDb = {
  kingdom: {
    findUnique(args: unknown): Promise<AttackTargetSourceKingdomRecord | null>;
    findMany(args: unknown): Promise<AttackTargetKingdomRecord[]>;
  };
};

export type AttackTargetOptionDependencies = {
  db?: AttackTargetDb;
  now?: () => Date;
};

/**
 * Bounded read model that powers the attack target dropdown.
 *
 * Each option runs the SAME shared `validateAttackOrder` the mutation runs, so a
 * target can never be shown as selectable when `createAttackOrderForUser` would
 * reject it. The mutation is the authority; this read model only mirrors it.
 */
export async function getAttackTargetOptionsForUser(
  userId: string,
  dependencies: AttackTargetOptionDependencies = {},
): Promise<AttackTargetOption[]> {
  const db = dependencies.db ?? (getPrismaClient() as unknown as AttackTargetDb);
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
          locationType: "GARRISON",
        },
        select: {
          unitType: true,
          quantity: true,
        },
      },
    },
  });

  if (!sourceKingdom) {
    return [];
  }

  const garrisonUnits = toGarrisonArmyEntries(sourceKingdom.unitStacks);
  const probeUnitType = pickProbeUnitType(garrisonUnits);

  const targets = await db.kingdom.findMany({
    where: {
      // Never offer the caller's own kingdom as an attack target.
      id: {
        not: sourceKingdom.id,
      },
    },
    orderBy: {
      createdAt: "asc",
    },
    take: ATTACK_TARGET_OPTION_FETCH_LIMIT,
    select: {
      id: true,
      name: true,
      centerLat: true,
      centerLng: true,
      protectionEndsAt: true,
    },
  });

  return targets
    .map((target) =>
      shapeAttackTargetOption({
        sourceKingdom,
        target,
        garrisonUnits,
        probeUnitType,
        now,
      })
    )
    .slice(0, ATTACK_TARGET_OPTION_LIMIT);
}

/**
 * The garrison stacks a player may send, shaped for the unit-selection UI.
 *
 * Only GARRISON rows with a positive quantity are returned: a stack at zero
 * cannot be added to a manifest, and a `MOVING` row is already marching on
 * another order, so offering either would let the UI offer something the
 * mutation would reject.
 */
export async function getAttackArmyStacksForUser(
  userId: string,
  dependencies: AttackTargetOptionDependencies = {},
): Promise<AttackArmyStackOption[]> {
  const db = dependencies.db ?? (getPrismaClient() as unknown as AttackTargetDb);

  const kingdom = await db.kingdom.findUnique({
    where: {
      userId,
    },
    select: {
      id: true,
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
    return [];
  }

  return shapeAttackArmyStackOptions(toGarrisonArmyEntries(kingdom.unitStacks));
}

function shapeAttackTargetOption(input: {
  sourceKingdom: AttackTargetSourceKingdomRecord;
  target: AttackTargetKingdomRecord;
  garrisonUnits: AttackArmyEntry[];
  probeUnitType: MovementUnitType | null;
  now: Date;
}): AttackTargetOption {
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

  // Travel time is shown for the smallest army the UI can dispatch, so the figure
  // is the optimistic one. The mutation recomputes it from the real manifest, and
  // a slower army simply takes longer, so this never over-promises.
  const travelTime = calculateTravelTime({
    distanceM,
    unitTypes: input.probeUnitType === null ? [] : [input.probeUnitType],
  });

  const validation =
    input.probeUnitType === null
      ? { ok: false as const, reason: "INSUFFICIENT_UNITS" as const }
      : validateAttackOrder({
          sourceKingdomId: input.sourceKingdom.id,
          sourceCenterLat: input.sourceKingdom.centerLat,
          sourceCenterLng: input.sourceKingdom.centerLng,
          targetKingdomId: input.target.id,
          targetCenterLat: input.target.centerLat,
          targetCenterLng: input.target.centerLng,
          targetProtectionEndsAt: input.target.protectionEndsAt,
          units: [
            {
              unitType: input.probeUnitType,
              quantity: ATTACK_ARMY_MANIFEST_MIN_TOTAL_UNITS,
            },
          ],
          garrisonUnits: input.garrisonUnits,
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

/**
 * Which single unit type each option is evaluated against.
 *
 * INFANTRY is preferred because it is the unit type a starting kingdom always
 * has, so the probe reflects an army a typical player can actually dispatch. When
 * the caller has no INFANTRY, any unit type they DO have is used instead, because
 * the point of the probe is only to answer "is there any army at all, and is this
 * target legal", not to model a particular composition.
 *
 * `null` means the caller has no army whatsoever. That case is handled explicitly
 * rather than by inventing a manifest: an empty manifest would be rejected as
 * INVALID_ARMY, which would tell the player their army is malformed when the
 * truth is that they have nothing to send. INSUFFICIENT_UNITS is the reason the
 * mutation itself returns for exactly this player. Note that a target-specific
 * reason still wins over it, because the target rows are filtered and evaluated
 * exactly as they are for any caller: a protected target reports
 * TARGET_PROTECTED and a caller with no army still sees why.
 */
function pickProbeUnitType(
  garrisonUnits: readonly AttackArmyEntry[],
): MovementUnitType | null {
  const available = garrisonUnits.filter((entry) => entry.quantity > 0);

  if (available.length === 0) {
    return null;
  }

  const infantry = available.find((entry) => entry.unitType === "INFANTRY");

  return infantry?.unitType ?? available[0].unitType;
}

/** Map the raw garrison rows into validator-shaped entries, dropping empty stacks. */
function toGarrisonArmyEntries(
  unitStacks: readonly { unitType: string; quantity: number }[],
): AttackArmyEntry[] {
  return unitStacks
    .filter((stack) => stack.quantity > 0)
    .map((stack) => ({
      unitType: stack.unitType as MovementUnitType,
      quantity: stack.quantity,
    }));
}

/**
 * Shape garrison stacks for the unit picker.
 *
 * The order is fixed by `ATTACK_ARMY_STACK_UNIT_ORDER` rather than by whatever
 * order the database returns rows in, so two identical garrisons always render
 * the same control. Unknown unit types are appended rather than dropped, so a
 * unit type added later is still visible before this list is updated.
 */
function shapeAttackArmyStackOptions(
  garrisonUnits: readonly AttackArmyEntry[],
): AttackArmyStackOption[] {
  const known = ATTACK_ARMY_STACK_UNIT_ORDER.map((unitType) => {
    const entry = garrisonUnits.find((candidate) => candidate.unitType === unitType);

    return { unitType, quantity: entry === undefined ? null : entry.quantity };
  }).filter((candidate): candidate is { unitType: MovementUnitType; quantity: number } =>
    candidate.quantity !== null
  );

  const unknown = garrisonUnits
    .filter((candidate) => !ATTACK_ARMY_STACK_UNIT_ORDER.includes(candidate.unitType))
    .map((entry) => ({ unitType: entry.unitType, quantity: entry.quantity }));

  return [...known, ...unknown].map(({ unitType, quantity }) => ({
    unitType,
    label: formatAttackUnitLabel(unitType),
    quantity,
  }));
}

/**
 * "INFANTRY" -> "Infantry", "SIEGE" -> "Siege".
 *
 * Deliberately the same title-casing of the enum value that
 * `formatAdminEnumLabel` applies to `UnitType` in the admin data layer, and the
 * same style as `STARTER_UNITS` in `packages/game/src/constants.ts`.
 */
function formatAttackUnitLabel(unitType: string): string {
  return unitType
    .toLowerCase()
    .split("_")
    .filter(Boolean)
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join(" ");
}