import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getPrismaClient } from "@/lib/db/client";
import {
  parseLocationCoordinates,
  type LocationValidationReason,
} from "@/lib/kingdom/location-validation";
import {
  invalidSpatialResponse,
  validateKingdomLocationWithPostgis,
} from "@/lib/map/location-validation";

export const runtime = "nodejs";

function invalidResponse(reason: LocationValidationReason, status: number): NextResponse {
  return NextResponse.json(invalidSpatialResponse(reason), { status });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return invalidResponse("unauthenticated", 401);
  }

  if (user.kingdom) {
    return invalidResponse("user-already-has-kingdom", 409);
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return invalidResponse("invalid-coordinates", 400);
  }

  if (!body || typeof body !== "object") {
    return invalidResponse("missing-coordinates", 400);
  }

  const parsedCoordinates = parseLocationCoordinates(
    body as { lat?: unknown; lng?: unknown },
  );

  if (!parsedCoordinates.ok) {
    return invalidResponse(parsedCoordinates.reason, 400);
  }

  try {
    const validation = await validateKingdomLocationWithPostgis(getPrismaClient(), {
      lat: parsedCoordinates.coordinates.lat,
      lng: parsedCoordinates.coordinates.lng,
    });

    return NextResponse.json(validation);
  } catch {
    return invalidResponse("border-generation-failed", 500);
  }
}
