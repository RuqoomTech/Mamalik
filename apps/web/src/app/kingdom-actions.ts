"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/current-user";
import {
  startConstructionForUser,
  startTrainingForUser,
  startUpgradeForUser,
  type KingdomActionResult,
} from "@/lib/kingdom/kingdom-actions";

export type KingdomActionState = {
  status: "idle" | "success" | "error";
  message: string;
};

function toState(result: KingdomActionResult): KingdomActionState {
  if (result.ok) {
    for (const path of ["/dashboard", "/buildings", "/army", "/economy", "/land"]) {
      revalidatePath(path);
    }
  }

  return { status: result.ok ? "success" : "error", message: result.message };
}

function readString(formData: FormData, key: string): string {
  const value = formData.get(key);

  return typeof value === "string" ? value : "";
}

export async function buildAction(_previous: KingdomActionState, formData: FormData): Promise<KingdomActionState> {
  void _previous;

  return toState(await startConstructionForUser(await getCurrentUser(), readString(formData, "buildingType")));
}

export async function upgradeAction(_previous: KingdomActionState, formData: FormData): Promise<KingdomActionState> {
  void _previous;

  return toState(await startUpgradeForUser(await getCurrentUser(), readString(formData, "buildingId")));
}

export async function trainAction(_previous: KingdomActionState, formData: FormData): Promise<KingdomActionState> {
  void _previous;

  return toState(
    await startTrainingForUser(
      await getCurrentUser(),
      readString(formData, "unitType"),
      Number(readString(formData, "quantity")),
    ),
  );
}
