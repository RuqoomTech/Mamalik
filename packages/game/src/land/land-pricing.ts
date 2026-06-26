import { getLandPurchasePackageBySize } from "./land-packages";
import {
  normalizeLandAreaType,
  type LandAreaType,
} from "./area-type";

export type LandPriceInput = {
  currentUsableLandM2: number;
  packageSizeM2: number;
  areaType: LandAreaType | string | null | undefined;
};

export type LandPriceResult = {
  basePrice: number;
  sizeMultiplier: number;
  areaMultiplier: number;
  totalPrice: number;
};

export const LAND_BASE_PRICE_PER_M2 = 2;

export const LAND_AREA_MULTIPLIERS: Record<LandAreaType, number> = {
  STANDARD: 1,
  RURAL: 0.8,
  URBAN: 1.5,
  STRATEGIC: 2,
};

export function calculateLandPrice(input: LandPriceInput): LandPriceResult {
  const landPackage = getLandPurchasePackageBySize(input.packageSizeM2);

  if (!landPackage) {
    throw new RangeError(`Unsupported land package size: ${input.packageSizeM2}`);
  }

  const basePrice = landPackage.sizeM2 * LAND_BASE_PRICE_PER_M2;
  const sizeMultiplier = getKingdomSizeMultiplier(input.currentUsableLandM2);
  const areaMultiplier = LAND_AREA_MULTIPLIERS[normalizeLandAreaType(input.areaType)];

  return {
    basePrice,
    sizeMultiplier,
    areaMultiplier,
    totalPrice: roundLandPrice(basePrice * sizeMultiplier * areaMultiplier),
  };
}

export function getKingdomSizeMultiplier(currentUsableLandM2: number): number {
  const land = toNonNegativeInteger(currentUsableLandM2);

  if (land >= 1_000_000) {
    return 2;
  }

  if (land >= 500_000) {
    return 1.5;
  }

  if (land >= 100_000) {
    return 1.25;
  }

  return 1;
}

export function roundLandPrice(value: number): number {
  if (!Number.isFinite(value) || value <= 0) {
    return 0;
  }

  return Math.ceil(value);
}

function toNonNegativeInteger(value: number): number {
  if (!Number.isFinite(value) || value <= 0) {
    return 0;
  }

  return Math.floor(value);
}
