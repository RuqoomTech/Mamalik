import { NextResponse } from "next/server";
import type { Prisma } from "@mamalik/db/client";
import {
  LAND_PURCHASE_PACKAGES,
  STARTER_BUILDINGS,
  STARTER_UNITS,
  STARTING_DISTRICTS,
  STARTING_POPULATION,
  STARTING_RESOURCES,
  STARTING_USABLE_LAND_M2,
  TEMPORARY_VISIBLE_AREA_M2,
} from "@mamalik/game/constants";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getPrismaClient } from "@/lib/db/client";
import {
  createBeginnerProtectionEndsAt,
  createUniqueKingdomSlug,
  getStarterDistrictUsedLandM2,
  getStarterUsedLandM2,
} from "@/lib/kingdom/creation";
import { validateKingdomName } from "@/lib/kingdom/kingdom-name";
import {
  parseLocationCoordinates,
  validateTemporaryKingdomLocation,
  type LocationValidationReason,
} from "@/lib/kingdom/location-validation";

export const runtime = "nodejs";

type CreateKingdomErrorCode =
  | "unauthorized"
  | "already-has-kingdom"
  | "invalid-name"
  | "invalid-coordinates"
  | "invalid-location"
  | "too-close-to-existing-kingdom"
  | "create-kingdom-failed";

type CreateKingdomInput = {
  name?: unknown;
  lat?: unknown;
  lng?: unknown;
};

function errorResponse(code: CreateKingdomErrorCode, message: string, status: number): NextResponse {
  return NextResponse.json(
    {
      error: {
        code,
        message,
      },
    },
    { status },
  );
}

function coordinateErrorCode(reason: LocationValidationReason): CreateKingdomErrorCode {
  if (reason === "too-close-to-existing-kingdom") {
    return "too-close-to-existing-kingdom";
  }

  if (
    reason === "missing-coordinates" ||
    reason === "invalid-coordinates" ||
    reason === "latitude-out-of-range" ||
    reason === "longitude-out-of-range"
  ) {
    return "invalid-coordinates";
  }

  return "invalid-location";
}

function coordinateErrorMessage(reason: LocationValidationReason): string {
  switch (reason) {
    case "missing-coordinates":
      return "Latitude and longitude are required.";
    case "invalid-coordinates":
      return "Latitude and longitude must be numbers.";
    case "latitude-out-of-range":
      return "Latitude must be between -90 and 90.";
    case "longitude-out-of-range":
      return "Longitude must be between -180 and 180.";
    case "too-close-to-existing-kingdom":
      return "That location is too close to an existing kingdom.";
    default:
      return "The selected location is not valid.";
  }
}

function getRequestBodyObject(body: unknown): CreateKingdomInput | null {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return null;
  }

  return body as CreateKingdomInput;
}

async function readCreateKingdomInput(request: Request): Promise<CreateKingdomInput | null> {
  try {
    return getRequestBodyObject(await request.json());
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return errorResponse("unauthorized", "Sign in before creating a kingdom.", 401);
  }

  if (user.kingdom) {
    return errorResponse("already-has-kingdom", "You already have a kingdom.", 409);
  }

  const input = await readCreateKingdomInput(request);

  if (!input) {
    return errorResponse("invalid-coordinates", "Request body must include a name and coordinates.", 400);
  }

  if (typeof input.name !== "string") {
    return errorResponse("invalid-name", "Kingdom name is required.", 400);
  }

  const nameValidation = validateKingdomName(input.name);

  if (!nameValidation.ok) {
    return errorResponse("invalid-name", "Kingdom name is invalid.", 400);
  }

  const coordinatesValidation = parseLocationCoordinates(input);

  if (!coordinatesValidation.ok) {
    return errorResponse(
      coordinateErrorCode(coordinatesValidation.reason),
      coordinateErrorMessage(coordinatesValidation.reason),
      400,
    );
  }

  const prisma = getPrismaClient();

  try {
    const createdKingdom = await prisma.$transaction(async (tx) => {
      const currentUser = await tx.user.findUnique({
        where: { id: user.id },
        select: {
          kingdom: {
            select: { id: true },
          },
        },
      });

      if (!currentUser) {
        throw new Error("create-kingdom-user-missing");
      }

      if (currentUser.kingdom) {
        throw new Error("create-kingdom-already-owned");
      }

      const existingKingdoms = await tx.kingdom.findMany({
        select: {
          centerLat: true,
          centerLng: true,
        },
      });
      const locationValidation = validateTemporaryKingdomLocation(
        coordinatesValidation.coordinates,
        existingKingdoms,
      );

      if (
        !locationValidation.valid ||
        !locationValidation.previewPolygon ||
        locationValidation.visibleAreaM2 === null
      ) {
        throw new Error(`create-kingdom-location-${locationValidation.reason}`);
      }

      const baseSlug = createUniqueKingdomSlug(nameValidation.name, []);
      const existingSlugs = await tx.kingdom.findMany({
        where: {
          slug: {
            startsWith: baseSlug,
          },
        },
        select: {
          slug: true,
        },
      });
      const slug = createUniqueKingdomSlug(
        nameValidation.name,
        existingSlugs.map((kingdom) => kingdom.slug),
      );
      const now = new Date();
      const kingdom = await tx.kingdom.create({
        data: {
          userId: user.id,
          name: nameValidation.name,
          slug,
          centerLat: coordinatesValidation.coordinates.lat,
          centerLng: coordinatesValidation.coordinates.lng,
          visibleBorderGeojson: locationValidation.previewPolygon as Prisma.InputJsonValue,
          visibleAreaM2: locationValidation.visibleAreaM2 ?? TEMPORARY_VISIBLE_AREA_M2,
          usableLandM2: STARTING_USABLE_LAND_M2,
          usedLandM2: getStarterUsedLandM2(),
          population: STARTING_POPULATION,
          protectionEndsAt: createBeginnerProtectionEndsAt(now),
          areaType: "STANDARD",
        },
        select: {
          id: true,
          name: true,
          slug: true,
          usableLandM2: true,
        },
      });
      const districtIdsByType = new Map<string, string>();

      for (const district of STARTING_DISTRICTS) {
        const createdDistrict = await tx.district.create({
          data: {
            kingdomId: kingdom.id,
            type: district.type,
            allocatedLandM2: district.allocatedLandM2,
            usedLandM2: getStarterDistrictUsedLandM2(district.type),
          },
          select: {
            id: true,
            type: true,
          },
        });

        districtIdsByType.set(createdDistrict.type, createdDistrict.id);
      }

      await tx.resourceStockpile.create({
        data: {
          kingdomId: kingdom.id,
          money: STARTING_RESOURCES.money,
          food: STARTING_RESOURCES.food,
          manpower: STARTING_RESOURCES.manpower,
          knowledge: STARTING_RESOURCES.knowledge,
        },
      });

      await tx.buildingInstance.createMany({
        data: STARTER_BUILDINGS.map((building) => {
          const districtId = districtIdsByType.get(building.districtType);

          if (!districtId) {
            throw new Error(`create-kingdom-missing-district-${building.districtType}`);
          }

          return {
            kingdomId: kingdom.id,
            districtId,
            type: building.type,
            level: 1,
            status: "ACTIVE",
            landUsedM2: building.landUsedM2,
            constructionRemainingTicks: 0,
          };
        }),
      });

      await tx.unitStack.createMany({
        data: STARTER_UNITS.map((unit) => ({
          kingdomId: kingdom.id,
          unitType: unit.type,
          quantity: unit.quantity,
          locationType: "GARRISON",
        })),
      });

      await tx.landPurchaseCooldown.createMany({
        data: LAND_PURCHASE_PACKAGES.map((landPackage) => ({
          kingdomId: kingdom.id,
          packageSizeM2: landPackage.sizeM2,
          availableAt: now,
        })),
      });

      return kingdom;
    });

    return NextResponse.json({
      ok: true,
      kingdom: createdKingdom,
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "create-kingdom-already-owned") {
        return errorResponse("already-has-kingdom", "You already have a kingdom.", 409);
      }

      if (error.message.startsWith("create-kingdom-location-too-close-to-existing-kingdom")) {
        return errorResponse(
          "too-close-to-existing-kingdom",
          "That location is too close to an existing kingdom.",
          409,
        );
      }

      if (error.message.startsWith("create-kingdom-location-")) {
        return errorResponse("invalid-location", "The selected location is not valid.", 400);
      }
    }

    return errorResponse(
      "create-kingdom-failed",
      "Kingdom creation failed. Try again later.",
      500,
    );
  }
}
