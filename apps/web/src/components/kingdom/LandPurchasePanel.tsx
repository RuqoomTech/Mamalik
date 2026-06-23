"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  purchaseLandFormAction,
  type PurchaseLandActionState,
} from "@/app/dashboard/actions";
import {
  formatCooldownAvailableAt,
  formatCooldownRemaining,
  formatLandPurchaseCooldown,
  getLandPurchaseDisabledReasonLabel,
} from "@/lib/kingdom/land-purchase-display";
import type { LandPurchaseOption } from "@/lib/kingdom/land-purchase-options";

const initialState: PurchaseLandActionState = {
  status: "idle",
  message: "",
  packageKey: null,
};

const numberFormatter = new Intl.NumberFormat("en-US");

function formatNumber(value: number): string {
  return numberFormatter.format(value);
}

function formatLand(value: number): string {
  return `${formatNumber(value)} m2`;
}

function PurchaseButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      className="mamalik-action-primary w-full px-4 py-2 disabled:cursor-not-allowed disabled:opacity-60"
      disabled={disabled || pending}
      type="submit"
    >
      {pending ? "Buying..." : disabled ? "Unavailable" : "Buy land"}
    </button>
  );
}

export function LandPurchasePanel({ options }: { options: LandPurchaseOption[] }) {
  const [state, formAction] = useActionState(purchaseLandFormAction, initialState);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-4">
        {options.map((option) => {
          const availableAt = formatCooldownAvailableAt(option.cooldownUntil);
          const disabledLabel = getLandPurchaseDisabledReasonLabel(option.disabledReason);

          return (
            <article className="mamalik-card flex flex-col gap-4 p-4" key={option.packageKey}>
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-[#10140f]">{option.label}</h3>
                    <p className="mt-1 text-sm text-[#5f665d]">{formatLand(option.sizeM2)}</p>
                  </div>
                  <span
                    className={
                      option.canBuyNow
                        ? "rounded-full border border-[#cbd8cd] bg-[#eff6ed] px-3 py-1 text-xs font-semibold text-[#183f35]"
                        : "rounded-full border border-[#e7d6a0] bg-[#fff9e7] px-3 py-1 text-xs font-semibold text-[#6a4a0a]"
                    }
                  >
                    {disabledLabel}
                  </span>
                </div>
              </div>

              <dl className="grid gap-2 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-[#5f665d]">Price</dt>
                  <dd className="font-semibold text-[#10140f]">
                    {formatNumber(option.price.totalPrice)} Money
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-[#5f665d]">Cooldown</dt>
                  <dd className="text-[#10140f]">
                    {formatLandPurchaseCooldown(option.cooldownHours)}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-[#5f665d]">State</dt>
                  <dd className={option.canBuyNow ? "text-[#183f35]" : "text-[#8a4f19]"}>
                    {option.cooldownRemainingMs > 0
                      ? formatCooldownRemaining(option.cooldownRemainingMs)
                      : disabledLabel}
                  </dd>
                </div>
                {availableAt ? (
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-[#5f665d]">Available at</dt>
                    <dd className="text-right text-[#10140f]">{availableAt}</dd>
                  </div>
                ) : null}
              </dl>

              <form action={formAction} className="mt-auto">
                <input name="packageKey" type="hidden" value={option.packageKey} />
                <PurchaseButton disabled={!option.canBuyNow} />
              </form>
            </article>
          );
        })}
      </div>

      {state.status !== "idle" ? (
        <div
          className={
            state.status === "success"
              ? "rounded-md border border-[#cbd8cd] bg-[#eff6ed] px-4 py-3 text-sm text-[#183f35]"
              : "rounded-md border border-[#e1b8b8] bg-[#fff0f0] px-4 py-3 text-sm text-[#7a1d1d]"
          }
        >
          <p className="font-semibold">
            {state.status === "success" ? "Land purchase complete" : "Land purchase failed"}
          </p>
          <p className="mt-1">{state.message}</p>
        </div>
      ) : null}
    </div>
  );
}
