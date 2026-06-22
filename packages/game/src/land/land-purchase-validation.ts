import { isLandPackageOnCooldown } from "./land-cooldowns";
import {
  getLandPurchasePackage,
} from "./land-packages";
import {
  calculateLandPrice,
  type LandPriceResult,
} from "./land-pricing";

export type LandPurchaseValidationInput = {
  packageKey: string;
  kingdom: {
    usableLandM2: number;
    areaType: string | null;
  } | null;
  stockpile: {
    money: number;
  } | null;
  cooldownAvailableAt: Date | null | undefined;
  now: Date;
};

export type LandPurchaseValidationFailureReason =
  | "INVALID_PACKAGE"
  | "MISSING_KINGDOM"
  | "MISSING_STOCKPILE"
  | "INSUFFICIENT_MONEY"
  | "COOLDOWN_ACTIVE";

export type LandPurchaseValidationResult =
  | {
      ok: true;
      packageSizeM2: number;
      price: LandPriceResult;
      cooldownHours: number;
    }
  | {
      ok: false;
      reason: LandPurchaseValidationFailureReason;
    };

export function validateLandPurchase(input: LandPurchaseValidationInput): LandPurchaseValidationResult {
  const landPackage = getLandPurchasePackage(input.packageKey);

  if (!landPackage) {
    return { ok: false, reason: "INVALID_PACKAGE" };
  }

  if (!input.kingdom) {
    return { ok: false, reason: "MISSING_KINGDOM" };
  }

  if (!input.stockpile) {
    return { ok: false, reason: "MISSING_STOCKPILE" };
  }

  if (isLandPackageOnCooldown(input.now, input.cooldownAvailableAt)) {
    return { ok: false, reason: "COOLDOWN_ACTIVE" };
  }

  const price = calculateLandPrice({
    currentUsableLandM2: input.kingdom.usableLandM2,
    packageSizeM2: landPackage.sizeM2,
    areaType: input.kingdom.areaType,
  });

  if (toNonNegativeInteger(input.stockpile.money) < price.totalPrice) {
    return { ok: false, reason: "INSUFFICIENT_MONEY" };
  }

  return {
    ok: true,
    packageSizeM2: landPackage.sizeM2,
    price,
    cooldownHours: landPackage.cooldownHours,
  };
}

function toNonNegativeInteger(value: number): number {
  if (!Number.isFinite(value) || value <= 0) {
    return 0;
  }

  return Math.floor(value);
}
