import {
  LAND_PURCHASE_PACKAGES,
  calculateLandPrice,
  isLandPackageOnCooldown,
} from "@mamalik/game";

export type LandPurchaseOptionDisabledReason =
  | "MISSING_STOCKPILE"
  | "INSUFFICIENT_MONEY"
  | "COOLDOWN_ACTIVE";

export type LandPurchaseOption = {
  packageKey: string;
  label: string;
  sizeM2: number;
  cooldownHours: number;
  price: ReturnType<typeof calculateLandPrice>;
  cooldownUntil: string | null;
  cooldownRemainingMs: number;
  canAfford: boolean;
  canBuyNow: boolean;
  disabledReason: LandPurchaseOptionDisabledReason | null;
};

export type LandPurchaseOptionsInput = {
  kingdom: {
    usableLandM2: number;
    areaType: string | null;
  };
  stockpile: {
    money: number;
  } | null;
  cooldowns: Array<{
    packageSizeM2: number;
    availableAt: Date;
  }>;
  now: Date;
};

export function createLandPurchaseOptions(input: LandPurchaseOptionsInput): LandPurchaseOption[] {
  return LAND_PURCHASE_PACKAGES.map((landPackage) => {
    const price = calculateLandPrice({
      currentUsableLandM2: input.kingdom.usableLandM2,
      packageSizeM2: landPackage.sizeM2,
      areaType: input.kingdom.areaType,
    });
    const cooldown = input.cooldowns.find(
      (currentCooldown) => currentCooldown.packageSizeM2 === landPackage.sizeM2,
    );
    const cooldownUntil =
      landPackage.cooldownHours > 0 && cooldown ? cooldown.availableAt : null;
    const onCooldown = landPackage.cooldownHours > 0
      ? isLandPackageOnCooldown(input.now, cooldownUntil)
      : false;
    const cooldownRemainingMs = cooldownUntil && onCooldown
      ? Math.max(0, cooldownUntil.getTime() - input.now.getTime())
      : 0;
    const canAfford = input.stockpile ? input.stockpile.money >= price.totalPrice : false;
    const disabledReason = getDisabledReason({
      hasStockpile: input.stockpile !== null,
      canAfford,
      onCooldown,
    });

    return {
      packageKey: landPackage.key,
      label: landPackage.label,
      sizeM2: landPackage.sizeM2,
      cooldownHours: landPackage.cooldownHours,
      price,
      cooldownUntil: cooldownUntil?.toISOString() ?? null,
      cooldownRemainingMs,
      canAfford,
      canBuyNow: disabledReason === null,
      disabledReason,
    };
  });
}

function getDisabledReason(input: {
  hasStockpile: boolean;
  canAfford: boolean;
  onCooldown: boolean;
}): LandPurchaseOptionDisabledReason | null {
  if (!input.hasStockpile) {
    return "MISSING_STOCKPILE";
  }

  if (input.onCooldown) {
    return "COOLDOWN_ACTIVE";
  }

  if (!input.canAfford) {
    return "INSUFFICIENT_MONEY";
  }

  return null;
}
