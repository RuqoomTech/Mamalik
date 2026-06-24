import { STARTING_USABLE_LAND_M2 } from "@mamalik/game/constants";
import {
  createInvalidLocationResponse,
  type LocationCoordinates,
  type LocationValidationResponse,
} from "@/lib/kingdom/location-validation";
import {
  validatePointAgainstLandMask,
  type LandMaskValidationResult,
} from "@/lib/map/land-mask";
import {
  validateLatitudeLongitude,
  type VisibleBorderToleranceStatus,
} from "@/lib/map/border-generation";
import {
  doesBorderOverlapExistingKingdoms,
  generateVisibleBorderPreview,
  type BorderOverlapResult,
} from "@/lib/map/postgis";

export type SpatialCheckStatus = "NOT_IMPLEMENTED";

export type SpatialLocationValidationResponse = LocationValidationResponse & {
  ok: boolean;
  center: LocationCoordinates | null;
  toleranceStatus: VisibleBorderToleranceStatus | null;
  overlap: BorderOverlapResult | null;
  landCheck: LocationValidationResponse["landCheck"];
  waterCheck: NonNullable<LocationValidationResponse["waterCheck"]>;
  restrictedZoneCheck: SpatialCheckStatus;
};

type PostgisValidationClient = Parameters<typeof generateVisibleBorderPreview>[0];

export async function validateKingdomLocationWithPostgis(
  db: PostgisValidationClient,
  input: {
    lat: unknown;
    lng: unknown;
    excludeKingdomId?: string;
  },
): Promise<SpatialLocationValidationResponse> {
  const coordinatesValidation = validateLatitudeLongitude(input);

  if (!coordinatesValidation.ok) {
    return invalidSpatialResponse(coordinatesValidation.reason);
  }

  const center = {
    lat: coordinatesValidation.lat,
    lng: coordinatesValidation.lng,
  };
  const landCheck = await validatePointAgainstLandMask(db, center);

  if (landCheck.status === "WATER") {
    return invalidSpatialResponse("water", { center, landCheck });
  }

  if (landCheck.status === "DATA_MISSING" && !landCheck.allowMissingData) {
    return invalidSpatialResponse("land-mask-data-missing", { center, landCheck });
  }

  const borderPreview = await generateVisibleBorderPreview(db, {
    ...center,
    targetAreaM2: STARTING_USABLE_LAND_M2,
  });
  const overlap = await doesBorderOverlapExistingKingdoms(db, {
    previewPolygon: borderPreview.previewPolygon,
    excludeKingdomId: input.excludeKingdomId,
  });

  if (overlap.overlaps) {
    return {
      ...createInvalidLocationResponse("too-close-to-existing-kingdom"),
      ok: false,
      center,
      toleranceStatus: borderPreview.toleranceStatus,
      overlap,
      landCheck: createLandCheckResponse(landCheck),
      waterCheck: landCheck.status,
      restrictedZoneCheck: "NOT_IMPLEMENTED",
    };
  }

  return {
    ok: true,
    valid: true,
    reason: null,
    center,
    usableLandM2: STARTING_USABLE_LAND_M2,
    visibleAreaM2: borderPreview.visibleAreaM2,
    previewPolygon: borderPreview.previewPolygon,
    toleranceStatus: borderPreview.toleranceStatus,
    overlap,
    landCheck: createLandCheckResponse(landCheck),
    waterCheck: landCheck.status,
    restrictedZoneCheck: "NOT_IMPLEMENTED",
    suggestions: [],
  };
}

export function invalidSpatialResponse(
  reason: Parameters<typeof createInvalidLocationResponse>[0],
  options: { center?: LocationCoordinates | null; landCheck?: LandMaskValidationResult } = {},
): SpatialLocationValidationResponse {
  const landCheck = options.landCheck
    ? createLandCheckResponse(options.landCheck)
    : {
        status: "NOT_IMPLEMENTED" as const,
        source: "NOT_IMPLEMENTED",
      };

  return {
    ...createInvalidLocationResponse(reason),
    ok: false,
    center: options.center ?? null,
    toleranceStatus: null,
    overlap: null,
    landCheck,
    waterCheck: landCheck.status,
    restrictedZoneCheck: "NOT_IMPLEMENTED",
  };
}

function createLandCheckResponse(
  landCheck: LandMaskValidationResult,
): NonNullable<LocationValidationResponse["landCheck"]> {
  return {
    status: landCheck.status,
    source: landCheck.source,
    allowMissingData:
      landCheck.status === "DATA_MISSING" ? landCheck.allowMissingData : undefined,
  };
}
