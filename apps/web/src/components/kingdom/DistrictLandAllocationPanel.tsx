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
  return `${formatNumber(value)} m2`;
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

  return (
    <div className="mamalik-card space-y-4 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-[#10140f]">Allocate unused land</h3>
          <p className="mt-1 text-sm text-[#5f665d]">
            Add unallocated usable land into one existing district.
          </p>
        </div>
        <span
          className={
            hasUnallocatedLand
              ? "rounded-full border border-[#cbd8cd] bg-[#eff6ed] px-3 py-1 text-xs font-semibold text-[#183f35]"
              : "rounded-full border border-[#e7d6a0] bg-[#fff9e7] px-3 py-1 text-xs font-semibold text-[#6a4a0a]"
          }
        >
          {formatLand(unallocatedLandM2)} unallocated
        </span>
      </div>

      {hasUnallocatedLand ? (
        <form action={formAction} className="grid gap-3 lg:grid-cols-[1fr_180px_auto] lg:items-end">
          <label className="grid gap-1 text-sm">
            <span className="font-medium text-[#10140f]">District</span>
            <select className="mamalik-input" name="districtId" required>
              {districts.map((district) => (
                <option key={district.id} value={district.id}>
                  {district.label} - {formatLand(district.allocatedLandM2)} allocated,{" "}
                  {formatLand(district.freeLandM2)} free
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-1 text-sm">
            <span className="font-medium text-[#10140f]">Amount m2</span>
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
        <p className="rounded-md border border-[#e7d6a0] bg-[#fff9e7] px-4 py-3 text-sm text-[#6a4a0a]">
          Buy land first to allocate more district land.
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
            {state.status === "success" ? "District land allocated" : "Allocation failed"}
          </p>
          <p className="mt-1">{state.message}</p>
        </div>
      ) : null}
    </div>
  );
}
