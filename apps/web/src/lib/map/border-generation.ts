import {
  VISIBLE_BORDER_LOOSE_MAX_M2,
  VISIBLE_BORDER_LOOSE_MIN_M2,
  VISIBLE_BORDER_STRICT_MAX_M2,
  VISIBLE_BORDER_STRICT_MIN_M2,
  VISIBLE_BORDER_TARGET_AREA_M2,
} from "@mamalik/game/constants";

export type VisibleBorderToleranceStatus = "STRICT" | "LOOSE" | "FALLBACK";

export type VisibleBorderGenerationAttempt = {
  radiusM: number;
  visibleAreaM2: number;
  toleranceStatus: VisibleBorderToleranceStatus;
};

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

export const VISIBLE_BORDER_RADIUS_ADJUSTMENT_FACTORS = [0.96, 0.98, 1, 1.02, 1.04] as const;
export const MAX_VISIBLE_BORDER_ATTEMPTS = 7;

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

export function calculateCorrectedBorderRadiusM(input: {
  currentRadiusM: number;
  targetAreaM2: number;
  measuredAreaM2: number;
}): number {
  if (
    !Number.isFinite(input.currentRadiusM) ||
    input.currentRadiusM <= 0 ||
    !Number.isFinite(input.targetAreaM2) ||
    input.targetAreaM2 <= 0 ||
    !Number.isFinite(input.measuredAreaM2) ||
    input.measuredAreaM2 <= 0
  ) {
    return 0;
  }

  return input.currentRadiusM * Math.sqrt(input.targetAreaM2 / input.measuredAreaM2);
}

export function createAdjustedBorderRadii(baseRadiusM: number): number[] {
  if (!Number.isFinite(baseRadiusM) || baseRadiusM <= 0) {
    return [];
  }

  return VISIBLE_BORDER_RADIUS_ADJUSTMENT_FACTORS.map((factor) => baseRadiusM * factor);
}

export function appendUniqueBorderRadius(
  radii: number[],
  radiusM: number,
  precisionM = 0.001,
): number[] {
  if (!Number.isFinite(radiusM) || radiusM <= 0) {
    return radii;
  }

  if (radii.some((existingRadiusM) => Math.abs(existingRadiusM - radiusM) <= precisionM)) {
    return radii;
  }

  if (radii.length >= MAX_VISIBLE_BORDER_ATTEMPTS) {
    return radii;
  }

  return [...radii, radiusM];
}

export function selectBestVisibleBorderAttempt<T extends VisibleBorderGenerationAttempt>(
  attempts: T[],
  targetAreaM2 = VISIBLE_BORDER_TARGET_AREA_M2,
): T | null {
  if (attempts.length === 0) {
    return null;
  }

  return [...attempts].sort((first, second) => {
    const statusComparison =
      getVisibleBorderToleranceRank(first.toleranceStatus) -
      getVisibleBorderToleranceRank(second.toleranceStatus);

    if (statusComparison !== 0) {
      return statusComparison;
    }

    return (
      Math.abs(first.visibleAreaM2 - targetAreaM2) -
      Math.abs(second.visibleAreaM2 - targetAreaM2)
    );
  })[0] ?? null;
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

function getVisibleBorderToleranceRank(status: VisibleBorderToleranceStatus): number {
  switch (status) {
    case "STRICT":
      return 0;
    case "LOOSE":
      return 1;
    case "FALLBACK":
      return 2;
  }
}
