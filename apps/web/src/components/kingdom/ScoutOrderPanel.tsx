"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  createScoutOrderFormAction,
  type ScoutOrderActionState,
} from "@/app/dashboard/actions";
import type { ScoutTargetOption } from "@/lib/kingdom/scout-target-options";

type ScoutTargetDisabledReason = ScoutTargetOption["disabledReason"];

const initialState: ScoutOrderActionState = {
  status: "idle",
  message: "",
  targetKingdomId: null,
};

const numberFormatter = new Intl.NumberFormat("en-US");
const dateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "UTC",
});

function formatNumber(value: number): string {
  return numberFormatter.format(value);
}

function formatDistance(distanceM: number): string {
  if (!Number.isFinite(distanceM) || distanceM < 0) {
    return "Unknown distance";
  }

  if (distanceM < 1_000) {
    return `${formatNumber(Math.round(distanceM))} m`;
  }

  return `${formatNumber(Math.round(distanceM / 100) / 10)} km`;
}

function formatTicks(travelTicks: number): string {
  return `${formatNumber(travelTicks)} tick${travelTicks === 1 ? "" : "s"}`;
}

function formatArrival(arrivalAt: string): string {
  const date = new Date(arrivalAt);

  if (Number.isNaN(date.getTime())) {
    return "unknown";
  }

  return `${dateFormatter.format(date)} UTC`;
}

/**
 * Labels come from the shared validator's own failure reasons, so this panel
 * can never advertise a different rule than the mutation enforces.
 */
function getDisabledReasonLabel(target: ScoutTargetOption): string | null {
  const reason: ScoutTargetDisabledReason = target.disabledReason;

  switch (reason) {
    case "TARGET_PROTECTED":
      return target.protectionEndsAt
        ? `Under protection until ${formatArrival(target.protectionEndsAt)}`
        : "Under beginner protection";
    case "NOT_ENOUGH_SCOUTS":
      return "No scouts in garrison";
    case "SELF_TARGET":
      return "Your own kingdom";
    case "TARGET_NOT_FOUND":
      return "Kingdom unavailable";
    case "INVALID_TARGET":
      return "Invalid kingdom";
    case "INVALID_SCOUT_COUNT":
      return "Scout count invalid";
    case null:
      return null;
  }
}


function ScoutOrderButton({
  disabled,
  hasTargets,
  hasScoutableTarget,
  hasScouts,
}: {
  disabled: boolean;
  hasTargets: boolean;
  hasScoutableTarget: boolean;
  hasScouts: boolean;
}) {
  const { pending } = useFormStatus();

  let label = "Send scouts";

  if (pending) {
    label = "Sending...";
  } else if (!hasScouts) {
    label = "No scouts available";
  } else if (!hasTargets) {
    label = "No targets";
  } else if (!hasScoutableTarget) {
    label = "No scoutable targets";
  }

  return (
    <button
      className="mamalik-action-primary px-4 py-2 disabled:cursor-not-allowed disabled:opacity-60"
      disabled={disabled || pending}
      type="submit"
    >
      {label}
    </button>
  );
}

export function ScoutOrderPanel({
  targets,
  garrisonScouts,
}: {
  targets: ScoutTargetOption[];
  garrisonScouts: number;
}) {
  const [state, formAction] = useActionState(createScoutOrderFormAction, initialState);
  const hasScouts = garrisonScouts >= 1;
  const hasTargets = targets.length > 0;
  const hasScoutableTarget = targets.some((target) => target.canTarget);
  const defaultScoutCount = Math.max(Math.min(garrisonScouts, 1), 1);

  return (
    <div className="mamalik-card space-y-4 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-[#10140f]">Send scouts</h3>
          <p className="mt-1 text-sm text-[#5f665d]">
            Dispatch scouts from your garrison to a nearby kingdom. The order is recorded on
            dispatch and resolves later, once movement arrival handling ships.
          </p>
        </div>
        <span
          className={
            hasScouts
              ? "rounded-full border border-[#cbd8cd] bg-[#eff6ed] px-3 py-1 text-xs font-semibold text-[#183f35]"
              : "rounded-full border border-[#e7d6a0] bg-[#fff9e7] px-3 py-1 text-xs font-semibold text-[#6a4a0a]"
          }
        >
          {formatNumber(garrisonScouts)} scouts in garrison
        </span>
      </div>

      {hasTargets ? (
        <form action={formAction} className="grid gap-3 lg:grid-cols-[1fr_180px_auto] lg:items-end">
          <label className="grid gap-1 text-sm">
            <span className="font-medium text-[#10140f]">Target kingdom</span>
            <select className="mamalik-input" name="targetKingdomId" required>
              {targets.map((target) => {
                const disabledReasonLabel = getDisabledReasonLabel(target);

                return (
                  <option
                    disabled={!target.canTarget}
                    key={target.kingdomId}
                    value={target.kingdomId}
                  >
                    {target.kingdomName} - {formatDistance(target.distanceM)},{" "}
                    {formatTicks(target.travelTicks)}, arrives ~{formatArrival(target.arrivalAt)}
                    {disabledReasonLabel ? ` - ${disabledReasonLabel}` : ""}
                  </option>
                );
              })}
            </select>
          </label>

          <label className="grid gap-1 text-sm">
            <span className="font-medium text-[#10140f]">Scouts</span>
            <input
              className="mamalik-input"
              defaultValue={defaultScoutCount}
              inputMode="numeric"
              max={garrisonScouts}
              min={1}
              name="scoutCount"
              required
              step={1}
              type="number"
            />
          </label>

          <ScoutOrderButton
            disabled={!hasScouts || !hasTargets || !hasScoutableTarget}
            hasScoutableTarget={hasScoutableTarget}
            hasScouts={hasScouts}
            hasTargets={hasTargets}
          />
        </form>
      ) : (
        <p className="rounded-md border border-[#e7d6a0] bg-[#fff9e7] px-4 py-3 text-sm text-[#6a4a0a]">
          No other kingdoms are available to scout yet.
        </p>
      )}

      {!hasScouts && hasTargets ? (
        <p className="rounded-md border border-[#e7d6a0] bg-[#fff9e7] px-4 py-3 text-sm text-[#6a4a0a]">
          Train scouts before sending an order.
        </p>
      ) : null}

      {state.status !== "idle" ? (
        <div
          className={
            state.status === "success"
              ? "rounded-md border border-[#cbd8cd] bg-[#eff6ed] px-4 py-3 text-sm text-[#183f35]"
              : "rounded-md border border-[#e1b8b8] bg-[#fff0f0] px-4 py-3 text-sm text-[#7a1d1d]"
          }
        >
          <p className="font-semibold">
            {state.status === "success" ? "Scout order dispatched" : "Scout order failed"}
          </p>
          <p className="mt-1">{state.message}</p>
        </div>
      ) : null}
    </div>
  );
}