"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  buildAction,
  trainAction,
  upgradeAction,
  type KingdomActionState,
} from "@/app/kingdom-actions";
import type { BuildOption, TrainOption, UpgradeOption } from "@/lib/kingdom/action-options";

const initialState: KingdomActionState = { status: "idle", message: "" };
const numberFormatter = new Intl.NumberFormat("en-US");

function formatCost(money: number, manpower: number): string {
  return `${numberFormatter.format(money)} Money · ${numberFormatter.format(manpower)} Manpower`;
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();

  return (
    <button className="mamalik-action-primary px-3 py-1.5" disabled={pending} type="submit">
      {pending ? "…" : label}
    </button>
  );
}

function Feedback({ state }: { state: KingdomActionState }) {
  if (state.status === "idle") {
    return null;
  }

  return (
    <p
      aria-live="polite"
      className={`px-1 text-sm ${state.status === "success" ? "text-mk-success" : "text-mk-danger"}`}
    >
      {state.message}
    </p>
  );
}

export type BuildingRow = {
  id: string;
  label: string;
  districtLabel: string;
  level: number;
  status: string;
  statusText: string;
};

export function BuildingsTable({
  buildings,
  upgrades,
}: {
  buildings: BuildingRow[];
  upgrades: Record<string, UpgradeOption>;
}) {
  const [state, formAction] = useActionState(upgradeAction, initialState);

  return (
    <div className="space-y-2">
      <div className="mamalik-card overflow-x-auto">
        <table className="mamalik-table">
          <thead>
            <tr>
              <th>Building</th>
              <th>District</th>
              <th className="num">Level</th>
              <th className="num">Next level</th>
              <th className="num" />
            </tr>
          </thead>
          <tbody>
            {buildings.map((building) => {
              const upgrade = upgrades[building.id];

              return (
                <tr key={building.id}>
                  <td className="font-medium">{building.label}</td>
                  <td className="text-mk-muted">{building.districtLabel}</td>
                  <td className="num">{building.level}</td>
                  <td className="num text-xs text-mk-muted">
                    {building.status === "ACTIVE" && upgrade && upgrade.blockedReason !== "Max level"
                      ? `${formatCost(upgrade.money, upgrade.manpower)} · ${upgrade.duration}`
                      : null}
                  </td>
                  <td className="num">
                    {building.status !== "ACTIVE" ? (
                      <span className="text-xs text-mk-warn">{building.statusText}</span>
                    ) : upgrade && !upgrade.blockedReason ? (
                      <form action={formAction}>
                        <input name="buildingId" type="hidden" value={building.id} />
                        <SubmitButton label={`Upgrade to ${upgrade.targetLevel}`} />
                      </form>
                    ) : (
                      <span className="text-xs text-mk-muted">{upgrade?.blockedReason}</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <Feedback state={state} />
    </div>
  );
}

export function BuildTable({ options }: { options: BuildOption[] }) {
  const [state, formAction] = useActionState(buildAction, initialState);

  return (
    <div className="space-y-2">
      <div className="mamalik-card overflow-x-auto">
        <table className="mamalik-table">
          <thead>
            <tr>
              <th>Building</th>
              <th>District</th>
              <th className="num">Cost</th>
              <th className="num">Time</th>
              <th className="num" />
            </tr>
          </thead>
          <tbody>
            {options.map((option) => (
              <tr key={option.buildingType}>
                <td>
                  <span className="font-medium">{option.label}</span>
                  <span className="block text-xs text-mk-muted">{option.description}</span>
                </td>
                <td className="text-mk-muted">{option.districtLabel}</td>
                <td className="num text-xs">{formatCost(option.money, option.manpower)}</td>
                <td className="num text-xs text-mk-muted">{option.duration}</td>
                <td className="num">
                  {option.blockedReason ? (
                    <span className="text-xs text-mk-muted">{option.blockedReason}</span>
                  ) : (
                    <form action={formAction}>
                      <input name="buildingType" type="hidden" value={option.buildingType} />
                      <SubmitButton label="Build" />
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Feedback state={state} />
    </div>
  );
}

export function TrainTable({ options }: { options: TrainOption[] }) {
  const [state, formAction] = useActionState(trainAction, initialState);

  return (
    <div className="space-y-2">
      <div className="mamalik-card overflow-x-auto">
        <table className="mamalik-table">
          <thead>
            <tr>
              <th>Unit</th>
              <th className="num">Atk / Def</th>
              <th className="num">Cost each</th>
              <th className="num">Time</th>
              <th className="num" />
            </tr>
          </thead>
          <tbody>
            {options.map((option) => (
              <tr key={option.unitType}>
                <td>
                  <span className="font-medium">{option.label}</span>
                  <span className="block text-xs text-mk-muted">{option.description}</span>
                </td>
                <td className="num text-mk-muted">
                  {option.attack} / {option.defense}
                </td>
                <td className="num text-xs">{formatCost(option.money, option.manpower)}</td>
                <td className="num text-xs text-mk-muted">{option.duration}</td>
                <td className="num">
                  {option.blockedReason || option.maxAffordable < 1 ? (
                    <span className="text-xs text-mk-muted">{option.blockedReason ?? "Not enough Money"}</span>
                  ) : (
                    <form action={formAction} className="flex items-center justify-end gap-2">
                      <input name="unitType" type="hidden" value={option.unitType} />
                      <input
                        aria-label={`${option.label} to train`}
                        className="mamalik-input w-20 px-2 py-1 text-right text-sm"
                        defaultValue={Math.min(10, option.maxAffordable)}
                        max={option.maxAffordable}
                        min={1}
                        name="quantity"
                        type="number"
                      />
                      <SubmitButton label="Train" />
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Feedback state={state} />
    </div>
  );
}
