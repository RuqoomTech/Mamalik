"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/current-user";
import {
  allocateUnusedLandForUser,
  getAllocateDistrictLandResultMessage,
  type AllocateDistrictLandResult,
} from "@/lib/kingdom/district-allocation";
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

export type AllocateDistrictLandActionState = {
  status: "idle" | "success" | "error";
  message: string;
  districtId: string | null;
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

export async function allocateDistrictLandAction(
  districtId: string,
  amountM2: number,
): Promise<AllocateDistrictLandResult> {
  const user = await getCurrentUser();
  const result = await allocateUnusedLandForUser(user, { districtId, amountM2 });

  if (result.ok) {
    revalidatePath("/dashboard");
  }

  return result;
}

export async function allocateDistrictLandFormAction(
  _previousState: AllocateDistrictLandActionState,
  formData: FormData,
): Promise<AllocateDistrictLandActionState> {
  void _previousState;

  const districtIdValue = formData.get("districtId");
  const amountValue = formData.get("amountM2");
  const districtId = typeof districtIdValue === "string" ? districtIdValue : "";
  const amountM2 = typeof amountValue === "string" ? Number(amountValue) : Number.NaN;
  const result = await allocateDistrictLandAction(districtId, amountM2);

  return {
    status: result.ok ? "success" : "error",
    message: getAllocateDistrictLandResultMessage(result),
    districtId: result.ok ? result.districtId : districtId || null,
  };
}
