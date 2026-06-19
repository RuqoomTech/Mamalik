import { TICK_DURATION_MS, TICK_DURATION_MINUTES } from "../../../packages/game/src/constants";

export { TICK_DURATION_MS, TICK_DURATION_MINUTES };

export function getTickSlotStart(date: Date = new Date()): Date {
  const slotStartMs = Math.floor(date.getTime() / TICK_DURATION_MS) * TICK_DURATION_MS;
  return new Date(slotStartMs);
}

export function getTickKey(date: Date = new Date()): string {
  return getTickSlotStart(date).toISOString();
}
