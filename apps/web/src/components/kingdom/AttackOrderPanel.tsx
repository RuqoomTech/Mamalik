"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  createAttackOrderFormAction,
  type AttackOrderActionState,
} from "@/app/dashboard/actions";
import type {
  AttackArmyStackOption,
  AttackTargetOption,
} from "@/lib/kingdom/attack-target-options";

type AttackTargetDisabledReason = AttackTargetOption["disabledReason"];

const initialState: AttackOrderActionState = {
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
 * Labels come from the shared validator's own failure reasons, so this panel can
 * never advertise a different rule than the mutation enforces. Un-attackable
 * kingdoms stay VISIBLE in the dropdown so the player can see that the kingdom
 * exists and why it cannot be attacked.
 */
function getDisabledReasonLabel(target: AttackTargetOption): string | null {
  const reason: AttackTargetDisabledReason = target.disabledReason;

  switch (reason) {
    case "TARGET_PROTECTED":
      return target.protectionEndsAt
        ? `Under protection until ${formatArrival(target.protectionEndsAt)}`
        : "Under beginner protection";
    case "SELF_TARGET":
      return "Your own kingdom";
    case "TARGET_NOT_FOUND":
      return "Kingdom unavailable";
    case "INVALID_TARGET":
      return "Invalid kingdom";
    case "INVALID_ARMY":
      return "Select at least one unit to send";
    case "INVALID_UNIT_TYPE":
      return "Army not available";
    case "INSUFFICIENT_UNITS":
      return "Not enough units in garrison";
    case null:
      return null;
    default:
      return "Not available";
  }
}


/**
 * Display-only read of one quantity input, used for the live "N units
 * marching" summary. It drops the same shapes the server action drops so the
 * summary cannot promise an army the submission will not contain.
 *
 * This is NOT the rule of record: the shared `validateAttackOrder` re-validates
 * and re-normalizes every line server-side, and it is the only authority.
 */
function readComposedQuantity(rawValue: string): number | null {
  const trimmedValue = rawValue.trim();

  // The same digits-only rule the server action applies, so the summary and the
  // submitted manifest can never disagree about what was composed.
  if (!/^\d+$/.test(trimmedValue)) {
    return null;
  }

  const quantity = Number(trimmedValue);

  if (!Number.isSafeInteger(quantity) || quantity < 1) {
    return null;
  }

  return quantity;
}

function AttackOrderButton({
  disabled,
  hasArmyStacks,
  hasTargets,
  hasAttackableTarget,
  totalUnits,
}: {
  disabled: boolean;
  hasArmyStacks: boolean;
  hasTargets: boolean;
  hasAttackableTarget: boolean;
  totalUnits: number;
}) {
  const { pending } = useFormStatus();

  let label = "Dispatch attack";

  if (pending) {
    label = "Dispatching...";
  } else if (!hasTargets) {
    label = "No targets";
  } else if (!hasAttackableTarget) {
    label = "No attackable targets";
  } else if (!hasArmyStacks) {
    label = "No units in garrison";
  } else if (totalUnits === 0) {
    label = "Compose an army to attack";
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


export function AttackOrderPanel({
  targets,
  armyStacks,
}: {
  targets: AttackTargetOption[];
  armyStacks: AttackArmyStackOption[];
}) {
  const [state, formAction] = useActionState(createAttackOrderFormAction, initialState);
  // Raw input text is kept as typed rather than coerced to a number on every
  // keystroke, so a half-typed value stays visible and editable.
  const [quantities, setQuantities] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};

    // Defaulting every stack to "send everything" makes the common case a
    // single click on Dispatch, and matches the Send all button below.
    for (const stack of armyStacks) {
      initial[stack.unitType] = stack.quantity > 0 ? String(stack.quantity) : "";
    }

    return initial;
  });

  const hasTargets = targets.length > 0;
  const hasAttackableTarget = targets.some((target) => target.canTarget);
  const hasArmyStacks = armyStacks.length > 0;

  // Totals only. A mixed army travels at the pace of its SLOWEST unit, and that
  // rule (with the speed table behind it) lives in `packages/game`, not here.
  // Re-deriving it in this component would duplicate a game rule and could
  // drift from the shared validator, so the summary stops at totals and the
  // server reports the slowest unit type, travel time, and arrival when it
  // accepts the order.
  const totalUnits = armyStacks.reduce((total, stack) => {
    return total + (readComposedQuantity(quantities[stack.unitType] ?? "") ?? 0);
  }, 0);

  const sendAll = () => {
    setQuantities((current) => {
      const next: Record<string, string> = { ...current };

      for (const stack of armyStacks) {
        next[stack.unitType] = stack.quantity > 0 ? String(stack.quantity) : "";
      }

      return next;
    });
  };

  const sendNone = () => {
    setQuantities((current) => {
      const next: Record<string, string> = { ...current };

      for (const stack of armyStacks) {
        next[stack.unitType] = "";
      }

      return next;
    });
  };

  return (
    <div className="mamalik-card space-y-4 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-[#10140f]">Send an attack</h3>
          <p className="mt-1 text-sm text-[#5f665d]">
            Dispatch an army from your garrison against another kingdom. The order is recorded on
            dispatch and the army marches for the order&apos;s travel time.
          </p>
        </div>
        <span className="rounded-full border border-[#e7d6a0] bg-[#fff9e7] px-3 py-1 text-xs font-semibold text-[#6a4a0a]">
          Dispatch only, no battle yet
        </span>
      </div>

      {hasTargets && hasArmyStacks ? (
        <form action={formAction} className="space-y-4">
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

          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-medium text-[#10140f]">Army</p>
              <div className="flex gap-2">
                <button
                  className="rounded-md border border-[#cbd8cd] bg-[#eff6ed] px-3 py-1 text-xs font-semibold text-[#183f35]"
                  onClick={sendAll}
                  type="button"
                >
                  Send all
                </button>
                <button
                  className="rounded-md border border-[#cbd8cd] bg-[#eff6ed] px-3 py-1 text-xs font-semibold text-[#183f35]"
                  onClick={sendNone}
                  type="button"
                >
                  Send none
                </button>
              </div>
            </div>

            <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {armyStacks.map((stack) => {
                const inputId = `attack-quantity-${stack.unitType}`;

                return (
                  <li key={stack.unitType}>
                    <label className="grid gap-1 text-sm" htmlFor={inputId}>
                      <span className="font-medium text-[#10140f]">
                        {stack.label}{" "}
                        <span className="font-normal text-[#5f665d]">
                          ({formatNumber(stack.quantity)} in garrison)
                        </span>
                      </span>
                      {/*
                        The `unitType` hidden input is the manifest half of the
                        `unitType` + `quantity` pair read by the server action.
                        Both are rendered per stack in the same order, which is
                        what keeps the two `getAll` arrays aligned.
                      */}
                      <input name="unitType" type="hidden" value={stack.unitType} />
                      <input
                        className="mamalik-input"
                        id={inputId}
                        inputMode="numeric"
                        max={stack.quantity}
                        min={0}
                        name="quantity"
                        onChange={(event) => {
                          const nextValue = event.target.value;

                          setQuantities((current) => ({
                            ...current,
                            [stack.unitType]: nextValue,
                          }));
                        }}
                        step={1}
                        type="number"
                        value={quantities[stack.unitType] ?? ""}
                      />
                    </label>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-[#5f665d]">
              <span className="font-semibold text-[#10140f]">
                {formatNumber(totalUnits)} unit{totalUnits === 1 ? "" : "s"} marching
              </span>
              . Set a unit to 0 to hold it back. Travel time depends on the slowest unit you send,
              and the server confirms it when the order is accepted.
            </p>
            <AttackOrderButton
              disabled={!hasAttackableTarget || totalUnits === 0}
              hasArmyStacks={hasArmyStacks}
              hasAttackableTarget={hasAttackableTarget}
              hasTargets={hasTargets}
              totalUnits={totalUnits}
            />
          </div>
        </form>
      ) : (
        <p className="rounded-md border border-[#e7d6a0] bg-[#fff9e7] px-4 py-3 text-sm text-[#6a4a0a]">
          {hasTargets
            ? "Your garrison has no units available to send. Train units on this page first."
            : "No other kingdoms are available to attack yet."}
        </p>
      )}

      {state.status !== "idle" ? (
        <div
          className={
            state.status === "success"
              ? "rounded-md border border-[#cbd8cd] bg-[#eff6ed] px-4 py-3 text-sm text-[#183f35]"
              : "rounded-md border border-[#e1b8b8] bg-[#fff0f0] px-4 py-3 text-sm text-[#7a1d1d]"
          }
        >
          <p className="font-semibold">
            {state.status === "success" ? "Attack order dispatched" : "Attack order failed"}
          </p>
          <p className="mt-1">{state.message}</p>
          {state.status === "success" ? (
            <p className="mt-2">
              Nothing has happened at the target. The army is in transit and will not fight, take
              land, or produce a battle report until arrival handling ships in a later Sprint 5 task.
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}


      <p className="rounded-md border border-[#e1b8b8] bg-[#fff0f0] px-4 py-3 text-sm text-[#7a1d1d]">
        A dispatched attack has no effect yet. The army sits in transit: no battle is fought, no
        casualties are dealt, no land is taken, and no battle report is written. Arrival handling
        and the battle itself are later Sprint 5 tasks, so treat this as staging an army on the road.
      </p>
