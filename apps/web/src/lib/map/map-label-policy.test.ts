import assert from "node:assert/strict";
import test from "node:test";
import {
  getHiddenPlaceFilter,
  getLabelTextField,
  getThemedMapStyleUrl,
  isExpressionFilter,
  withHiddenPlaces,
} from "./map-label-policy";

test("swaps OpenFreeMap styles for the theme and leaves other styles alone", () => {
  assert.equal(getThemedMapStyleUrl("https://tiles.openfreemap.org/styles/liberty", "dark"), "https://tiles.openfreemap.org/styles/dark");
  assert.equal(getThemedMapStyleUrl("https://tiles.openfreemap.org/styles/liberty", "light"), "https://tiles.openfreemap.org/styles/liberty");
  assert.equal(getThemedMapStyleUrl("https://example.com/style.json", "dark"), "https://example.com/style.json");
});

test("uses Arabic names first for the Arabic map", () => {
  assert.deepEqual(getLabelTextField("ar")[1], ["get", "name:ar"]);
  assert.deepEqual(getLabelTextField("en")[1], ["get", "name:en"]);
});

test("hidden place filter matches the existing filter syntax", () => {
  const expressionFilter = ["==", ["get", "class"], "country"];
  const combined = withHiddenPlaces(expressionFilter as never) as unknown[];

  assert.equal(combined[0], "all");
  assert.deepEqual(combined[1], expressionFilter);
  assert.ok(isExpressionFilter(combined[2]));

  const legacy = withHiddenPlaces(["==", "class", "country"] as never) as unknown[];
  assert.equal(isExpressionFilter(legacy[2]), false);
});

test("hidden place filter covers the country code and its names", () => {
  const serialized = JSON.stringify(getHiddenPlaceFilter(true));

  assert.ok(serialized.includes('"IL"'));
  assert.ok(serialized.includes("Israel"));
  assert.ok(serialized.includes("إسرائيل"));
});
