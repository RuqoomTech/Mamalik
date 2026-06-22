import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  LAND_PURCHASE_PACKAGES,
  getLandPurchasePackage,
  getLandPurchasePackageBySize,
  isSupportedLandPackageSize,
} from "./land-packages";

describe("land package constants", () => {
  it("defines all locked package sizes, cooldowns, keys, and labels", () => {
    assert.deepEqual(
      LAND_PURCHASE_PACKAGES.map((landPackage) => ({
        key: landPackage.key,
        sizeM2: landPackage.sizeM2,
        cooldownHours: landPackage.cooldownHours,
        cooldownMinutes: landPackage.cooldownMinutes,
        label: landPackage.label,
      })),
      [
        {
          key: "LAND_500",
          sizeM2: 500,
          cooldownHours: 0,
          cooldownMinutes: 0,
          label: "500 m2",
        },
        {
          key: "LAND_1000",
          sizeM2: 1_000,
          cooldownHours: 6,
          cooldownMinutes: 360,
          label: "1,000 m2",
        },
        {
          key: "LAND_5000",
          sizeM2: 5_000,
          cooldownHours: 24,
          cooldownMinutes: 1_440,
          label: "5,000 m2",
        },
        {
          key: "LAND_10000",
          sizeM2: 10_000,
          cooldownHours: 48,
          cooldownMinutes: 2_880,
          label: "10,000 m2",
        },
      ],
    );
  });

  it("looks up packages by stable key and size", () => {
    assert.equal(getLandPurchasePackage("LAND_500")?.sizeM2, 500);
    assert.equal(getLandPurchasePackage("LAND_1000")?.cooldownHours, 6);
    assert.equal(getLandPurchasePackageBySize(5_000)?.key, "LAND_5000");
    assert.equal(getLandPurchasePackageBySize(10_000)?.label, "10,000 m2");
  });

  it("rejects unsupported package keys and sizes", () => {
    assert.equal(getLandPurchasePackage("LAND_750"), null);
    assert.equal(getLandPurchasePackageBySize(750), null);
    assert.equal(isSupportedLandPackageSize(1_000), true);
    assert.equal(isSupportedLandPackageSize(1_500), false);
  });
});
