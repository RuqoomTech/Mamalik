import type { PurchaseLandResult } from "./land-purchase";
import type { LandPurchaseOptionDisabledReason } from "./land-purchase-options";

const numberFormatter = new Intl.NumberFormat("en-US");
const dateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "UTC",
});

export function formatLandPurchaseCooldown(cooldownHours: number): string {
  if (!Number.isFinite(cooldownHours) || cooldownHours <= 0) {
    return "No cooldown";
  }

  return `${numberFormatter.format(cooldownHours)} hour${cooldownHours === 1 ? "" : "s"}`;
}

export function formatCooldownRemaining(cooldownRemainingMs: number): string {
  if (!Number.isFinite(cooldownRemainingMs) || cooldownRemainingMs <= 0) {
    return "Available now";
  }

  const totalMinutes = Math.ceil(cooldownRemainingMs / 60_000);
  const days = Math.floor(totalMinutes / (24 * 60));
  const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
  const minutes = totalMinutes % 60;
  const parts: string[] = [];

  if (days > 0) {
    parts.push(`${days} day${days === 1 ? "" : "s"}`);
  }

  if (hours > 0) {
    parts.push(`${hours} hour${hours === 1 ? "" : "s"}`);
  }

  if (days === 0 && minutes > 0) {
    parts.push(`${minutes} minute${minutes === 1 ? "" : "s"}`);
  }

  return parts.length > 0 ? `~${parts.join(", ")}` : "Available now";
}

export function formatCooldownAvailableAt(cooldownUntil: string | null): string | null {
  if (!cooldownUntil) {
    return null;
  }

  const date = new Date(cooldownUntil);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return `${dateFormatter.format(date)} UTC`;
}

export function getLandPurchaseDisabledReasonLabel(
  reason: LandPurchaseOptionDisabledReason | null,
): string {
  switch (reason) {
    case "MISSING_STOCKPILE":
      return "Resource stockpile missing";
    case "INSUFFICIENT_MONEY":
      return "Not enough Money";
    case "COOLDOWN_ACTIVE":
      return "Cooldown active";
    case null:
      return "Available";
  }
}

export function getPurchaseLandResultMessage(result: PurchaseLandResult): string {
  if (!result.ok) {
    return result.message;
  }

  const cooldownText = result.cooldownUntil
    ? ` Cooldown ends ${formatCooldownAvailableAt(result.cooldownUntil) ?? result.cooldownUntil}.`
    : "";

  return `Purchased ${numberFormatter.format(result.packageSizeM2)} m2 for ${numberFormatter.format(
    result.pricePaid,
  )} Money. Usable land is now ${numberFormatter.format(result.newUsableLandM2)} m2.${cooldownText}`;
}
