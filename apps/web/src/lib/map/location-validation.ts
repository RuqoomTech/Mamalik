import { STARTING_USABLE_LAND_M2 } from "@mamalik/game/constants";
import {
  createInvalidLocationResponse,
  type LocationCoordinates,
  type LocationValidationResponse,
  type RestrictedZoneCheckResponse,
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
import {
  validatePointAndPreviewAgainstRestrictedZones,
  type RestrictedZoneValidationResult,
} from "@/lib/map/restricted-zones";

export type SpatialLocationValidationResponse = LocationValidationResponse & {
  ok: boolean;
  center: LocationCoordinates | null;
  toleranceStatus: VisibleBorderToleranceStatus | null;
  overlap: BorderOverlapResult | null;
  landCheck: LocationValidationResponse["landCheck"];
  waterCheck: NonNullable<LocationValidationResponse["waterCheck"]>;
  restrictedZoneCheck: RestrictedZoneCheckResponse;
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
  const restrictedZoneCheck = await validatePointAndPreviewAgainstRestrictedZones(db, {
    coordinates: center,
    previewPolygon: borderPreview.previewPolygon,
  });

  if (restrictedZoneCheck.status === "RESTRICTED") {
    return invalidSpatialResponse("restricted-zone", {
      center,
      landCheck,
      restrictedZoneCheck,
    });
  }

  if (restrictedZoneCheck.status === "DATA_MISSING") {
    return invalidSpatialResponse("restricted-zone-data-missing", {
      center,
      landCheck,
      restrictedZoneCheck,
    });
  }

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
      restrictedZoneCheck: createRestrictedZoneCheckResponse(restrictedZoneCheck),
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
    restrictedZoneCheck: createRestrictedZoneCheckResponse(restrictedZoneCheck),
    suggestions: [],
  };
}

export function invalidSpatialResponse(
  reason: Parameters<typeof createInvalidLocationResponse>[0],
  options: {
    center?: LocationCoordinates | null;
    landCheck?: LandMaskValidationResult;
    restrictedZoneCheck?: RestrictedZoneValidationResult;
  } = {},
): SpatialLocationValidationResponse {
  const landCheck = options.landCheck
    ? createLandCheckResponse(options.landCheck)
    : {
        status: "NOT_IMPLEMENTED" as const,
        source: "NOT_IMPLEMENTED",
      };
  const restrictedZoneCheck = options.restrictedZoneCheck
    ? createRestrictedZoneCheckResponse(options.restrictedZoneCheck)
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
    restrictedZoneCheck,
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

function createRestrictedZoneCheckResponse(
  restrictedZoneCheck: RestrictedZoneValidationResult,
): RestrictedZoneCheckResponse {
  return {
    status: restrictedZoneCheck.status,
    source: restrictedZoneCheck.source,
    zones:
      restrictedZoneCheck.status === "RESTRICTED"
        ? restrictedZoneCheck.zones.map((zone) => ({
            code: zone.code,
            name: zone.name,
            category: zone.category,
            reason: zone.reason,
          }))
        : undefined,
  };
}
