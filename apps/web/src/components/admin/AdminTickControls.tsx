"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  runAdminTickAction,
  type AdminTickActionState,
} from "@/app/admin/actions";

const initialState: AdminTickActionState = {
  status: "idle",
  message: "",
  result: null,
};

const numberFormatter = new Intl.NumberFormat("en-US");
const dateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "UTC",
});
type AdminTickResult = NonNullable<AdminTickActionState["result"]>;

function formatNumber(value: number): string {
  return numberFormatter.format(value);
}

function formatDateTime(value: string): string {
  return `${dateFormatter.format(new Date(value))} UTC`;
}

function PendingButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className="mamalik-action-primary px-4 py-2 disabled:cursor-not-allowed disabled:opacity-60"
      disabled={pending}
      type="submit"
    >
      {pending ? "Running tick..." : "Run one tick"}
    </button>
  );
}

export function AdminTickControls() {
  const [state, formAction] = useActionState(runAdminTickAction, initialState);

  return (
    <div className="space-y-4">
      <div className="rounded-md border border-[#e7d6a0] bg-[#fff9e7] px-4 py-3 text-sm text-[#6a4a0a]">
        This runs one real 10-minute tick against the configured database. Duplicate clicks in the
        same tick slot should return skipped through the TickLog duplicate guard.
      </div>

      <form action={formAction}>
        <PendingButton />
      </form>

      {state.status !== "idle" ? (
        <div
          className={
            state.status === "success"
              ? "rounded-md border border-[#cbd8cd] bg-[#eff6ed] px-4 py-3 text-sm text-[#183f35]"
              : "rounded-md border border-[#e1b8b8] bg-[#fff0f0] px-4 py-3 text-sm text-[#7a1d1d]"
          }
        >
          <p className="font-semibold">{state.message}</p>
          {state.result ? (
            <dl className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              <ResultItem label="Tick key" value={state.result.tickKey} />
              <ResultItem label="Status" value={state.result.status} />
              <ResultItem
                label="Processed kingdoms"
                value={formatNumber(state.result.processedKingdomCount)}
              />
              <ResultItem label="Started" value={formatDateTime(state.result.startedAt)} />
              <ResultItem label="Finished" value={formatDateTime(state.result.finishedAt)} />
              <ResultItem
                label="Generated resources"
                value={formatGeneratedResources(state.result.resourceGeneration)}
              />
              <ResultItem
                label="Food consumed"
                value={formatFoodConsumption(state.result.foodConsumption)}
              />
              <ResultItem
                label="Construction"
                value={formatConstruction(state.result.constructionProgress)}
              />
              <ResultItem
                label="Training"
                value={formatTraining(state.result.trainingProgress)}
              />
              {state.result.errorMessage ? (
                <ResultItem label="Error" value={state.result.errorMessage} />
              ) : null}
              {state.result.warnings.length > 0 ? (
                <ResultItem label="Warnings" value={state.result.warnings.join(" | ")} />
              ) : null}
            </dl>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function ResultItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-[0.08em] opacity-70">
        {label}
      </dt>
      <dd className="mt-1 break-words">{value}</dd>
    </div>
  );
}

function formatGeneratedResources(
  resourceGeneration: AdminTickResult["resourceGeneration"],
): string {
  if (!resourceGeneration) {
    return "No generation summary";
  }

  return [
    `Money ${formatNumber(resourceGeneration.money)}`,
    `Food ${formatNumber(resourceGeneration.food)}`,
    `Manpower ${formatNumber(resourceGeneration.manpower)}`,
    `Knowledge ${formatNumber(resourceGeneration.knowledge)}`,
  ].join(", ");
}

function formatFoodConsumption(
  foodConsumption: AdminTickResult["foodConsumption"],
): string {
  if (!foodConsumption) {
    return "No Food summary";
  }

  return `${formatNumber(foodConsumption.total)} total, ${formatNumber(
    foodConsumption.kingdomsWithFoodShortage,
  )} shortages`;
}

function formatConstruction(
  constructionProgress: AdminTickResult["constructionProgress"],
): string {
  if (!constructionProgress) {
    return "No construction summary";
  }

  return `${formatNumber(constructionProgress.buildingsProgressed)} progressed, ${formatNumber(
    constructionProgress.buildingsCompleted,
  )} completed`;
}

function formatTraining(
  trainingProgress: AdminTickResult["trainingProgress"],
): string {
  if (!trainingProgress) {
    return "No training summary";
  }

  return `${formatNumber(trainingProgress.trainingQueuesProgressed)} progressed, ${formatNumber(
    trainingProgress.trainingQueuesCompleted,
  )} completed, ${formatNumber(trainingProgress.unitsTrained)} units`;
}
