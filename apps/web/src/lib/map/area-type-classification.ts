import {
  DEFAULT_LAND_AREA_TYPE,
  type LandAreaType,
} from "@mamalik/game";
import { validateLatitudeLongitude } from "@/lib/map/border-generation";
import type {
  LocationCoordinates,
  PreviewPolygon,
} from "@/lib/kingdom/location-validation";

export type AreaTypeClassificationSource = "V0_1_DEFAULT" | "V0_1_FIXTURE" | "UNKNOWN";
export type AreaTypeClassificationConfidence = "LOW" | "MEDIUM" | "HIGH";

export type AreaTypeClassificationResult = {
  areaType: LandAreaType;
  source: AreaTypeClassificationSource;
  confidence: AreaTypeClassificationConfidence;
  reason: string;
};

export function classifyAreaTypeForLocation(input: {
  coordinates: LocationCoordinates;
  previewPolygon?: PreviewPolygon | null;
}): AreaTypeClassificationResult {
  const coordinatesValidation = validateLatitudeLongitude({
    lat: input.coordinates.lat,
    lng: input.coordinates.lng,
  });

  if (!coordinatesValidation.ok) {
    return {
      areaType: DEFAULT_LAND_AREA_TYPE,
      source: "UNKNOWN",
      confidence: "LOW",
      reason: "Area type was not classified because the coordinates are invalid.",
    };
  }

  return {
    areaType: DEFAULT_LAND_AREA_TYPE,
    source: "V0_1_DEFAULT",
    confidence: "LOW",
    reason:
      "No v0.1 land-use dataset is active yet, so valid starts use the default Standard area type.",
  };
}
