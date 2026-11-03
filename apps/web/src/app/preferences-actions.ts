"use server";

import { cookies } from "next/headers";
import {
  isLocale,
  LOCALE_COOKIE,
  parseThemePreference,
  PREFERENCE_COOKIE_MAX_AGE_SECONDS,
  THEME_COOKIE,
} from "@/i18n/config";

const cookieOptions = {
  httpOnly: false,
  maxAge: PREFERENCE_COOKIE_MAX_AGE_SECONDS,
  path: "/",
  sameSite: "lax" as const,
};

export async function setLocaleAction(locale: string): Promise<void> {
  if (!isLocale(locale)) {
    return;
  }

  (await cookies()).set(LOCALE_COOKIE, locale, cookieOptions);
}

export async function setThemeAction(theme: string): Promise<void> {
  const preference = parseThemePreference(theme);

  (await cookies()).set(THEME_COOKIE, preference, cookieOptions);
}
