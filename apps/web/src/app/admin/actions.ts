"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/current-user";
import {
  runAdminTickForUser,
  type SerializableAdminTickResult,
} from "@/lib/admin/admin-tick";
import { isAdminUser } from "@/lib/auth/route-destinations";
import { recalculateAllKingdomBorders } from "@/lib/map/kingdom-border";

export type AdminTickActionState = {
  status: "idle" | "success" | "error";
  message: string;
  result: SerializableAdminTickResult | null;
};

export async function runAdminTickAction(
  _previousState: AdminTickActionState,
): Promise<AdminTickActionState> {
  void _previousState;

  const user = await getCurrentUser();
  const execution = await runAdminTickForUser(user);

  revalidatePath("/admin");

  return {
    status: execution.ok ? "success" : "error",
    message: execution.message,
    result: execution.result,
  };
}

export type AdminBorderActionState = {
  status: "idle" | "success" | "error";
  message: string;
};

export async function recalculateBordersAction(
  _previousState: AdminBorderActionState,
): Promise<AdminBorderActionState> {
  void _previousState;

  const user = await getCurrentUser();

  if (!user || !isAdminUser(user)) {
    return { status: "error", message: "Only admins can recalculate borders." };
  }

  try {
    const results = await recalculateAllKingdomBorders();

    revalidatePath("/admin");
    revalidatePath("/world");

    return { status: "success", message: `Recalculated ${results.length} kingdom borders.` };
  } catch {
    return { status: "error", message: "Border recalculation failed." };
  }
}
