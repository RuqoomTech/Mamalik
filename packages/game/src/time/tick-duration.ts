import { TICK_DURATION_MINUTES } from "../constants";

export function formatTicksAsDuration(
  remainingTicks: number,
  tickMinutes = TICK_DURATION_MINUTES,
): string {
  const ticks = toNonNegativeInteger(remainingTicks);
  const minutesPerTick = toPositiveInteger(tickMinutes, TICK_DURATION_MINUTES);
  const totalMinutes = ticks * minutesPerTick;

  if (totalMinutes <= 0) {
    return "~0 minutes";
  }

  if (totalMinutes < 60) {
    return `~${totalMinutes} minute${totalMinutes === 1 ? "" : "s"}`;
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const hourText = `${hours} hour${hours === 1 ? "" : "s"}`;

  if (minutes === 0) {
    return `~${hourText}`;
  }

  return `~${hourText} ${minutes} minute${minutes === 1 ? "" : "s"}`;
}

function toNonNegativeInteger(value: number): number {
  if (!Number.isFinite(value) || value <= 0) {
    return 0;
  }

  return Math.floor(value);
}

function toPositiveInteger(value: number, fallback: number): number {
  if (!Number.isFinite(value) || value <= 0) {
    return fallback;
  }

  return Math.floor(value);
}
