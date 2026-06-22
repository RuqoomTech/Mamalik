export const LAND_PACKAGE_KEYS = [
  "LAND_500",
  "LAND_1000",
  "LAND_5000",
  "LAND_10000",
] as const;

export type LandPackageKey = (typeof LAND_PACKAGE_KEYS)[number];

export type LandPackageSizeM2 = 500 | 1_000 | 5_000 | 10_000;

export type LandPurchasePackage = {
  key: LandPackageKey;
  sizeM2: LandPackageSizeM2;
  cooldownHours: number;
  cooldownMinutes: number;
  label: string;
};

export const LAND_PURCHASE_PACKAGES = [
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
    cooldownMinutes: 6 * 60,
    label: "1,000 m2",
  },
  {
    key: "LAND_5000",
    sizeM2: 5_000,
    cooldownHours: 24,
    cooldownMinutes: 24 * 60,
    label: "5,000 m2",
  },
  {
    key: "LAND_10000",
    sizeM2: 10_000,
    cooldownHours: 48,
    cooldownMinutes: 48 * 60,
    label: "10,000 m2",
  },
] as const satisfies readonly LandPurchasePackage[];

export const LAND_PURCHASE_PACKAGE_BY_KEY: Record<LandPackageKey, LandPurchasePackage> = {
  LAND_500: LAND_PURCHASE_PACKAGES[0],
  LAND_1000: LAND_PURCHASE_PACKAGES[1],
  LAND_5000: LAND_PURCHASE_PACKAGES[2],
  LAND_10000: LAND_PURCHASE_PACKAGES[3],
};

export const LAND_PURCHASE_PACKAGE_BY_SIZE: Record<LandPackageSizeM2, LandPurchasePackage> = {
  500: LAND_PURCHASE_PACKAGES[0],
  1000: LAND_PURCHASE_PACKAGES[1],
  5000: LAND_PURCHASE_PACKAGES[2],
  10000: LAND_PURCHASE_PACKAGES[3],
};

export function isLandPackageKey(value: string): value is LandPackageKey {
  return Object.prototype.hasOwnProperty.call(LAND_PURCHASE_PACKAGE_BY_KEY, value);
}

export function getLandPurchasePackage(packageKey: string): LandPurchasePackage | null {
  return isLandPackageKey(packageKey) ? LAND_PURCHASE_PACKAGE_BY_KEY[packageKey] : null;
}

export function getLandPurchasePackageBySize(sizeM2: number): LandPurchasePackage | null {
  if (!Number.isInteger(sizeM2)) {
    return null;
  }

  return Object.prototype.hasOwnProperty.call(LAND_PURCHASE_PACKAGE_BY_SIZE, sizeM2)
    ? LAND_PURCHASE_PACKAGE_BY_SIZE[sizeM2 as LandPackageSizeM2]
    : null;
}

export function isSupportedLandPackageSize(sizeM2: number): sizeM2 is LandPackageSizeM2 {
  return getLandPurchasePackageBySize(sizeM2) !== null;
}
