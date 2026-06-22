"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/current-user";
import {
  purchaseLandForUser,
  type PurchaseLandResult,
} from "@/lib/kingdom/land-purchase";

export async function purchaseLandAction(packageKey: string): Promise<PurchaseLandResult> {
  const user = await getCurrentUser();
  const result = await purchaseLandForUser(user, packageKey);

  if (result.ok) {
    revalidatePath("/dashboard");
  }

  return result;
}
