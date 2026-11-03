import { TICK_DURATION_MINUTES } from "@mamalik/game";
import type { Locale } from "@/i18n/config";
import { fill, formatNumber, plural } from "@/i18n/format";
import type { ClientMessages } from "@/i18n/messages";

// Localized wording for game values. Pure functions shared by server and client components.

type Text = { locale: Locale; m: ClientMessages };

export function formatArea({ m }: Text, value: number): string {
  return fill(m.common.area, { n: value });
}

export function formatMoney({ m }: Text, value: number): string {
  return fill(m.common.money, { n: value });
}

export function formatCost({ m }: Text, cost: { money: number; manpower: number }): string {
  return fill(m.common.cost, { money: cost.money, manpower: cost.manpower });
}

export function formatSigned(value: number): string {
  return value > 0 ? `+${formatNumber(value)}` : formatNumber(value);
}

export function formatMinutes({ locale, m }: Text, totalMinutes: number): string {
  const minutesTotal = Math.max(0, Math.ceil(totalMinutes));

  if (minutesTotal < 1) {
    return m.time.lessThanMinute;
  }

  const days = Math.floor(minutesTotal / (24 * 60));
  const hours = Math.floor((minutesTotal % (24 * 60)) / 60);
  const minutes = minutesTotal % 60;
  const parts: string[] = [];

  if (days > 0) {
    parts.push(plural(locale, m.time.days, days));
  }

  if (hours > 0) {
    parts.push(plural(locale, m.time.hours, hours));
  }

  if (days === 0 && minutes > 0) {
    parts.push(plural(locale, m.time.minutes, minutes));
  }

  return parts.join(m.common.listSeparator);
}

// "~20 minutes" for a number of ticks.
export function formatTickDuration(text: Text, ticks: number): string {
  return fill(text.m.time.approx, { value: formatMinutes(text, Math.max(0, ticks) * TICK_DURATION_MINUTES) });
}

export function formatRemainingMs(text: Text, remainingMs: number): string {
  return formatMinutes(text, remainingMs / 60_000);
}

function lookup<T>(record: Record<string, T>, key: string): T | null {
  return Object.prototype.hasOwnProperty.call(record, key) ? record[key] : null;
}

export function buildingName({ m }: Text, type: string): string {
  return lookup(m.buildings, type)?.name ?? type;
}

export function buildingDescription({ m }: Text, type: string): string {
  return lookup(m.buildings, type)?.description ?? "";
}

export function unitName({ m }: Text, type: string): string {
  return lookup(m.units, type)?.name ?? type;
}

export function unitDescription({ m }: Text, type: string): string {
  return lookup(m.units, type)?.description ?? "";
}

export function districtName({ m }: Text, type: string): string {
  return lookup(m.districts, type) ?? type;
}

export function blockedReason({ m }: Text, reason: string | null): string | null {
  if (!reason) {
    return null;
  }

  return lookup(m.blocked, reason) ?? m.common.unavailable;
}

export type FoodStatusInput = {
  level: "healthy" | "warning" | "shortage";
  ticksUntilEmpty: number | null;
};

export function describeFoodStatus(
  text: Text,
  foodStatus: FoodStatusInput,
  netFoodPerTick: number,
): { label: string; detail: string } {
  const { m } = text;

  if (foodStatus.level === "shortage") {
    return m.food.shortage;
  }

  if (foodStatus.ticksUntilEmpty !== null) {
    const copy = foodStatus.level === "warning" ? m.food.warning : m.food.decreasing;

    return { label: copy.label, detail: fill(copy.detail, { time: formatTickDuration(text, foodStatus.ticksUntilEmpty) }) };
  }

  if (netFoodPerTick > 0) {
    return { label: m.food.increasing.label, detail: fill(m.food.increasing.detail, { n: netFoodPerTick }) };
  }

  return m.food.stable;
}

type JsonObject = Record<string, unknown>;

function isJsonObject(value: unknown): value is JsonObject {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

// One readable sentence for a report. Combat reports have their own detail views.
export function describeReport(text: Text, type: string, title: string, body: unknown): string {
  const { m } = text;
  const fallback = lookup(m.reports.fallback, type) ?? title;

  if (!isJsonObject(body)) {
    return fallback;
  }

  const number = (key: string) => (typeof body[key] === "number" ? (body[key] as number) : null);
  const string = (key: string) => (typeof body[key] === "string" ? (body[key] as string) : null);

  switch (type) {
    case "LAND_PURCHASE": {
      const size = number("packageSizeM2");
      const price = number("pricePaid");

      return size !== null && price !== null
        ? fill(m.reports.LAND_PURCHASE, { area: formatArea(text, size), price })
        : fallback;
    }
    case "DISTRICT_ALLOCATION": {
      const amount = number("amountM2");
      const district = string("districtType");

      return amount !== null && district
        ? fill(m.reports.DISTRICT_ALLOCATION, { area: formatArea(text, amount), district: districtName(text, district) })
        : fallback;
    }
    case "CONSTRUCTION": {
      const building = string("buildingType");
      const level = number("level");

      return building && level !== null
        ? fill(m.reports.CONSTRUCTION, { building: buildingName(text, building), level })
        : fallback;
    }
    case "TRAINING": {
      const unit = string("unitType");
      const quantity = number("quantity");

      return unit && quantity !== null
        ? fill(m.reports.TRAINING, { n: quantity, unit: unitName(text, unit) })
        : fallback;
    }
    default:
      return fallback;
  }
}
