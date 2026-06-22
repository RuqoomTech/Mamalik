import {
  getLandPurchasePackage,
  getNextLandPurchaseAvailableAt,
  normalizeLandAreaType,
  validateLandPurchase,
  type LandPackageKey,
  type LandPriceResult,
} from "@mamalik/game";
import type { CurrentUser } from "@/lib/auth/current-user";
import { getPrismaClient } from "@/lib/db/client";

export type PurchaseLandFailureReason =
  | "UNAUTHENTICATED"
  | "NO_KINGDOM"
  | "INVALID_PACKAGE"
  | "MISSING_STOCKPILE"
  | "INSUFFICIENT_MONEY"
  | "COOLDOWN_ACTIVE"
  | "UNKNOWN_ERROR";

export type PurchaseLandResult =
  | {
      ok: true;
      packageKey: LandPackageKey;
      packageSizeM2: number;
      pricePaid: number;
      newUsableLandM2: number;
      cooldownUntil?: string;
    }
  | {
      ok: false;
      reason: PurchaseLandFailureReason;
      message: string;
    };

type PurchaseLandUser = Pick<CurrentUser, "id"> | null;

type LandPurchaseKingdomRecord = {
  id: string;
  usableLandM2: number;
  areaType: string;
  resourceStockpile: {
    money: number;
  } | null;
  landCooldowns: Array<{
    id: string;
    packageSizeM2: number;
    availableAt: Date;
  }>;
};

type LandPurchaseTransaction = {
  kingdom: {
    findUnique(args: unknown): Promise<LandPurchaseKingdomRecord | null>;
    update(args: unknown): Promise<{ usableLandM2: number }>;
  };
  resourceStockpile: {
    updateMany(args: unknown): Promise<{ count: number }>;
  };
  landPurchaseCooldown: {
    updateMany(args: unknown): Promise<{ count: number }>;
    create(args: unknown): Promise<unknown>;
    upsert(args: unknown): Promise<unknown>;
  };
  report: {
    create(args: unknown): Promise<unknown>;
  };
};

type LandPurchaseDb = {
  $transaction<T>(
    callback: (tx: LandPurchaseTransaction) => Promise<T>,
    options?: { timeout?: number },
  ): Promise<T>;
};

export type PurchaseLandDependencies = {
  db?: LandPurchaseDb;
  now?: () => Date;
};

class KnownLandPurchaseError extends Error {
  constructor(readonly reason: Exclude<PurchaseLandFailureReason, "UNAUTHENTICATED" | "UNKNOWN_ERROR">) {
    super(reason);
  }
}

export async function purchaseLandForUser(
  user: PurchaseLandUser,
  packageKey: string,
  dependencies: PurchaseLandDependencies = {},
): Promise<PurchaseLandResult> {
  if (!user) {
    return landPurchaseFailure("UNAUTHENTICATED");
  }

  const landPackage = getLandPurchasePackage(packageKey);

  if (!landPackage) {
    return landPurchaseFailure("INVALID_PACKAGE");
  }

  const db = dependencies.db ?? (getPrismaClient() as unknown as LandPurchaseDb);
  const now = dependencies.now?.() ?? new Date();

  try {
    return await db.$transaction(async (tx) => {
      const kingdom = await tx.kingdom.findUnique({
        where: {
          userId: user.id,
        },
        select: {
          id: true,
          usableLandM2: true,
          areaType: true,
          resourceStockpile: {
            select: {
              money: true,
            },
          },
          landCooldowns: {
            where: {
              packageSizeM2: landPackage.sizeM2,
            },
            select: {
              id: true,
              packageSizeM2: true,
              availableAt: true,
            },
            take: 1,
          },
        },
      });

      if (!kingdom) {
        return landPurchaseFailure("NO_KINGDOM");
      }

      const existingCooldown = kingdom.landCooldowns[0] ?? null;
      const validation = validateLandPurchase({
        packageKey: landPackage.key,
        kingdom: {
          usableLandM2: kingdom.usableLandM2,
          areaType: kingdom.areaType,
        },
        stockpile: kingdom.resourceStockpile,
        cooldownAvailableAt: landPackage.cooldownHours === 0 ? null : existingCooldown?.availableAt,
        now,
      });

      if (!validation.ok) {
        return landPurchaseFailure(mapValidationFailure(validation.reason));
      }

      const cooldownUntil = getNextLandPurchaseAvailableAt(now, landPackage.key);
      const areaType = normalizeLandAreaType(kingdom.areaType);

      await reserveLandPackageCooldown(tx, {
        kingdomId: kingdom.id,
        cooldownId: existingCooldown?.id ?? null,
        packageSizeM2: landPackage.sizeM2,
        packageKey: landPackage.key,
        cooldownUntil,
        now,
      });

      const stockpileUpdate = await tx.resourceStockpile.updateMany({
        where: {
          kingdomId: kingdom.id,
          money: {
            gte: validation.price.totalPrice,
          },
        },
        data: {
          money: {
            decrement: validation.price.totalPrice,
          },
        },
      });

      if (stockpileUpdate.count !== 1) {
        throw new KnownLandPurchaseError("INSUFFICIENT_MONEY");
      }

      const updatedKingdom = await tx.kingdom.update({
        where: {
          id: kingdom.id,
        },
        data: {
          usableLandM2: {
            increment: landPackage.sizeM2,
          },
        },
        select: {
          usableLandM2: true,
        },
      });

      await tx.report.create({
        data: {
          kingdomId: kingdom.id,
          type: "LAND_PURCHASE",
          title: "Land purchased",
          bodyJson: createLandPurchaseReportBody({
            packageKey: landPackage.key,
            packageSizeM2: landPackage.sizeM2,
            pricePaid: validation.price.totalPrice,
            price: validation.price,
            areaType,
            previousUsableLandM2: kingdom.usableLandM2,
            newUsableLandM2: updatedKingdom.usableLandM2,
            cooldownUntil: landPackage.cooldownHours > 0 ? cooldownUntil.toISOString() : null,
          }),
        },
      });

      return {
        ok: true,
        packageKey: landPackage.key,
        packageSizeM2: landPackage.sizeM2,
        pricePaid: validation.price.totalPrice,
        newUsableLandM2: updatedKingdom.usableLandM2,
        ...(landPackage.cooldownHours > 0 ? { cooldownUntil: cooldownUntil.toISOString() } : {}),
      };
    }, { timeout: 30_000 });
  } catch (error) {
    if (error instanceof KnownLandPurchaseError) {
      return landPurchaseFailure(error.reason);
    }

    return landPurchaseFailure("UNKNOWN_ERROR");
  }
}

function mapValidationFailure(reason: string): Exclude<PurchaseLandFailureReason, "UNAUTHENTICATED" | "NO_KINGDOM" | "UNKNOWN_ERROR"> {
  switch (reason) {
    case "INVALID_PACKAGE":
      return "INVALID_PACKAGE";
    case "MISSING_STOCKPILE":
      return "MISSING_STOCKPILE";
    case "INSUFFICIENT_MONEY":
      return "INSUFFICIENT_MONEY";
    case "COOLDOWN_ACTIVE":
      return "COOLDOWN_ACTIVE";
    default:
      return "INVALID_PACKAGE";
  }
}

function landPurchaseFailure(reason: PurchaseLandFailureReason): PurchaseLandResult {
  return {
    ok: false,
    reason,
    message: LAND_PURCHASE_ERROR_MESSAGES[reason],
  };
}

const LAND_PURCHASE_ERROR_MESSAGES: Record<PurchaseLandFailureReason, string> = {
  UNAUTHENTICATED: "You must be signed in to buy land.",
  NO_KINGDOM: "Create a kingdom before buying land.",
  INVALID_PACKAGE: "Choose a valid land package.",
  MISSING_STOCKPILE: "Your kingdom resource stockpile is missing.",
  INSUFFICIENT_MONEY: "You do not have enough Money to buy this land package.",
  COOLDOWN_ACTIVE: "This land package is still on cooldown.",
  UNKNOWN_ERROR: "Land purchase failed. Try again later.",
};

async function reserveLandPackageCooldown(
  tx: LandPurchaseTransaction,
  input: {
    kingdomId: string;
    cooldownId: string | null;
    packageSizeM2: number;
    packageKey: LandPackageKey;
    cooldownUntil: Date;
    now: Date;
  },
): Promise<void> {
  if (input.cooldownId) {
    const cooldownUpdate = await tx.landPurchaseCooldown.updateMany({
      where: {
        id: input.cooldownId,
        ...(input.packageKey === "LAND_500"
          ? {}
          : {
              availableAt: {
                lte: input.now,
              },
            }),
      },
      data: {
        availableAt: input.cooldownUntil,
      },
    });

    if (cooldownUpdate.count !== 1) {
      throw new KnownLandPurchaseError("COOLDOWN_ACTIVE");
    }

    return;
  }

  if (input.packageKey === "LAND_500") {
    await tx.landPurchaseCooldown.upsert({
      where: {
        kingdomId_packageSizeM2: {
          kingdomId: input.kingdomId,
          packageSizeM2: input.packageSizeM2,
        },
      },
      update: {
        availableAt: input.cooldownUntil,
      },
      create: {
        kingdomId: input.kingdomId,
        packageSizeM2: input.packageSizeM2,
        availableAt: input.cooldownUntil,
      },
    });

    return;
  }

  await tx.landPurchaseCooldown.create({
    data: {
      kingdomId: input.kingdomId,
      packageSizeM2: input.packageSizeM2,
      availableAt: input.cooldownUntil,
    },
  });
}

function createLandPurchaseReportBody(input: {
  packageKey: LandPackageKey;
  packageSizeM2: number;
  pricePaid: number;
  price: LandPriceResult;
  areaType: string;
  previousUsableLandM2: number;
  newUsableLandM2: number;
  cooldownUntil: string | null;
}): Record<string, string | number | null> {
  return {
    packageKey: input.packageKey,
    packageSizeM2: input.packageSizeM2,
    pricePaid: input.pricePaid,
    areaType: input.areaType,
    previousUsableLandM2: input.previousUsableLandM2,
    newUsableLandM2: input.newUsableLandM2,
    cooldownUntil: input.cooldownUntil,
    basePrice: input.price.basePrice,
    sizeMultiplier: input.price.sizeMultiplier,
    areaMultiplier: input.price.areaMultiplier,
  };
}
