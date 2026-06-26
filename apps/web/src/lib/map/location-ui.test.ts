import assert from "node:assert/strict";
import test from "node:test";
import {
  describeLocationValidationStatus,
  formatBearing,
  formatDistanceMeters,
  formatLocationValidationStatus,
  formatSquareMeters,
  formatSuggestionSummary,
  formatToleranceStatus,
  formatValidationReason,
  getLocationValidationUiStatus,
} from "./location-ui";

test("maps validation status states to user-facing labels and descriptions", () => {
  assert.equal(
    getLocationValidationUiStatus({
      hasSelectedLocation: false,
      isValidating: false,
      validationResult: null,
      validationError: null,
    }),
    "NOT_SELECTED",
  );
  assert.equal(formatLocationValidationStatus("NOT_SELECTED"), "Not selected");
  assert.match(describeLocationValidationStatus("VALIDATING"), /Checking land/);

  assert.equal(
    getLocationValidationUiStatus({
      hasSelectedLocation: true,
      isValidating: false,
      validationResult: null,
      validationError: null,
    }),
    "SELECTED_UNVALIDATED",
  );
  assert.equal(
    getLocationValidationUiStatus({
      hasSelectedLocation: true,
      isValidating: true,
      validationResult: null,
      validationError: null,
    }),
    "VALIDATING",
  );
  assert.equal(
    getLocationValidationUiStatus({
      hasSelectedLocation: true,
      isValidating: false,
      validationResult: null,
      validationError: "network failed",
    }),
    "REQUEST_FAILED",
  );
});

test("maps validation reasons without exposing sensitive restricted-zone details", () => {
  assert.deepEqual(formatValidationReason("water"), {
    title: "This point appears to be on water.",
    description: "Choose a land location.",
  });
  assert.deepEqual(formatValidationReason("restricted-zone"), {
    title: "This point is inside a restricted start area.",
    description: "Choose another location outside restricted areas.",
  });
  assert.deepEqual(
    formatValidationReason("too-close-to-existing-kingdom", {
      overlapsExistingKingdom: true,
    }),
    {
      title: "This border overlaps another kingdom.",
      description: "Choose a point farther away or use one of the suggested locations.",
    },
  );
  assert.equal(formatValidationReason("latitude-out-of-range").title, "The selected coordinates are invalid.");
});

test("formats tolerance, distance, bearing, area, and suggestion summaries", () => {
  assert.equal(formatToleranceStatus("STRICT"), "Excellent fit");
  assert.equal(formatToleranceStatus("LOOSE"), "Acceptable fit");
  assert.equal(formatToleranceStatus("FALLBACK"), "Approximate border");
  assert.equal(formatToleranceStatus(null), "Pending");
  assert.equal(formatDistanceMeters(350), "350 m");
  assert.equal(formatDistanceMeters(1_500), "1.5 km");
  assert.equal(formatBearing(44.8), "45 deg");
  assert.equal(formatSquareMeters(49_684), "49,684 m2");
  assert.equal(
    formatSuggestionSummary({
      lat: 24.7136,
      lng: 46.6753,
      distanceM: 300,
      bearingDeg: 45,
      visibleAreaM2: 49_684,
      toleranceStatus: "STRICT",
    }),
    "300 m - 45 deg - 49,684 m2 - Excellent fit",
  );
});
