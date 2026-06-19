import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { formatTickRunResult, isDuplicateTickInsert, toErrorMessage } from "./tick-log";

describe("tick log helpers", () => {
  it("detects duplicate tick insert results", () => {
    assert.equal(isDuplicateTickInsert(0), true);
    assert.equal(isDuplicateTickInsert(1), false);
  });

  it("formats tick results with stable summary fields", () => {
    const summary = formatTickRunResult({
      tickKey: "2026-06-19T12:30:00.000Z",
      status: "COMPLETED",
      processedKingdomCount: 2,
      startedAt: new Date("2026-06-19T12:31:00.000Z"),
      finishedAt: new Date("2026-06-19T12:31:01.000Z"),
    });

    assert.match(summary, /Tick key: 2026-06-19T12:30:00.000Z/);
    assert.match(summary, /Status: COMPLETED/);
    assert.match(summary, /Processed kingdoms: 2/);
  });

  it("normalizes unknown errors", () => {
    assert.equal(toErrorMessage(new Error("database unavailable")), "database unavailable");
    assert.equal(toErrorMessage("plain failure"), "plain failure");
    assert.equal(toErrorMessage(undefined), "Unknown tick worker error.");
  });
});
