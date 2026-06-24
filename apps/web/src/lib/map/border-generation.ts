import {
  VISIBLE_BORDER_LOOSE_MAX_M2,
  VISIBLE_BORDER_LOOSE_MIN_M2,
  VISIBLE_BORDER_STRICT_MAX_M2,
  VISIBLE_BORDER_STRICT_MIN_M2,
  VISIBLE_BORDER_TARGET_AREA_M2,
} from "@mamalik/game/constants";

export type VisibleBorderToleranceStatus = "STRICT" | "LOOSE" | "FALLBACK";

export type LatitudeLongitudeValidationResult =
  | { ok: true; lat: number; lng: number }
  | {
      ok: false;
      reason:
        | "missing-coordinates"
        | "invalid-coordinates"
        | "latitude-out-of-range"
        | "longitude-out-of-range";
    };

export function validateLatitudeLongitude(input: {
  lat?: unknown;
  lng?: unknown;
}): LatitudeLongitudeValidationResult {
  if (!("lat" in input) || !("lng" in input)) {
    return { ok: false, reason: "missing-coordinates" };
  }

  if (typeof input.lat !== "number" || typeof input.lng !== "number") {
    return { ok: false, reason: "invalid-coordinates" };
  }

  if (!Number.isFinite(input.lat) || !Number.isFinite(input.lng)) {
    return { ok: false, reason: "invalid-coordinates" };
  }

  if (input.lat < -90 || input.lat > 90) {
    return { ok: false, reason: "latitude-out-of-range" };
  }

  if (input.lng < -180 || input.lng > 180) {
    return { ok: false, reason: "longitude-out-of-range" };
  }

  return { ok: true, lat: input.lat, lng: input.lng };
}

export function calculateCircularBorderRadiusM(
  targetAreaM2 = VISIBLE_BORDER_TARGET_AREA_M2,
): number {
  if (!Number.isFinite(targetAreaM2) || targetAreaM2 <= 0) {
    return 0;
  }

  return Math.sqrt(targetAreaM2 / Math.PI);
}

export function classifyVisibleBorderTolerance(
  visibleAreaM2: number,
): VisibleBorderToleranceStatus {
  if (!Number.isFinite(visibleAreaM2) || visibleAreaM2 <= 0) {
    return "FALLBACK";
  }

  if (
    visibleAreaM2 >= VISIBLE_BORDER_STRICT_MIN_M2 &&
    visibleAreaM2 <= VISIBLE_BORDER_STRICT_MAX_M2
  ) {
    return "STRICT";
  }

  if (
    visibleAreaM2 >= VISIBLE_BORDER_LOOSE_MIN_M2 &&
    visibleAreaM2 <= VISIBLE_BORDER_LOOSE_MAX_M2
  ) {
    return "LOOSE";
  }

  return "FALLBACK";
}
