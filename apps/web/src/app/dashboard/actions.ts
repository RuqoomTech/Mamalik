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
import {
  createScoutOrderForUser,
  getCreateScoutOrderResultMessage,
  type CreateScoutOrderResult,
} from "@/lib/kingdom/scout-orders";

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
    revalidatePath("/economy");
    revalidatePath("/land");
    revalidatePath("/reports");
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
    revalidatePath("/land");
    revalidatePath("/reports");
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

export type ScoutOrderActionState = {
  status: "idle" | "success" | "error";
  message: string;
  targetKingdomId: string | null;
};

export async function createScoutOrderAction(
  targetKingdomId: string,
  scoutCount: number,
): Promise<CreateScoutOrderResult> {
  const user = await getCurrentUser();
  const result = await createScoutOrderForUser(user, { targetKingdomId, scoutCount });

  if (result.ok) {
    revalidatePath("/army");
    revalidatePath("/dashboard");
  }

  return result;
}

export async function createScoutOrderFormAction(
  _previousState: ScoutOrderActionState,
  formData: FormData,
): Promise<ScoutOrderActionState> {
  void _previousState;

  const targetKingdomIdValue = formData.get("targetKingdomId");
  const scoutCountValue = formData.get("scoutCount");
  const targetKingdomId = typeof targetKingdomIdValue === "string" ? targetKingdomIdValue : "";
  // A non-numeric submission becomes NaN here on purpose. The shared validator
  // rejects it as INVALID_SCOUT_COUNT, so the server never trusts this value.
  const scoutCount = typeof scoutCountValue === "string" ? Number(scoutCountValue) : Number.NaN;
  const result = await createScoutOrderAction(targetKingdomId, scoutCount);

  return {
    status: result.ok ? "success" : "error",
    message: getCreateScoutOrderResultMessage(result),
    targetKingdomId: result.ok ? result.targetKingdomId : targetKingdomId || null,
  };
}
