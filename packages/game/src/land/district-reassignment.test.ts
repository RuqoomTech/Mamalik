import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  calculateUnallocatedLandM2,
  validateAllocateUnusedLand,
} from "./district-reassignment";

describe("district unused land allocation", () => {
  it("calculates unallocated land from usable and allocated land", () => {
    assert.equal(calculateUnallocatedLandM2(51_500, 50_000), 1_500);
    assert.equal(calculateUnallocatedLandM2(50_000, 51_000), 0);
    assert.equal(calculateUnallocatedLandM2(-1, 10_000), 0);
  });

  it("passes for a valid allocation", () => {
    assert.deepEqual(
      validateAllocateUnusedLand({
        totalUsableLandM2: 51_500,
        currentTotalAllocatedLandM2: 50_000,
        targetDistrictAllocatedLandM2: 8_000,
        targetDistrictUsedLandM2: 1_000,
        amountM2: 500,
      }),
      {
        ok: true,
        unallocatedBeforeM2: 1_500,
        unallocatedAfterM2: 1_000,
        newTargetAllocatedLandM2: 8_500,
      },
    );
  });

  it("rejects zero, negative, and non-integer amounts", () => {
    for (const amountM2 of [0, -100, 12.5]) {
      assert.deepEqual(
        validateAllocateUnusedLand({
          totalUsableLandM2: 51_000,
          currentTotalAllocatedLandM2: 50_000,
          targetDistrictAllocatedLandM2: 8_000,
          targetDistrictUsedLandM2: 1_000,
          amountM2,
        }),
        {
          ok: false,
          reason: "INVALID_AMOUNT",
        },
      );
    }
  });

  it("rejects allocation when no unallocated land exists", () => {
    assert.deepEqual(
      validateAllocateUnusedLand({
        totalUsableLandM2: 50_000,
        currentTotalAllocatedLandM2: 50_000,
        targetDistrictAllocatedLandM2: 8_000,
        targetDistrictUsedLandM2: 1_000,
        amountM2: 100,
      }),
      {
        ok: false,
        reason: "NO_UNALLOCATED_LAND",
      },
    );
  });

  it("rejects amount larger than unallocated land", () => {
    assert.deepEqual(
      validateAllocateUnusedLand({
        totalUsableLandM2: 50_500,
        currentTotalAllocatedLandM2: 50_000,
        targetDistrictAllocatedLandM2: 8_000,
        targetDistrictUsedLandM2: 1_000,
        amountM2: 1_000,
      }),
      {
        ok: false,
        reason: "AMOUNT_EXCEEDS_UNALLOCATED_LAND",
      },
    );
  });

  it("allows allocating the exact unallocated amount", () => {
    assert.deepEqual(
      validateAllocateUnusedLand({
        totalUsableLandM2: 51_000,
        currentTotalAllocatedLandM2: 50_000,
        targetDistrictAllocatedLandM2: 8_000,
        targetDistrictUsedLandM2: 1_000,
        amountM2: 1_000,
      }),
      {
        ok: true,
        unallocatedBeforeM2: 1_000,
        unallocatedAfterM2: 0,
        newTargetAllocatedLandM2: 9_000,
      },
    );
  });

  it("allows overused districts to receive unused land", () => {
    assert.deepEqual(
      validateAllocateUnusedLand({
        totalUsableLandM2: 51_000,
        currentTotalAllocatedLandM2: 50_000,
        targetDistrictAllocatedLandM2: 500,
        targetDistrictUsedLandM2: 1_200,
        amountM2: 700,
      }),
      {
        ok: true,
        unallocatedBeforeM2: 1_000,
        unallocatedAfterM2: 300,
        newTargetAllocatedLandM2: 1_200,
      },
    );
  });
});
