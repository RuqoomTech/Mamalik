"use client";

import { useEffect, useState } from "react";

const TICK_MS = 10 * 60 * 1000;
// The scheduler fires one minute into each 10-minute slot.
const SCHEDULE_OFFSET_MS = 60 * 1000;

function getMsUntilNextTick(now: number): number {
  const slotStart = Math.floor((now - SCHEDULE_OFFSET_MS) / TICK_MS) * TICK_MS + SCHEDULE_OFFSET_MS;

  return slotStart + TICK_MS - now;
}

function formatRemaining(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function NextTickCountdown() {
  const [remainingMs, setRemainingMs] = useState<number | null>(null);

  useEffect(() => {
    const update = () => setRemainingMs(getMsUntilNextTick(Date.now()));

    update();
    const interval = window.setInterval(update, 1000);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <p className="text-xs text-mk-muted" title="Resources, construction, and training advance every 10 minutes">
      Next tick in{" "}
      <span className="font-semibold tabular-nums text-mk-ink">
        {remainingMs === null ? "–:––" : formatRemaining(remainingMs)}
      </span>
    </p>
  );
}
