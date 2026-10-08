"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  allocateDistrictLandFormAction,
  type AllocateDistrictLandActionState,
} from "@/app/dashboard/actions";

export type DistrictLandAllocationOption = {
  id: string;
  label: string;
  allocatedLandM2: number;
  freeLandM2: number;
  statusLabel: string;
};

const initialState: AllocateDistrictLandActionState = {
  status: "idle",
  message: "",
  districtId: null,
};

const numberFormatter = new Intl.NumberFormat("en-US");

function formatNumber(value: number): string {
  return numberFormatter.format(value);
}

function formatLand(value: number): string {
  return `${formatNumber(value)} m²`;
}

function AllocationButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      className="mamalik-action-primary px-4 py-2 disabled:cursor-not-allowed disabled:opacity-60"
      disabled={disabled || pending}
      type="submit"
    >
      {pending ? "Allocating..." : "Allocate land"}
    </button>
  );
}

export function DistrictLandAllocationPanel({
  districts,
  unallocatedLandM2,
}: {
  districts: DistrictLandAllocationOption[];
  unallocatedLandM2: number;
}) {
  const [state, formAction] = useActionState(allocateDistrictLandFormAction, initialState);
  const hasUnallocatedLand = unallocatedLandM2 > 0;
  const defaultAmount = Math.min(unallocatedLandM2, 500);

  if (!hasUnallocatedLand && state.status === "idle") {
    return null;
  }

  return (
    <div className="mamalik-card space-y-4 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-mk-ink">Assign free land</h3>
          <p className="mt-1 text-sm text-mk-muted">
            Move land you own into a district so you can build there.
          </p>
        </div>
        <span className="text-sm tabular-nums text-mk-muted">
          {formatLand(unallocatedLandM2)} free
        </span>
      </div>

      {hasUnallocatedLand ? (
        <form action={formAction} className="grid gap-3 lg:grid-cols-[1fr_180px_auto] lg:items-end">
          <label className="grid gap-1 text-sm">
            <span className="font-medium text-mk-ink">District</span>
            <select className="mamalik-input" name="districtId" required>
              {districts.map((district) => (
                <option key={district.id} value={district.id}>
                  {district.label} ({formatLand(district.freeLandM2)} free)
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-1 text-sm">
            <span className="font-medium text-mk-ink">Amount (m²)</span>
            <input
              className="mamalik-input"
              defaultValue={defaultAmount}
              inputMode="numeric"
              max={unallocatedLandM2}
              min={1}
              name="amountM2"
              required
              step={100}
              type="number"
            />
          </label>

          <AllocationButton disabled={districts.length === 0} />
        </form>
      ) : (
        <p className="text-sm text-mk-muted">
          Buy land first to allocate more district land.
        </p>
      )}

      {state.status !== "idle" ? (
        <div
          className={
            state.status === "success"
              ? "text-sm text-mk-success"
              : "text-sm text-mk-danger"
          }
        >
          <p className="font-semibold">
            {state.status === "success" ? "Land assigned" : "Allocation failed"}
          </p>
          <p className="mt-1">{state.message}</p>
        </div>
      ) : null}
    </div>
  );
}
