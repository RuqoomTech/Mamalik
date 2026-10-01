import assert from "node:assert/strict";
import test from "node:test";
import { TICK_DURATION_MS } from "../constants";
import {
  MOVEMENT_BASE_METERS_PER_TICK,
  MOVEMENT_MIN_TRAVEL_TICKS,
  calculateMovementDistanceMeters,
  calculateTravelTime,
  getMovementArrivalAt,
  getMovementReturnAt,
  getMovementSpeedMetersPerTick,
  isMovementOrderType,
  isMovementUnitType,
} from "./travel-time";

const RIYADH = { lat: 24.7136, lng: 46.6753 };
const LONDON = { lat: 51.5072, lng: -0.1276 };

test("recognizes supported order and unit types", () => {
  assert.equal(isMovementOrderType("SCOUT"), true);
  assert.equal(isMovementOrderType("ATTACK"), true);
  assert.equal(isMovementOrderType("RETURN"), true);
  assert.equal(isMovementOrderType("RAID"), false);
  assert.equal(isMovementUnitType("SIEGE"), true);
  assert.equal(isMovementUnitType("DRAGON"), false);
});

test("rounds movement distance to whole meters", () => {
  const distanceM = calculateMovementDistanceMeters(RIYADH, LONDON);

  assert.equal(Number.isInteger(distanceM), true);
  assert.ok(distanceM > 4_800_000);
  assert.ok(distanceM < 5_200_000);
});

test("resolves unit speed multipliers against the base pace", () => {
  assert.equal(getMovementSpeedMetersPerTick(["INFANTRY"]), MOVEMENT_BASE_METERS_PER_TICK);
  assert.equal(getMovementSpeedMetersPerTick(["SCOUTS"]), MOVEMENT_BASE_METERS_PER_TICK * 3);
  assert.equal(getMovementSpeedMetersPerTick(["SIEGE"]), MOVEMENT_BASE_METERS_PER_TICK / 2);
});

test("moves an order at the pace of its slowest unit", () => {
  assert.equal(
    getMovementSpeedMetersPerTick(["CAVALRY", "SIEGE", "SCOUTS"]),
    getMovementSpeedMetersPerTick(["SIEGE"]),
  );
});

test("falls back to the default unit pace for empty or unknown unit lists", () => {
  assert.equal(getMovementSpeedMetersPerTick([]), getMovementSpeedMetersPerTick(["INFANTRY"]));
  assert.equal(
    getMovementSpeedMetersPerTick(["DRAGON"]),
    getMovementSpeedMetersPerTick(["INFANTRY"]),
  );
});

test("gives longer trips more travel ticks", () => {
  const near = calculateTravelTime({ distanceM: 50_000, unitTypes: ["INFANTRY"] });
  const far = calculateTravelTime({ distanceM: 5_000_000, unitTypes: ["INFANTRY"] });

  assert.ok(near.travelTicks < far.travelTicks);
  assert.equal(near.travelTicks, Math.ceil(50_000 / MOVEMENT_BASE_METERS_PER_TICK));
});

test("keeps global attacks slow but bounded to days, not weeks", () => {
  const halfWorld = calculateTravelTime({ distanceM: 20_000_000, unitTypes: ["INFANTRY"] });

  assert.ok(halfWorld.travelTicks > 300);
  assert.ok(halfWorld.travelTicks < 400);
});

test("lets scouts cover ground faster than siege trains", () => {
  const distanceM = 600_000;

  assert.ok(
    calculateTravelTime({ distanceM, unitTypes: ["SCOUTS"] }).travelTicks <
      calculateTravelTime({ distanceM, unitTypes: ["SIEGE"] }).travelTicks,
  );
});

test("rounds distance down to whole meters and never returns fractional ticks", () => {
  const travel = calculateTravelTime({ distanceM: 1_000.7, unitTypes: ["INFANTRY"] });

  assert.equal(travel.distanceM, 1_000);
  assert.equal(Number.isInteger(travel.travelTicks), true);
});

test("clamps zero and invalid distance to the minimum travel time", () => {
  for (const distanceM of [0, -500, Number.NaN, Number.POSITIVE_INFINITY]) {
    const travel = calculateTravelTime({ distanceM, unitTypes: ["INFANTRY"] });

    assert.equal(travel.distanceM, 0);
    assert.equal(travel.travelTicks, MOVEMENT_MIN_TRAVEL_TICKS);
  }
});

test("adds whole 10-minute ticks to arrival and return times", () => {
  const departureAt = new Date("2026-10-01T00:00:00.000Z");
  const arrivalAt = getMovementArrivalAt(departureAt, 3);

  assert.equal(arrivalAt.getTime(), departureAt.getTime() + 3 * TICK_DURATION_MS);
  assert.equal(
    getMovementReturnAt(arrivalAt, 3).getTime(),
    arrivalAt.getTime() + 3 * TICK_DURATION_MS,
  );
});

test("clamps negative and invalid tick counts to zero elapsed time", () => {
  const departureAt = new Date("2026-10-01T00:00:00.000Z");

  assert.equal(getMovementArrivalAt(departureAt, -4).getTime(), departureAt.getTime());
  assert.equal(getMovementArrivalAt(departureAt, Number.NaN).getTime(), departureAt.getTime());
});

test("rejects invalid movement dates", () => {
  assert.throws(() => getMovementArrivalAt(new Date("invalid"), 1), RangeError);
  assert.throws(() => getMovementReturnAt(new Date("invalid"), 1), RangeError);
});

test("derives travel ticks from a real Riyadh to London movement", () => {
  const distanceM = calculateMovementDistanceMeters(RIYADH, LONDON);
  const travel = calculateTravelTime({ distanceM, unitTypes: ["CAVALRY"] });

  assert.equal(travel.slowestUnitType, "CAVALRY");
  assert.equal(
    travel.travelTicks,
    Math.ceil(distanceM / getMovementSpeedMetersPerTick(["CAVALRY"])),
  );
});