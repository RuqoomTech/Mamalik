"use server";

import { revalidatePath } from "next/cache";
import type { AttackArmyEntry, MovementUnitType } from "@mamalik/game";
import { getCurrentUser } from "@/lib/auth/current-user";
import {
  createAttackOrderForUser,
  getCreateAttackOrderResultMessage,
  type CreateAttackOrderResult,
} from "@/lib/kingdom/attack-orders";
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



export type AttackOrderActionState = {
  status: "idle" | "success" | "error";
  message: string;
  targetKingdomId: string | null;
};

/**
 * The form field convention for a MIXED attack manifest.
 *
 * The panel renders one `unitType` text input and one `quantity` number input
 * per available garrison stack, in the SAME stack order for both. `FormData`
 * preserves submission order within a repeated field name, so the two `getAll`
 * arrays are index-aligned and each pair is one manifest line:
 *
 *   unitType=INFANTRY&quantity=40&unitType=ARCHERS&quantity=25
 *
 * Repeated paired fields were chosen over a single JSON blob because a JSON
 * field would need `JSON.parse` on untrusted input before anything else could
 * be checked, and a parse failure there would be indistinguishable from "no
 * army". Paired strings let every malformed value be dropped on its own.
 */
function readAttackArmyManifest(formData: FormData): AttackArmyEntry[] {
  const unitTypeValues = formData.getAll("unitType");
  const quantityValues = formData.getAll("quantity");
  const entries: AttackArmyEntry[] = [];

  // The shorter array bounds the pairing, so a form that submits one field
  // without the other cannot produce a half-line manifest entry.
  const lineCount = Math.min(unitTypeValues.length, quantityValues.length);

  for (let index = 0; index < lineCount; index += 1) {
    const unitTypeValue = unitTypeValues[index];
    const quantityValue = quantityValues[index];

    // A File (or any non-string) is not a manifest line, so it is skipped
    // rather than coerced through String().
    if (typeof unitTypeValue !== "string" || typeof quantityValue !== "string") {
      continue;
    }

    const unitType = unitTypeValue.trim();
    const quantity = readManifestQuantity(quantityValue);

    // A blank unit type cannot identify a stack. An unrecognized unit type
    // string is forwarded untouched so the server answers INVALID_UNIT_TYPE
    // rather than the client guessing which unit types exist.
    if (!unitType || quantity === null) {
      continue;
    }

    entries.push({ unitType: unitType as MovementUnitType, quantity });
  }

  return entries;
}

/**
 * Parse one manifest quantity defensively.
 *
 * An absent, blank, non-numeric, zero, negative, or fractional quantity means
 * "send none of this type" and drops the line. Fractional values are dropped
 * rather than floored so a half-typed number can never become a real order.
 * Returns null for every dropped case.
 */
function readManifestQuantity(rawValue: string): number | null {
  const trimmedValue = rawValue.trim();

  if (!trimmedValue) {
    return null;
  }

  // Digits only. `Number` alone would also accept "0x10", "1e3", and " 12 ",
  // which are not quantities a player meant to type into this field.
  if (!/^\d+$/.test(trimmedValue)) {
    return null;
  }

  const quantity = Number(trimmedValue);

  if (!Number.isSafeInteger(quantity) || quantity < 1) {
    return null;
  }

  return quantity;
}

export async function createAttackOrderAction(
  targetKingdomId: string,
  units: { unitType: string; quantity: number }[],
): Promise<CreateAttackOrderResult> {
  const user = await getCurrentUser();
  // The client sends a WISH, never a fact. Every unit type, every quantity,
  // and the garrison itself are re-read and re-normalized server-side by the
  // shared `validateAttackOrder`, so a tampered or stale manifest here can only
  // be rejected, never obeyed. The cast is therefore only widening the unit
  // type string to the enum the shared signature uses: an unrecognized string
  // still reaches the validator, which answers INVALID_UNIT_TYPE for it.
  const manifest = units as readonly AttackArmyEntry[];
  const result = await createAttackOrderForUser(user, { targetKingdomId, units: manifest });

  if (result.ok) {
    revalidatePath("/army");
    revalidatePath("/dashboard");
  }

  return result;
}

export async function createAttackOrderFormAction(
  _previousState: AttackOrderActionState,
  formData: FormData,
): Promise<AttackOrderActionState> {
  void _previousState;

  const targetKingdomIdValue = formData.get("targetKingdomId");
  const targetKingdomId = typeof targetKingdomIdValue === "string" ? targetKingdomIdValue : "";
  const units = readAttackArmyManifest(formData);

  // An entirely empty manifest is submitted as-is rather than short-circuited
  // here. The server owns the INVALID_ARMY rule, so the client must not decide
  // on its own that "nothing composed" means "nothing to send".
  const result = await createAttackOrderAction(targetKingdomId, units);

  return {
    status: result.ok ? "success" : "error",
    message: getCreateAttackOrderResultMessage(result),
    targetKingdomId: result.ok ? result.targetKingdomId : targetKingdomId || null,
  };
}
