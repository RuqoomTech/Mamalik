export const LAND_AREA_TYPES = ["STANDARD", "RURAL", "URBAN", "STRATEGIC"] as const;

export type LandAreaType = (typeof LAND_AREA_TYPES)[number];

export const DEFAULT_LAND_AREA_TYPE: LandAreaType = "STANDARD";

export const LAND_AREA_TYPE_LABELS: Record<LandAreaType, string> = {
  STANDARD: "Standard",
  RURAL: "Rural",
  URBAN: "Urban",
  STRATEGIC: "Strategic",
};

const LAND_AREA_TYPE_SET = new Set<string>(LAND_AREA_TYPES);

export function isLandAreaType(value: unknown): value is LandAreaType {
  return typeof value === "string" && LAND_AREA_TYPE_SET.has(value);
}

export function parseLandAreaType(value: unknown): LandAreaType | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalizedValue = value.toUpperCase();

  return isLandAreaType(normalizedValue) ? normalizedValue : null;
}

export function normalizeLandAreaType(value: unknown): LandAreaType {
  return parseLandAreaType(value) ?? DEFAULT_LAND_AREA_TYPE;
}

export function getLandAreaTypeLabel(areaType: LandAreaType | string | null | undefined): string {
  return LAND_AREA_TYPE_LABELS[normalizeLandAreaType(areaType)];
}
