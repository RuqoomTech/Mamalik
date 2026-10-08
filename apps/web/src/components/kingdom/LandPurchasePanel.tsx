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
  return `${formatNumber(value)} m²`;
}

function PurchaseButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className="mamalik-action-primary px-4 py-1.5"
      disabled={pending}
      type="submit"
    >
      {pending ? "Buying..." : "Buy"}
    </button>
  );
}

export function LandPurchasePanel({ options }: { options: LandPurchaseOption[] }) {
  const [state, formAction] = useActionState(purchaseLandFormAction, initialState);

  return (
    <div className="space-y-3">
      <div className="mamalik-card overflow-x-auto">
        <table className="mamalik-table">
          <thead>
            <tr>
              <th>Package</th>
              <th className="num">Price</th>
              <th className="num">Cooldown</th>
              <th className="num" />
            </tr>
          </thead>
          <tbody>
            {options.map((option) => {
              const availableAt = formatCooldownAvailableAt(option.cooldownUntil);
              const disabledLabel = getLandPurchaseDisabledReasonLabel(option.disabledReason);

              return (
                <tr key={option.packageKey}>
                  <td className="font-medium">{formatLand(option.sizeM2)}</td>
                  <td className="num">{formatNumber(option.price.totalPrice)} Money</td>
                  <td className="num text-mk-muted">
                    {option.cooldownHours > 0 ? formatLandPurchaseCooldown(option.cooldownHours) : "None"}
                  </td>
                  <td className="num">
                    {option.canBuyNow ? (
                      <form action={formAction}>
                        <input name="packageKey" type="hidden" value={option.packageKey} />
                        <PurchaseButton />
                      </form>
                    ) : (
                      <span className="text-xs text-mk-muted" title={availableAt ?? undefined}>
                        {option.cooldownRemainingMs > 0
                          ? `Ready in ${formatCooldownRemaining(option.cooldownRemainingMs)}`
                          : disabledLabel}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {state.status !== "idle" ? (
        <div
          className={
            state.status === "success"
              ? "mamalik-card px-4 py-3 text-sm text-mk-success"
              : "mamalik-card px-4 py-3 text-sm text-mk-danger"
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
