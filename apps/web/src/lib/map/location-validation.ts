import { STARTING_USABLE_LAND_M2 } from "@mamalik/game/constants";
import {
  createInvalidLocationResponse,
  type LocationCoordinates,
  type LocationValidationResponse,
} from "@/lib/kingdom/location-validation";
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
  waterCheck: SpatialCheckStatus;
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
      waterCheck: "NOT_IMPLEMENTED",
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
    waterCheck: "NOT_IMPLEMENTED",
    restrictedZoneCheck: "NOT_IMPLEMENTED",
    suggestions: [],
  };
}

export function invalidSpatialResponse(
  reason: Parameters<typeof createInvalidLocationResponse>[0],
): SpatialLocationValidationResponse {
  return {
    ...createInvalidLocationResponse(reason),
    ok: false,
    center: null,
    toleranceStatus: null,
    overlap: null,
    waterCheck: "NOT_IMPLEMENTED",
    restrictedZoneCheck: "NOT_IMPLEMENTED",
  };
}
