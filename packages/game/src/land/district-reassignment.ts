export type AllocateUnusedLandInput = {
  totalUsableLandM2: number;
  currentTotalAllocatedLandM2: number;
  targetDistrictAllocatedLandM2: number;
  targetDistrictUsedLandM2: number;
  amountM2: number;
};

export type AllocateUnusedLandValidationFailureReason =
  | "INVALID_AMOUNT"
  | "NO_UNALLOCATED_LAND"
  | "AMOUNT_EXCEEDS_UNALLOCATED_LAND";

export type AllocateUnusedLandValidationResult =
  | {
      ok: true;
      unallocatedBeforeM2: number;
      unallocatedAfterM2: number;
      newTargetAllocatedLandM2: number;
    }
  | {
      ok: false;
      reason: AllocateUnusedLandValidationFailureReason;
    };

export function calculateUnallocatedLandM2(
  totalUsableLandM2: number,
  currentTotalAllocatedLandM2: number,
): number {
  return Math.max(
    toNonNegativeInteger(totalUsableLandM2) - toNonNegativeInteger(currentTotalAllocatedLandM2),
    0,
  );
}

export function validateAllocateUnusedLand(
  input: AllocateUnusedLandInput,
): AllocateUnusedLandValidationResult {
  if (!Number.isInteger(input.amountM2) || input.amountM2 <= 0) {
    return { ok: false, reason: "INVALID_AMOUNT" };
  }

  const unallocatedBeforeM2 = calculateUnallocatedLandM2(
    input.totalUsableLandM2,
    input.currentTotalAllocatedLandM2,
  );

  if (unallocatedBeforeM2 <= 0) {
    return { ok: false, reason: "NO_UNALLOCATED_LAND" };
  }

  if (input.amountM2 > unallocatedBeforeM2) {
    return { ok: false, reason: "AMOUNT_EXCEEDS_UNALLOCATED_LAND" };
  }

  return {
    ok: true,
    unallocatedBeforeM2,
    unallocatedAfterM2: unallocatedBeforeM2 - input.amountM2,
    newTargetAllocatedLandM2:
      toNonNegativeInteger(input.targetDistrictAllocatedLandM2) + input.amountM2,
  };
}

function toNonNegativeInteger(value: number): number {
  if (!Number.isFinite(value) || value <= 0) {
    return 0;
  }

  return Math.floor(value);
}
