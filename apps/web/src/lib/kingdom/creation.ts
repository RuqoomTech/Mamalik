import { randomUUID } from "node:crypto";
import {
  BEGINNER_PROTECTION_DAYS,
  STARTER_BUILDINGS,
  STARTING_DISTRICTS,
} from "@mamalik/game/constants";

const SLUG_MAX_LENGTH = 48;
const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1_000;

export function createKingdomSlug(name: string): string {
  const slug = name
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, SLUG_MAX_LENGTH)
    .replace(/^-+|-+$/g, "");

  return slug || "kingdom";
}

export function createUniqueKingdomSlug(name: string, existingSlugs: string[]): string {
  const baseSlug = createKingdomSlug(name);
  const takenSlugs = new Set(existingSlugs);

  if (!takenSlugs.has(baseSlug)) {
    return baseSlug;
  }

  for (let suffix = 2; suffix <= 999; suffix += 1) {
    const suffixText = `-${suffix}`;
    const candidate = `${baseSlug.slice(0, SLUG_MAX_LENGTH - suffixText.length)}${suffixText}`;

    if (!takenSlugs.has(candidate)) {
      return candidate;
    }
  }

  return `${baseSlug.slice(0, SLUG_MAX_LENGTH - 8)}-${randomUUID().slice(0, 7)}`;
}

export function createBeginnerProtectionEndsAt(now = new Date()): Date {
  return new Date(now.getTime() + BEGINNER_PROTECTION_DAYS * MILLISECONDS_PER_DAY);
}

export function getStarterUsedLandM2(): number {
  return STARTER_BUILDINGS.reduce((total, building) => total + building.landUsedM2, 0);
}

export function getStarterDistrictUsedLandM2(districtType: string): number {
  return STARTER_BUILDINGS.filter((building) => building.districtType === districtType).reduce(
    (total, building) => total + building.landUsedM2,
    0,
  );
}

export function getStarterDistrictLandTotalM2(): number {
  return STARTING_DISTRICTS.reduce((total, district) => total + district.allocatedLandM2, 0);
}
