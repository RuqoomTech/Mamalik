import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { getTickKey, getTickSlotStart, TICK_DURATION_MINUTES } from "./tick-clock";

describe("tick clock", () => {
  it("uses locked 10-minute tick duration", () => {
    assert.equal(TICK_DURATION_MINUTES, 10);
  });

  it("rounds down to the start of the current 10-minute slot", () => {
    const date = new Date("2026-06-19T12:39:59.999Z");

    assert.equal(getTickSlotStart(date).toISOString(), "2026-06-19T12:30:00.000Z");
  });

  it("keeps exact slot boundaries stable", () => {
    const date = new Date("2026-06-19T12:40:00.000Z");

    assert.equal(getTickKey(date), "2026-06-19T12:40:00.000Z");
  });

  it("changes keys across 10-minute boundaries", () => {
    const first = getTickKey(new Date("2026-06-19T12:39:59.999Z"));
    const second = getTickKey(new Date("2026-06-19T12:40:00.000Z"));

    assert.notEqual(first, second);
  });
});
