import {
  getLandPurchasePackage,
  type LandPackageKey,
} from "./land-packages";

const HOUR_MS = 60 * 60 * 1000;

export function getLandPackageCooldownMs(packageKey: LandPackageKey): number {
  return getLandPackageCooldownHours(packageKey) * HOUR_MS;
}

export function getLandPackageCooldownHours(packageKey: LandPackageKey): number {
  const landPackage = getLandPurchasePackage(packageKey);

  if (!landPackage) {
    throw new RangeError(`Unsupported land package key: ${packageKey}`);
  }

  return landPackage.cooldownHours;
}

export function getNextLandPurchaseAvailableAt(now: Date, packageKey: LandPackageKey): Date {
  return new Date(requireValidDate(now, "now").getTime() + getLandPackageCooldownMs(packageKey));
}

export function isLandPackageOnCooldown(now: Date, cooldownUntil: Date | null | undefined): boolean {
  if (!cooldownUntil) {
    return false;
  }

  const nowMs = requireValidDate(now, "now").getTime();
  const cooldownUntilMs = cooldownUntil.getTime();

  if (!Number.isFinite(cooldownUntilMs)) {
    return false;
  }

  return cooldownUntilMs > nowMs;
}

function requireValidDate(date: Date, label: string): Date {
  if (!Number.isFinite(date.getTime())) {
    throw new RangeError(`Invalid ${label} date.`);
  }

  return date;
}
