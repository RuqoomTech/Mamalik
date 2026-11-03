"use client";

import { useSyncExternalStore } from "react";
import { useI18n } from "@/i18n/I18nProvider";
import { getDocumentMapTheme, subscribeToThemeChanges, type MapLocale, type MapTheme } from "@/lib/map/map-style";

// Current map language and theme; maps rebuild when either changes.
export function useMapAppearance(): { locale: MapLocale; theme: MapTheme } {
  const { locale } = useI18n();
  const theme = useSyncExternalStore(subscribeToThemeChanges, getDocumentMapTheme, () => "light" as const);

  return { locale, theme };
}
