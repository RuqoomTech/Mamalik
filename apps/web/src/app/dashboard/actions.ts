"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getPurchaseLandResultMessage } from "@/lib/kingdom/land-purchase-display";
import {
  purchaseLandForUser,
  type PurchaseLandResult,
} from "@/lib/kingdom/land-purchase";

export type PurchaseLandActionState = {
  status: "idle" | "success" | "error";
  message: string;
  packageKey: string | null;
};

export async function purchaseLandAction(packageKey: string): Promise<PurchaseLandResult> {
  const user = await getCurrentUser();
  const result = await purchaseLandForUser(user, packageKey);

  if (result.ok) {
    revalidatePath("/dashboard");
  }

  return result;
}

export async function purchaseLandFormAction(
  _previousState: PurchaseLandActionState,
  formData: FormData,
): Promise<PurchaseLandActionState> {
  void _previousState;

  const packageKeyValue = formData.get("packageKey");
  const packageKey = typeof packageKeyValue === "string" ? packageKeyValue : "";
  const result = await purchaseLandAction(packageKey);

  return {
    status: result.ok ? "success" : "error",
    message: getPurchaseLandResultMessage(result),
    packageKey: result.ok ? result.packageKey : packageKey || null,
  };
}
