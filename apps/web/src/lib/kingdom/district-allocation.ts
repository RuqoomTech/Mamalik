import {
  validateAllocateUnusedLand,
  type AllocateUnusedLandValidationFailureReason,
} from "@mamalik/game";
import type { CurrentUser } from "@/lib/auth/current-user";
import { getPrismaClient } from "@/lib/db/client";

export type AllocateDistrictLandFailureReason =
  | "UNAUTHENTICATED"
  | "NO_KINGDOM"
  | "DISTRICT_NOT_FOUND"
  | AllocateUnusedLandValidationFailureReason
  | "UNKNOWN_ERROR";

export type AllocateDistrictLandResult =
  | {
      ok: true;
      districtId: string;
      districtType: string;
      amountM2: number;
      newAllocatedLandM2: number;
      unallocatedBeforeM2: number;
      unallocatedAfterM2: number;
    }
  | {
      ok: false;
      reason: AllocateDistrictLandFailureReason;
      message: string;
    };

export type AllocateDistrictLandInput = {
  districtId: string;
  amountM2: number;
};

type AllocateDistrictLandUser = Pick<CurrentUser, "id"> | null;

type DistrictAllocationKingdomRecord = {
  id: string;
  usableLandM2: number;
  districts: Array<{
    id: string;
    type: string;
    allocatedLandM2: number;
    usedLandM2: number;
  }>;
};

type DistrictAllocationTransaction = {
  kingdom: {
    findUnique(args: unknown): Promise<DistrictAllocationKingdomRecord | null>;
  };
  district: {
    updateMany(args: unknown): Promise<{ count: number }>;
  };
  report: {
    create(args: unknown): Promise<unknown>;
  };
};

type DistrictAllocationDb = {
  $transaction<T>(
    callback: (tx: DistrictAllocationTransaction) => Promise<T>,
    options?: { timeout?: number; isolationLevel?: string },
  ): Promise<T>;
};

export type AllocateDistrictLandDependencies = {
  db?: DistrictAllocationDb;
};

export async function allocateUnusedLandForUser(
  user: AllocateDistrictLandUser,
  input: AllocateDistrictLandInput,
  dependencies: AllocateDistrictLandDependencies = {},
): Promise<AllocateDistrictLandResult> {
  if (!user) {
    return districtAllocationFailure("UNAUTHENTICATED");
  }

  const districtId = input.districtId.trim();

  if (!districtId) {
    return districtAllocationFailure("DISTRICT_NOT_FOUND");
  }

  const db = dependencies.db ?? (getPrismaClient() as unknown as DistrictAllocationDb);

  try {
    return await db.$transaction(async (tx) => {
      const kingdom = await tx.kingdom.findUnique({
        where: {
          userId: user.id,
        },
        select: {
          id: true,
          usableLandM2: true,
          districts: {
            select: {
              id: true,
              type: true,
              allocatedLandM2: true,
              usedLandM2: true,
            },
          },
        },
      });

      if (!kingdom) {
        return districtAllocationFailure("NO_KINGDOM");
      }

      const targetDistrict = kingdom.districts.find((district) => district.id === districtId);

      if (!targetDistrict) {
        return districtAllocationFailure("DISTRICT_NOT_FOUND");
      }

      const currentTotalAllocatedLandM2 = kingdom.districts.reduce(
        (total, district) => total + district.allocatedLandM2,
        0,
      );
      const validation = validateAllocateUnusedLand({
        totalUsableLandM2: kingdom.usableLandM2,
        currentTotalAllocatedLandM2,
        targetDistrictAllocatedLandM2: targetDistrict.allocatedLandM2,
        targetDistrictUsedLandM2: targetDistrict.usedLandM2,
        amountM2: input.amountM2,
      });

      if (!validation.ok) {
        return districtAllocationFailure(validation.reason);
      }

      const update = await tx.district.updateMany({
        where: {
          id: targetDistrict.id,
          kingdomId: kingdom.id,
          allocatedLandM2: targetDistrict.allocatedLandM2,
        },
        data: {
          allocatedLandM2: {
            increment: input.amountM2,
          },
        },
      });

      if (update.count !== 1) {
        return districtAllocationFailure("UNKNOWN_ERROR");
      }

      await tx.report.create({
        data: {
          kingdomId: kingdom.id,
          type: "DISTRICT_ALLOCATION",
          title: "District land allocated",
          bodyJson: {
            amountM2: input.amountM2,
            districtType: targetDistrict.type,
            previousAllocatedLandM2: targetDistrict.allocatedLandM2,
            newAllocatedLandM2: validation.newTargetAllocatedLandM2,
            unallocatedBeforeM2: validation.unallocatedBeforeM2,
            unallocatedAfterM2: validation.unallocatedAfterM2,
          },
        },
      });

      return {
        ok: true,
        districtId: targetDistrict.id,
        districtType: targetDistrict.type,
        amountM2: input.amountM2,
        newAllocatedLandM2: validation.newTargetAllocatedLandM2,
        unallocatedBeforeM2: validation.unallocatedBeforeM2,
        unallocatedAfterM2: validation.unallocatedAfterM2,
      };
    }, { timeout: 30_000, isolationLevel: "Serializable" });
  } catch {
    return districtAllocationFailure("UNKNOWN_ERROR");
  }
}

export function getAllocateDistrictLandResultMessage(
  result: AllocateDistrictLandResult,
): string {
  if (!result.ok) {
    return result.message;
  }

  return `Allocated ${formatNumber(result.amountM2)} m2 to ${formatDistrictType(
    result.districtType,
  )}. Unallocated land is now ${formatNumber(result.unallocatedAfterM2)} m2.`;
}

function districtAllocationFailure(
  reason: AllocateDistrictLandFailureReason,
): AllocateDistrictLandResult {
  return {
    ok: false,
    reason,
    message: DISTRICT_ALLOCATION_ERROR_MESSAGES[reason],
  };
}

const DISTRICT_ALLOCATION_ERROR_MESSAGES: Record<AllocateDistrictLandFailureReason, string> = {
  UNAUTHENTICATED: "You must be signed in to allocate district land.",
  NO_KINGDOM: "Create a kingdom before allocating district land.",
  DISTRICT_NOT_FOUND: "Choose a valid district from your kingdom.",
  INVALID_AMOUNT: "Enter a positive whole number of square meters.",
  NO_UNALLOCATED_LAND: "Buy land first to allocate more district land.",
  AMOUNT_EXCEEDS_UNALLOCATED_LAND: "You cannot allocate more land than is currently unallocated.",
  UNKNOWN_ERROR: "District land allocation failed. Try again later.",
};

function formatDistrictType(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join(" ");
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}
