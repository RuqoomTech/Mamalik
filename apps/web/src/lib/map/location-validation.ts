import { STARTING_USABLE_LAND_M2 } from "@mamalik/game/constants";
import {
  createInvalidLocationResponse,
  type LocationCoordinates,
  type LocationSuggestion,
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
  calculateDynamicMinimumSpacingM,
  createLocationSuggestionCandidates,
  limitLocationSuggestions,
  MAX_LOCATION_SUGGESTION_CANDIDATES,
  validateDynamicSpacingFromExistingKingdoms,
  type SpacingValidationResult,
} from "@/lib/map/dynamic-spacing";
import {
  validatePointAndPreviewAgainstRestrictedZones,
  type RestrictedZoneValidationResult,
} from "@/lib/map/restricted-zones";
import {
  classifyAreaTypeForLocation,
  type AreaTypeClassificationResult,
} from "@/lib/map/area-type-classification";

export type SpatialLocationValidationResponse = LocationValidationResponse & {
  ok: boolean;
  center: LocationCoordinates | null;
  toleranceStatus: VisibleBorderToleranceStatus | null;
  overlap: BorderOverlapResult | null;
  spacing: LocationValidationResponse["spacing"];
  landCheck: LocationValidationResponse["landCheck"];
  waterCheck: NonNullable<LocationValidationResponse["waterCheck"]>;
  restrictedZoneCheck: RestrictedZoneCheckResponse;
  areaType: LocationValidationResponse["areaType"];
  areaTypeClassification: LocationValidationResponse["areaTypeClassification"];
};

type PostgisValidationClient = Parameters<typeof generateVisibleBorderPreview>[0];

export async function validateKingdomLocationWithPostgis(
  db: PostgisValidationClient,
  input: {
    lat: unknown;
    lng: unknown;
    excludeKingdomId?: string;
    includeSuggestions?: boolean;
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
    const suggestions = await createNearbyValidSuggestionsIfNeeded(db, {
      center,
      excludeKingdomId: input.excludeKingdomId,
      includeSuggestions: input.includeSuggestions,
    });

    return invalidSpatialResponse("water", { center, landCheck, suggestions });
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
    const suggestions = await createNearbyValidSuggestionsIfNeeded(db, {
      center,
      excludeKingdomId: input.excludeKingdomId,
      includeSuggestions: input.includeSuggestions,
    });

    return invalidSpatialResponse("restricted-zone", {
      center,
      landCheck,
      restrictedZoneCheck,
      suggestions,
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
    const suggestions = await createNearbyValidSuggestionsIfNeeded(db, {
      center,
      excludeKingdomId: input.excludeKingdomId,
      includeSuggestions: input.includeSuggestions,
    });

    return {
      ...createInvalidLocationResponse("too-close-to-existing-kingdom", suggestions),
      ok: false,
      center,
      targetAreaM2: borderPreview.targetAreaM2,
      toleranceStatus: borderPreview.toleranceStatus,
      borderAttemptCount: borderPreview.attempts.length,
      overlap,
      spacing: null,
      landCheck: createLandCheckResponse(landCheck),
      waterCheck: landCheck.status,
      restrictedZoneCheck: createRestrictedZoneCheckResponse(restrictedZoneCheck),
      areaType: null,
      areaTypeClassification: null,
    };
  }

  const minimumDistanceM = calculateDynamicMinimumSpacingM(borderPreview.radiusM);
  const spacing = await validateDynamicSpacingFromExistingKingdoms(db, {
    coordinates: center,
    minimumDistanceM,
    excludeKingdomId: input.excludeKingdomId,
  });

  if (spacing.status === "TOO_CLOSE") {
    const suggestions = await createNearbyValidSuggestionsIfNeeded(db, {
      center,
      excludeKingdomId: input.excludeKingdomId,
      includeSuggestions: input.includeSuggestions,
    });

    return {
      ...createInvalidLocationResponse("too-close-to-existing-kingdom", suggestions),
      ok: false,
      center,
      targetAreaM2: borderPreview.targetAreaM2,
      toleranceStatus: borderPreview.toleranceStatus,
      borderAttemptCount: borderPreview.attempts.length,
      overlap,
      spacing: createSpacingCheckResponse(spacing),
      landCheck: createLandCheckResponse(landCheck),
      waterCheck: landCheck.status,
      restrictedZoneCheck: createRestrictedZoneCheckResponse(restrictedZoneCheck),
      areaType: null,
      areaTypeClassification: null,
    };
  }

  const areaTypeClassification = classifyAreaTypeForLocation({
    coordinates: center,
    previewPolygon: borderPreview.previewPolygon,
  });

  return {
    ok: true,
    valid: true,
    reason: null,
    center,
    usableLandM2: STARTING_USABLE_LAND_M2,
    visibleAreaM2: borderPreview.visibleAreaM2,
    targetAreaM2: borderPreview.targetAreaM2,
    previewPolygon: borderPreview.previewPolygon,
    toleranceStatus: borderPreview.toleranceStatus,
    borderAttemptCount: borderPreview.attempts.length,
    overlap,
    spacing: createSpacingCheckResponse(spacing),
    landCheck: createLandCheckResponse(landCheck),
    waterCheck: landCheck.status,
    restrictedZoneCheck: createRestrictedZoneCheckResponse(restrictedZoneCheck),
    areaType: areaTypeClassification.areaType,
    areaTypeClassification: createAreaTypeClassificationResponse(areaTypeClassification),
    suggestions: [],
  };
}

export function invalidSpatialResponse(
  reason: Parameters<typeof createInvalidLocationResponse>[0],
  options: {
    center?: LocationCoordinates | null;
    landCheck?: LandMaskValidationResult;
    restrictedZoneCheck?: RestrictedZoneValidationResult;
    suggestions?: LocationSuggestion[];
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
    spacing: null,
    landCheck,
    waterCheck: landCheck.status,
    restrictedZoneCheck,
    areaType: null,
    areaTypeClassification: null,
    suggestions: options.suggestions ?? [],
  };
}

async function createNearbyValidSuggestionsIfNeeded(
  db: PostgisValidationClient,
  input: {
    center: LocationCoordinates;
    excludeKingdomId?: string;
    includeSuggestions?: boolean;
  },
): Promise<LocationSuggestion[]> {
  if (!input.includeSuggestions) {
    return [];
  }

  const suggestions: LocationSuggestion[] = [];
  const candidates = createLocationSuggestionCandidates(input.center).slice(
    0,
    MAX_LOCATION_SUGGESTION_CANDIDATES,
  );

  for (let index = 0; index < candidates.length; index += 3) {
    const batch = candidates.slice(index, index + 3);
    const batchResults = await Promise.all(
      batch.map(async (candidate) => {
        const validation = await validateKingdomLocationWithPostgis(db, {
          lat: candidate.lat,
          lng: candidate.lng,
          excludeKingdomId: input.excludeKingdomId,
          includeSuggestions: false,
        });

        if (!validation.valid || validation.visibleAreaM2 === null || !validation.toleranceStatus) {
          return null;
        }

        return {
          lat: candidate.lat,
          lng: candidate.lng,
          label: "Nearby valid location",
          reason: "nearby-valid-location" as const,
          distanceM: candidate.distanceM,
          bearingDeg: candidate.bearingDeg,
          visibleAreaM2: validation.visibleAreaM2,
          toleranceStatus: validation.toleranceStatus,
        };
      }),
    );

    for (const suggestion of batchResults) {
      if (suggestion) {
        suggestions.push(suggestion);
      }

      if (suggestions.length >= 3) {
        break;
      }
    }

    if (suggestions.length >= 3) {
      break;
    }
  }

  return limitLocationSuggestions(suggestions);
}

function createSpacingCheckResponse(
  spacing: SpacingValidationResult,
): NonNullable<LocationValidationResponse["spacing"]> {
  if (spacing.status === "TOO_CLOSE") {
    return {
      status: "TOO_CLOSE",
      minimumDistanceM: spacing.minimumDistanceM,
      nearestDistanceM: spacing.nearestDistanceM,
    };
  }

  return {
    status: "CLEAR",
    minimumDistanceM: spacing.minimumDistanceM,
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

function createAreaTypeClassificationResponse(
  classification: AreaTypeClassificationResult,
): NonNullable<LocationValidationResponse["areaTypeClassification"]> {
  return {
    areaType: classification.areaType,
    source: classification.source,
    confidence: classification.confidence,
    reason: classification.reason,
  };
}
