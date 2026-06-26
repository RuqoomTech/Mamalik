import type {
  LocationSuggestion,
  LocationValidationReason,
  LocationValidationResponse,
} from "@/lib/kingdom/location-validation";

export type LocationValidationUiStatus =
  | "NOT_SELECTED"
  | "SELECTED_UNVALIDATED"
  | "VALIDATING"
  | "VALID"
  | "INVALID"
  | "REQUEST_FAILED";

export type LocationValidationReasonDisplay = {
  title: string;
  description: string;
};

export function getLocationValidationUiStatus(input: {
  hasSelectedLocation: boolean;
  isValidating: boolean;
  validationResult: LocationValidationResponse | null;
  validationError: string | null;
}): LocationValidationUiStatus {
  if (input.isValidating) {
    return "VALIDATING";
  }

  if (input.validationError) {
    return "REQUEST_FAILED";
  }

  if (!input.hasSelectedLocation) {
    return "NOT_SELECTED";
  }

  if (!input.validationResult) {
    return "SELECTED_UNVALIDATED";
  }

  return input.validationResult.valid ? "VALID" : "INVALID";
}

export function formatLocationValidationStatus(status: LocationValidationUiStatus): string {
  switch (status) {
    case "NOT_SELECTED":
      return "Not selected";
    case "SELECTED_UNVALIDATED":
      return "Selected, not validated";
    case "VALIDATING":
      return "Validating";
    case "VALID":
      return "Valid location";
    case "INVALID":
      return "Invalid location";
    case "REQUEST_FAILED":
      return "Validation request failed";
  }
}

export function describeLocationValidationStatus(status: LocationValidationUiStatus): string {
  switch (status) {
    case "NOT_SELECTED":
      return "Click the map to choose a starting point.";
    case "SELECTED_UNVALIDATED":
      return "Validate this point before creating a kingdom.";
    case "VALIDATING":
      return "Checking land, restricted zones, spacing, and border preview.";
    case "VALID":
      return "This point passed the current v0.1 server validation.";
    case "INVALID":
      return "Choose a different point or use a server-suggested nearby location.";
    case "REQUEST_FAILED":
      return "The validation request did not complete. Try again.";
  }
}

export function formatValidationReason(
  reason: LocationValidationReason | null,
  options: {
    overlapsExistingKingdom?: boolean;
  } = {},
): LocationValidationReasonDisplay {
  if (options.overlapsExistingKingdom) {
    return {
      title: "This border overlaps another kingdom.",
      description: "Choose a point farther away or use one of the suggested locations.",
    };
  }

  switch (reason) {
    case "too-close-to-existing-kingdom":
      return {
        title: "This point is too close to another kingdom.",
        description: "Kingdoms need enough spacing for a visible starting border.",
      };
    case "water":
      return {
        title: "This point appears to be on water.",
        description: "Choose a land location.",
      };
    case "land-mask-data-missing":
      return {
        title: "Land validation data is not loaded.",
        description: "Try again after the map data is seeded.",
      };
    case "restricted-zone":
      return {
        title: "This point is inside a restricted start area.",
        description: "Choose another location outside restricted areas.",
      };
    case "restricted-zone-data-missing":
      return {
        title: "Restricted-zone validation data is not loaded.",
        description: "Try again after the restricted-zone data is available.",
      };
    case "user-already-has-kingdom":
      return {
        title: "This account already has a kingdom.",
        description: "Each v0.1 player account can create one kingdom.",
      };
    case "missing-coordinates":
      return {
        title: "Choose a map point before validating.",
        description: "Click the map, then run validation.",
      };
    case "invalid-coordinates":
    case "latitude-out-of-range":
    case "longitude-out-of-range":
      return {
        title: "The selected coordinates are invalid.",
        description: "Choose a valid point on the world map.",
      };
    case "unauthenticated":
      return {
        title: "Sign in before validating a kingdom location.",
        description: "Location validation requires an authenticated account.",
      };
    case "border-generation-failed":
      return {
        title: "A visible border could not be generated here.",
        description: "Choose another point and validate again.",
      };
    default:
      return {
        title: "Location validation failed.",
        description: "Choose another point and validate again.",
      };
  }
}

export function formatToleranceStatus(
  status: LocationValidationResponse["toleranceStatus"],
): string {
  switch (status) {
    case "STRICT":
      return "Excellent fit";
    case "LOOSE":
      return "Acceptable fit";
    case "FALLBACK":
      return "Approximate border";
    default:
      return "Pending";
  }
}

export function formatDistanceMeters(value: number | undefined): string | null {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null;
  }

  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)} km`;
  }

  return `${Math.round(value)} m`;
}

export function formatBearing(value: number | undefined): string | null {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null;
  }

  return `${Math.round(value)} deg`;
}

export function formatSquareMeters(value: number | null | undefined): string {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "Pending";
  }

  return `${Math.round(value).toLocaleString()} m2`;
}

export function formatSuggestionSummary(suggestion: LocationSuggestion): string {
  return [
    formatDistanceMeters(suggestion.distanceM),
    formatBearing(suggestion.bearingDeg),
    suggestion.visibleAreaM2 ? formatSquareMeters(suggestion.visibleAreaM2) : null,
    suggestion.toleranceStatus ? formatToleranceStatus(suggestion.toleranceStatus) : null,
  ]
    .filter(Boolean)
    .join(" - ");
}
