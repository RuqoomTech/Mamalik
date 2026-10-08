import type { ExpressionSpecification, FilterSpecification } from "maplibre-gl";

export type MapLocale = "en" | "ar";
export type MapTheme = "light" | "dark";

// Country labels Mamalik does not show on its maps (product decision, see docs/DECISIONS_LOG.md).
export const HIDDEN_COUNTRY_CODES = ["IL"];
export const HIDDEN_PLACE_NAMES = ["Israel", "ישראל", "إسرائيل", "Israël"];
const PLACE_NAME_FIELDS = ["name", "name:en", "name_en", "name:latin", "name_int", "name:ar"];

const OPENFREEMAP_STYLE_PATTERN = /^(https:\/\/tiles\.openfreemap\.org\/styles\/)(liberty|bright|positron|dark)$/;

export function getThemedMapStyleUrl(styleUrl: string, theme: MapTheme): string {
  const match = OPENFREEMAP_STYLE_PATTERN.exec(styleUrl);

  if (!match) {
    return styleUrl;
  }

  return `${match[1]}${theme === "dark" ? "dark" : "liberty"}`;
}

// One language per label instead of stacked Latin + native names.
export function getLabelTextField(locale: MapLocale): ExpressionSpecification {
  return locale === "ar"
    ? ["coalesce", ["get", "name:ar"], ["get", "name"]]
    : ["coalesce", ["get", "name:en"], ["get", "name_en"], ["get", "name:latin"], ["get", "name"]];
}

export function isExpressionFilter(filter: unknown): boolean {
  return JSON.stringify(filter ?? null).includes('["get"');
}

export function getHiddenPlaceFilter(useExpressions: boolean): FilterSpecification {
  if (!useExpressions) {
    return [
      "all",
      ["!in", "iso_a2", ...HIDDEN_COUNTRY_CODES],
      ...PLACE_NAME_FIELDS.map((field) => ["!in", field, ...HIDDEN_PLACE_NAMES]),
    ] as unknown as FilterSpecification;
  }

  return [
    "all",
    ["!", ["in", ["coalesce", ["get", "iso_a2"], ""], ["literal", HIDDEN_COUNTRY_CODES]]],
    ...PLACE_NAME_FIELDS.map(
      (field): ExpressionSpecification => [
        "!",
        ["in", ["coalesce", ["get", field], ""], ["literal", HIDDEN_PLACE_NAMES]],
      ],
    ),
  ];
}

export function withHiddenPlaces(existing: FilterSpecification | null | undefined): FilterSpecification {
  const hidden = getHiddenPlaceFilter(existing ? isExpressionFilter(existing) : true);

  return existing ? (["all", existing, hidden] as FilterSpecification) : hidden;
}
