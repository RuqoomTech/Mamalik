export const LOCALES = ["en", "ar"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";

export const LOCALE_COOKIE = "mk-locale";
export const THEME_COOKIE = "mk-theme";
export const PREFERENCE_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

export type ThemePreference = "light" | "dark" | "system";

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

export function getDirection(locale: Locale): "ltr" | "rtl" {
  return locale === "ar" ? "rtl" : "ltr";
}

// First matching language in an Accept-Language header, ignoring weights we do not need.
export function pickLocaleFromAcceptLanguage(header: string | null | undefined): Locale {
  if (!header) {
    return DEFAULT_LOCALE;
  }

  for (const part of header.split(",")) {
    const language = part.split(";")[0]?.trim().toLowerCase().split("-")[0];

    if (isLocale(language)) {
      return language;
    }
  }

  return DEFAULT_LOCALE;
}

export function parseThemePreference(value: unknown): ThemePreference {
  return value === "light" || value === "dark" ? value : "system";
}
