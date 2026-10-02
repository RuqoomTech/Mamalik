/**
 * Basic battle formula for S5-006.
 *
 * v0.1 BALANCE PLACEHOLDERS, not locked decisions: the per-unit attack and
 * defense values below are deliberately simple so an attack can resolve at
 * all. Retune them against real playtest data.
 *
 * S5-006 owns ONLY the raw unit power comparison. Defender multipliers from
 * WALL, WATCHTOWER, Defensive District land, and defense tech belong to
 * S5-007, and the SIEGE requirement for high-level walls belongs to S5-008.
 * Nothing here reads buildings, districts, tech, land, or reports.
 *
 * DETERMINISM IS REQUIRED, not incidental: a tick can be retried and a battle
 * must not change on replay. So this module uses no `Math.random()`, no
 * `Date.now()`, no clock reads, and no external state of any kind.
 */

import { isMovementUnitType, type MovementUnitType } from "./travel-time";

/**
 * v0.1 balance placeholders, not locked decisions.
 *
 * Base attack power of one unit of each type. An attacker's army power is the
 * sum of `quantity * UNIT_BASE_ATTACK[unitType]` over its normalized manifest.
 */
export const UNIT_BASE_ATTACK: Record<MovementUnitType, number> = {
  INFANTRY: 5,
  ARCHERS: 6,
  CAVALRY: 9,
  SCOUTS: 2,
  SIEGE: 14,
};

/**
 * v0.1 balance placeholders, not locked decisions.
 *
 * Base defense power of one unit of each type. A defender's garrison power is
 * the sum of `quantity * UNIT_BASE_DEFENSE[unitType]` over its normalized
 * manifest.
 */
export const UNIT_BASE_DEFENSE: Record<MovementUnitType, number> = {
  INFANTRY: 6,
  ARCHERS: 3,
  CAVALRY: 5,
  SCOUTS: 2,
  SIEGE: 3,
};

/** v0.1 balance placeholders, not locked decisions. */
export const BATTLE_WINNER_LOSS_RATE = 0.1;
export const BATTLE_LOSER_LOSS_RATE = 0.3;

/** One line of a battle army: a unit type and how many of it fight. */
export type BattleArmyEntry = {
  unitType: string;
  quantity: number;
};

export type BattleWinner = "ATTACKER" | "DEFENDER";

export type BattleResult = {
  attackerPower: number;
  defenderPower: number;
  winner: BattleWinner;
  /** Units lost per aggregated unit type, one entry per type that fought. */
  attackerLosses: BattleArmyEntry[];
  defenderLosses: BattleArmyEntry[];
  /** Units that survived per aggregated unit type. */
  attackerSurvivors: BattleArmyEntry[];
  defenderSurvivors: BattleArmyEntry[];
  attackerUnitsLost: number;
  defenderUnitsLost: number;
  attackerUnitsSurvived: number;
  defenderUnitsSurvived: number;
};

/**
 * Sum `quantity * base` for one side of a battle.
 *
 * Hostile entries are dropped, never repaired: unknown unit types,
 * non-object entries, and non-positive / non-finite / fractional quantities
 * (floored, then dropped when the floor is not positive) contribute zero.
 * An empty or non-array manifest has zero power.
 */
export function calculateArmyPower(
  units: readonly BattleArmyEntry[] | null | undefined,
  side: BattleWinner,
): number {
  if (!Array.isArray(units)) {
    return 0;
  }

  const baseTable = side === "ATTACKER" ? UNIT_BASE_ATTACK : UNIT_BASE_DEFENSE;
  let total = 0;

  for (const rawEntry of units) {
    if (typeof rawEntry !== "object" || rawEntry === null) {
      continue;
    }

    const entry = rawEntry as Record<string, unknown>;

    if (typeof entry.unitType !== "string" || !isMovementUnitType(entry.unitType)) {
      continue;
    }

    const quantity = toPositiveFloor(entry.quantity);

    if (quantity <= 0) {
      continue;
    }

    total += quantity * baseTable[entry.unitType];
  }

  return total;
}

/**
 * Resolve a basic S5-006 battle.
 *
 * - Power is the raw unit comparison from `calculateArmyPower`, with no
 *   building, district, tech, or siege adjustments (those are S5-007/S5-008).
 * - The attacker wins only on strictly greater power; ties hold for the
 *   defender, and an empty-versus-empty battle is a defender hold.
 * - Casualties are per aggregated unit type: the winner loses
 *   `floor(quantity * 0.1)` and the loser loses `floor(quantity * 0.3)`.
 *   Survivors are `quantity - losses`, never negative.
 */
export function resolveBasicBattle(input: {
  attackers: readonly BattleArmyEntry[] | null | undefined;
  defenders: readonly BattleArmyEntry[] | null | undefined;
}): BattleResult {
  const attackers = Array.isArray(input.attackers) ? input.attackers : [];
  const defenders = Array.isArray(input.defenders) ? input.defenders : [];

  const attackerPower = calculateArmyPower(attackers, "ATTACKER");
  const defenderPower = calculateArmyPower(defenders, "DEFENDER");
  const winner: BattleWinner = attackerPower > defenderPower ? "ATTACKER" : "DEFENDER";

  const attackerTotals = aggregateArmy(attackers);
  const defenderTotals = aggregateArmy(defenders);

  const attackerRate = winner === "ATTACKER" ? BATTLE_WINNER_LOSS_RATE : BATTLE_LOSER_LOSS_RATE;
  const defenderRate = winner === "DEFENDER" ? BATTLE_WINNER_LOSS_RATE : BATTLE_LOSER_LOSS_RATE;

  const attackerLosses = toLossEntries(attackerTotals, attackerRate);
  const defenderLosses = toLossEntries(defenderTotals, defenderRate);
  const attackerSurvivors = toSurvivorEntries(attackerTotals, attackerLosses);
  const defenderSurvivors = toSurvivorEntries(defenderTotals, defenderLosses);

  return {
    attackerPower,
    defenderPower,
    winner,
    attackerLosses,
    defenderLosses,
    attackerSurvivors,
    defenderSurvivors,
    attackerUnitsLost: sumQuantities(attackerLosses),
    defenderUnitsLost: sumQuantities(defenderLosses),
    attackerUnitsSurvived: sumQuantities(attackerSurvivors),
    defenderUnitsSurvived: sumQuantities(defenderSurvivors),
  };
}

/**
 * Sum a manifest by unit type so duplicate entries collapse into one
 * requirement per unit type before power and casualty math.
 */
function aggregateArmy(units: readonly BattleArmyEntry[]): Map<MovementUnitType, number> {
  const totals = new Map<MovementUnitType, number>();

  for (const rawEntry of units) {
    if (typeof rawEntry !== "object" || rawEntry === null) {
      continue;
    }

    const entry = rawEntry as Record<string, unknown>;

    if (typeof entry.unitType !== "string" || !isMovementUnitType(entry.unitType)) {
      continue;
    }

    const quantity = toPositiveFloor(entry.quantity);

    if (quantity <= 0) {
      continue;
    }

    totals.set(entry.unitType, (totals.get(entry.unitType) ?? 0) + quantity);
  }

  return totals;
}

function toLossEntries(totals: Map<MovementUnitType, number>, rate: number): BattleArmyEntry[] {
  const entries: BattleArmyEntry[] = [];

  for (const [unitType, quantity] of [...totals.entries()].sort(([a], [b]) =>
    a.localeCompare(b),
  )) {
    entries.push({ unitType, quantity: Math.floor(quantity * rate) });
  }

  return entries;
}

function toSurvivorEntries(
  totals: Map<MovementUnitType, number>,
  losses: BattleArmyEntry[],
): BattleArmyEntry[] {
  const lossByType = new Map(losses.map((entry) => [entry.unitType, entry.quantity]));
  const survivors: BattleArmyEntry[] = [];

  for (const [unitType, quantity] of [...totals.entries()].sort(([a], [b]) =>
    a.localeCompare(b),
  )) {
    const lost = lossByType.get(unitType) ?? 0;
    survivors.push({ unitType, quantity: Math.max(0, quantity - lost) });
  }

  return survivors;
}

function sumQuantities(entries: readonly BattleArmyEntry[]): number {
  return entries.reduce((total, entry) => total + entry.quantity, 0);
}

/**
 * Floor a manifest quantity to a positive whole number, or zero when the
 * input is not a usable count. Non-numbers, non-finite values, and values
 * below one (including fractions that floor to zero such as 0.5) collapse to
 * zero so callers can drop them with a single `<= 0` check.
 */
function toPositiveFloor(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 1) {
    return 0;
  }

  return Math.floor(value);
}
