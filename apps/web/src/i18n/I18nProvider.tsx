"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { Locale } from "@/i18n/config";
import type { ClientMessages } from "@/i18n/messages";

type I18nContextValue = {
  locale: Locale;
  m: ClientMessages;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children, locale, messages }: { children: ReactNode; locale: Locale; messages: ClientMessages }) {
  return <I18nContext.Provider value={{ locale, m: messages }}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const value = useContext(I18nContext);

  if (!value) {
    throw new Error("useI18n must be used inside I18nProvider.");
  }

  return value;
}
