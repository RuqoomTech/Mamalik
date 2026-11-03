import { cookies, headers } from "next/headers";
import {
  getDirection,
  isLocale,
  LOCALE_COOKIE,
  parseThemePreference,
  pickLocaleFromAcceptLanguage,
  THEME_COOKIE,
  type Locale,
  type ThemePreference,
} from "@/i18n/config";
import { getMessagesFor, type Messages } from "@/i18n/messages";

export async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const saved = cookieStore.get(LOCALE_COOKIE)?.value;

  if (isLocale(saved)) {
    return saved;
  }

  const headerStore = await headers();

  return pickLocaleFromAcceptLanguage(headerStore.get("accept-language"));
}

export async function getThemePreference(): Promise<ThemePreference> {
  const cookieStore = await cookies();

  return parseThemePreference(cookieStore.get(THEME_COOKIE)?.value);
}

export type I18n = {
  locale: Locale;
  dir: "ltr" | "rtl";
  m: Messages;
};

export async function getI18n(): Promise<I18n> {
  const locale = await getLocale();

  return { locale, dir: getDirection(locale), m: getMessagesFor(locale) };
}
