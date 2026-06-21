import assert from "node:assert/strict";
import test from "node:test";
import { formatTicksAsDuration } from "./tick-duration";

test("formats ticks as minutes", () => {
  assert.equal(formatTicksAsDuration(1), "~10 minutes");
  assert.equal(formatTicksAsDuration(3), "~30 minutes");
});

test("formats ticks as whole hours", () => {
  assert.equal(formatTicksAsDuration(6), "~1 hour");
  assert.equal(formatTicksAsDuration(12), "~2 hours");
});

test("formats ticks with hours and minutes", () => {
  assert.equal(formatTicksAsDuration(7), "~1 hour 10 minutes");
});

test("clamps invalid tick counts to zero minutes", () => {
  assert.equal(formatTicksAsDuration(0), "~0 minutes");
  assert.equal(formatTicksAsDuration(-2), "~0 minutes");
  assert.equal(formatTicksAsDuration(Number.NaN), "~0 minutes");
});

test("uses a positive fallback for invalid custom tick duration", () => {
  assert.equal(formatTicksAsDuration(2, -5), "~20 minutes");
});
