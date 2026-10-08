"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { recalculateBordersAction, type AdminBorderActionState } from "@/app/admin/actions";

const initialState: AdminBorderActionState = { status: "idle", message: "" };

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button className="mamalik-action-secondary px-4 py-2" disabled={pending} type="submit">
      {pending ? "Recalculating..." : "Recalculate all borders"}
    </button>
  );
}

export function AdminBorderControls() {
  const [state, formAction] = useActionState(recalculateBordersAction, initialState);

  return (
    <form action={formAction} className="space-y-2">
      <p className="text-sm text-mk-muted">
        Regrows every kingdom border from its usable land, trimmed against neighbours and water.
      </p>
      <SubmitButton />
      {state.status !== "idle" ? (
        <p className={`text-sm ${state.status === "success" ? "text-mk-success" : "text-mk-danger"}`}>
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
