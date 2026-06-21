"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/current-user";
import {
  runAdminTickForUser,
  type SerializableAdminTickResult,
} from "@/lib/admin/admin-tick";

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
