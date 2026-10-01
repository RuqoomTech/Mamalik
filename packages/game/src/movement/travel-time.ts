import { TICK_DURATION_MS } from "../constants";
import { calculateGreatCircleDistanceMeters, type GeoCoordinates } from "../map/distance";

export const MOVEMENT_ORDER_TYPES = ["SCOUT", "ATTACK", "RETURN"] as const;
export type MovementOrderType = (typeof MOVEMENT_ORDER_TYPES)[number];

export const MOVEMENT_UNIT_TYPES = [
  "INFANTRY",
  "ARCHERS",
  "CAVALRY",
  "SCOUTS",
  "SIEGE",
] as const;
export type MovementUnitType = (typeof MOVEMENT_UNIT_TYPES)[number];

/**
 * v0.1 balance placeholder, not a locked decision.
 *
 * The base pace is deliberately compressed relative to real-world marching
 * speed so that a half-world v0.1 order resolves in a couple of days instead
 * of a couple of weeks, while still keeping far targets clearly slower than
 * near ones. Retune these values as real playtest data arrives.
 */
export const MOVEMENT_BASE_METERS_PER_TICK = 60_000;

/** An order always consumes at least one tick, even for a very short trip. */
export const MOVEMENT_MIN_TRAVEL_TICKS = 1;

/** An army moves at the pace of its slowest unit, so unknowns fall back here. */
export const MOVEMENT_DEFAULT_UNIT_TYPE: MovementUnitType = "INFANTRY";

export const MOVEMENT_UNIT_SPEED_MULTIPLIER: Record<MovementUnitType, number> = {
  SCOUTS: 3,
  CAVALRY: 1.5,
  INFANTRY: 1,
  ARCHERS: 1,
  SIEGE: 0.5,
};

export type MovementTravelTime = {
  distanceM: number;
  travelTicks: number;
  speedMetersPerTick: number;
  slowestUnitType: MovementUnitType;
};

export function isMovementOrderType(value: string): value is MovementOrderType {
  return (MOVEMENT_ORDER_TYPES as readonly string[]).includes(value);
}

export function isMovementUnitType(value: string): value is MovementUnitType {
  return (MOVEMENT_UNIT_TYPES as readonly string[]).includes(value);
}

/** Distance in meters between a source and a target kingdom center. */
export function calculateMovementDistanceMeters(
  source: GeoCoordinates,
  target: GeoCoordinates,
): number {
  return Math.round(calculateGreatCircleDistanceMeters(source, target));
}

/**
 * Effective travel speed of an order. The whole force inherits the pace of its
 * slowest recognized unit so a mixed army is limited by its heavy units.
 */
export function getMovementSpeedMetersPerTick(
  unitTypes: readonly string[] = [],
): number {
  const slowestUnitType = getSlowestMovementUnitType(unitTypes);

  return Math.round(
    MOVEMENT_BASE_METERS_PER_TICK * MOVEMENT_UNIT_SPEED_MULTIPLIER[slowestUnitType],
  );
}

export function calculateTravelTime(input: {
  distanceM: number;
  unitTypes?: readonly string[];
}): MovementTravelTime {
  const distanceM = toNonNegativeInteger(input.distanceM);
  const speedMetersPerTick = getMovementSpeedMetersPerTick(input.unitTypes);
  const travelTicks = Math.max(
    MOVEMENT_MIN_TRAVEL_TICKS,
    Math.ceil(distanceM / speedMetersPerTick),
  );

  return {
    distanceM,
    travelTicks,
    speedMetersPerTick,
    slowestUnitType: getSlowestMovementUnitType(input.unitTypes),
  };
}

export function getMovementArrivalAt(departureAt: Date, travelTicks: number): Date {
  return addTicks(departureAt, travelTicks, "departureAt");
}

export function getMovementReturnAt(arrivalAt: Date, travelTicks: number): Date {
  return addTicks(arrivalAt, travelTicks, "arrivalAt");
}

function getSlowestMovementUnitType(unitTypes: readonly string[] = []): MovementUnitType {
  const recognizedUnitTypes = unitTypes.filter(isMovementUnitType);

  if (recognizedUnitTypes.length === 0) {
    return MOVEMENT_DEFAULT_UNIT_TYPE;
  }

  return recognizedUnitTypes.reduce((slowest, current) =>
    MOVEMENT_UNIT_SPEED_MULTIPLIER[current] < MOVEMENT_UNIT_SPEED_MULTIPLIER[slowest]
      ? current
      : slowest,
  );
}

function addTicks(date: Date, ticks: number, label: string): Date {
  if (!Number.isFinite(date.getTime())) {
    throw new RangeError(`Invalid ${label} date.`);
  }

  return new Date(date.getTime() + toNonNegativeInteger(ticks) * TICK_DURATION_MS);
}

function toNonNegativeInteger(value: number): number {
  if (!Number.isFinite(value) || value <= 0) {
    return 0;
  }

  return Math.floor(value);
}