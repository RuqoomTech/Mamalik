import {
  getBuildingLabel,
  getUnitLabel,
  planBuildingUpgrade,
  planNewBuilding,
  planTraining,
  type BuildingStatusLike,
  type BuildingTypeLike,
  type ConstructionFailureReason,
  type KingdomActionState,
  type TrainingFailureReason,
} from "@mamalik/game";
import type { CurrentUser } from "@/lib/auth/current-user";
import { getPrismaClient } from "@/lib/db/client";

export type KingdomActionResult = { ok: true; message: string } | { ok: false; message: string };

type ActionUser = Pick<CurrentUser, "id"> | null;
type Transaction = Parameters<Parameters<ReturnType<typeof getPrismaClient>["$transaction"]>[0]>[0];

class ActionFailure extends Error {}

const CONSTRUCTION_MESSAGES: Record<ConstructionFailureReason, string> = {
  INVALID_BUILDING: "Choose a valid building.",
  NOT_BUILDABLE: "This building is not available yet.",
  MAX_INSTANCES: "Your kingdom already has this building.",
  MAX_LEVEL: "This building is already at its highest level.",
  BUILDING_NOT_FOUND: "That building no longer exists.",
  BUILDING_BUSY: "That building is already under construction.",
  SLOT_BUSY: "Your builders are busy. Wait for the current construction to finish.",
  MISSING_STOCKPILE: "Your kingdom resource stockpile is missing.",
  NOT_ENOUGH_LAND: "Not enough free land in that district. Assign more land on the Land page.",
  INSUFFICIENT_MONEY: "Not enough Money.",
  INSUFFICIENT_MANPOWER: "Not enough Manpower.",
};

const TRAINING_MESSAGES: Record<TrainingFailureReason, string> = {
  INVALID_UNIT: "Choose a valid unit.",
  INVALID_QUANTITY: "Choose a quantity between 1 and 500.",
  NO_BARRACKS: "You need an active Barracks to train units.",
  BARRACKS_LEVEL_TOO_LOW: "Upgrade your Barracks to train this unit.",
  QUEUE_BUSY: "Your barracks are busy. Wait for the current training to finish.",
  MISSING_STOCKPILE: "Your kingdom resource stockpile is missing.",
  INSUFFICIENT_MONEY: "Not enough Money.",
  INSUFFICIENT_MANPOWER: "Not enough Manpower.",
};

const UNKNOWN_FAILURE: KingdomActionResult = { ok: false, message: "Something went wrong. Try again." };

// Locks the kingdom row so concurrent actions for the same player run one at a time,
// then loads everything the shared game rules need.
async function loadLockedKingdom(tx: Transaction, userId: string) {
  const locked = await tx.$queryRaw<Array<{ id: string }>>`
    SELECT "id" FROM "Kingdom" WHERE "userId" = ${userId} FOR UPDATE
  `;
  const kingdomId = locked[0]?.id;

  if (!kingdomId) {
    return null;
  }

  const kingdom = await tx.kingdom.findUnique({
    where: { id: kingdomId },
    select: {
      id: true,
      resourceStockpile: { select: { money: true, manpower: true } },
      buildings: {
        select: { id: true, type: true, level: true, status: true, district: { select: { type: true } } },
      },
      districts: { select: { id: true, type: true, allocatedLandM2: true, usedLandM2: true } },
      trainingQueueItems: { where: { status: "ACTIVE" }, select: { id: true } },
    },
  });

  if (!kingdom) {
    return null;
  }

  const state: KingdomActionState = {
    stockpile: kingdom.resourceStockpile,
    buildings: kingdom.buildings.map((building) => ({
      id: building.id,
      type: building.type as BuildingTypeLike,
      level: building.level,
      status: building.status as BuildingStatusLike,
      districtType: building.district.type,
    })),
    districts: kingdom.districts,
    activeTrainingQueues: kingdom.trainingQueueItems.length,
  };

  return { kingdom, state };
}

async function spendResources(tx: Transaction, kingdomId: string, cost: { money: number; manpower: number }) {
  const updated = await tx.resourceStockpile.updateMany({
    where: { kingdomId, money: { gte: cost.money }, manpower: { gte: cost.manpower } },
    data: { money: { decrement: cost.money }, manpower: { decrement: cost.manpower } },
  });

  if (updated.count !== 1) {
    throw new ActionFailure("Not enough resources.");
  }
}

async function runKingdomAction(
  user: ActionUser,
  action: (tx: Transaction, loaded: NonNullable<Awaited<ReturnType<typeof loadLockedKingdom>>>) => Promise<KingdomActionResult>,
): Promise<KingdomActionResult> {
  if (!user) {
    return { ok: false, message: "You must be signed in." };
  }

  try {
    return await getPrismaClient().$transaction(
      async (tx) => {
        const loaded = await loadLockedKingdom(tx, user.id);

        if (!loaded) {
          return { ok: false, message: "Create a kingdom first." };
        }

        return action(tx, loaded);
      },
      { timeout: 30_000 },
    );
  } catch (error) {
    if (error instanceof ActionFailure) {
      return { ok: false, message: error.message };
    }

    return UNKNOWN_FAILURE;
  }
}

export function startConstructionForUser(user: ActionUser, buildingType: string): Promise<KingdomActionResult> {
  return runKingdomAction(user, async (tx, { kingdom, state }) => {
    const plan = planNewBuilding(state, buildingType);

    if (!plan.ok) {
      return { ok: false, message: CONSTRUCTION_MESSAGES[plan.reason] };
    }

    const district = kingdom.districts.find((candidate) => candidate.type === plan.districtType);

    if (!district) {
      return { ok: false, message: CONSTRUCTION_MESSAGES.NOT_ENOUGH_LAND };
    }

    await spendResources(tx, kingdom.id, plan.cost);

    const reserved = await tx.$executeRaw`
      UPDATE "District"
      SET "usedLandM2" = "usedLandM2" + ${plan.landFootprintM2}, "updatedAt" = NOW()
      WHERE "id" = ${district.id}
        AND "usedLandM2" + ${plan.landFootprintM2} <= "allocatedLandM2"
    `;

    if (reserved !== 1) {
      throw new ActionFailure(CONSTRUCTION_MESSAGES.NOT_ENOUGH_LAND);
    }

    await tx.kingdom.update({
      where: { id: kingdom.id },
      data: { usedLandM2: { increment: plan.landFootprintM2 } },
    });
    await tx.buildingInstance.create({
      data: {
        kingdomId: kingdom.id,
        districtId: district.id,
        type: plan.buildingType,
        level: 1,
        status: "CONSTRUCTING",
        landUsedM2: plan.landFootprintM2,
        constructionRemainingTicks: plan.ticks,
      },
    });

    return { ok: true, message: `${getBuildingLabel(plan.buildingType)} construction started.` };
  });
}

export function startUpgradeForUser(user: ActionUser, buildingId: string): Promise<KingdomActionResult> {
  return runKingdomAction(user, async (tx, { kingdom, state }) => {
    const plan = planBuildingUpgrade(state, buildingId);

    if (!plan.ok) {
      return { ok: false, message: CONSTRUCTION_MESSAGES[plan.reason] };
    }

    await spendResources(tx, kingdom.id, plan.cost);

    const updated = await tx.buildingInstance.updateMany({
      where: { id: buildingId, kingdomId: kingdom.id, status: "ACTIVE", level: plan.targetLevel - 1 },
      data: { level: plan.targetLevel, status: "UPGRADING", constructionRemainingTicks: plan.ticks },
    });

    if (updated.count !== 1) {
      throw new ActionFailure(CONSTRUCTION_MESSAGES.BUILDING_BUSY);
    }

    return {
      ok: true,
      message: `${getBuildingLabel(plan.buildingType)} upgrade to level ${plan.targetLevel} started.`,
    };
  });
}

export function startTrainingForUser(
  user: ActionUser,
  unitType: string,
  quantity: number,
): Promise<KingdomActionResult> {
  return runKingdomAction(user, async (tx, { kingdom, state }) => {
    const plan = planTraining(state, unitType, quantity);

    if (!plan.ok) {
      return { ok: false, message: TRAINING_MESSAGES[plan.reason] };
    }

    await spendResources(tx, kingdom.id, plan.cost);
    await tx.trainingQueueItem.create({
      data: {
        kingdomId: kingdom.id,
        unitType: plan.unitType,
        quantity: plan.quantity,
        remainingTicks: plan.ticks,
      },
    });

    return { ok: true, message: `Training ${plan.quantity} ${getUnitLabel(plan.unitType)}.` };
  });
}
