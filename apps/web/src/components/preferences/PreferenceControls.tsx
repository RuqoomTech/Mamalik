"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { setLocaleAction, setThemeAction } from "@/app/preferences-actions";
import { useI18n } from "@/i18n/I18nProvider";
import { getDocumentMapTheme, THEME_CHANGE_EVENT } from "@/lib/map/map-style";

function SunIcon() {
  return (
    <svg aria-hidden="true" fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeWidth="1.6" viewBox="0 0 24 24" width="16">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg aria-hidden="true" fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" viewBox="0 0 24 24" width="16">
      <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" />
    </svg>
  );
}

// Language switch and light/dark toggle, shared by the public and game headers.
export function PreferenceControls() {
  const { locale, m } = useI18n();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function switchLanguage() {
    startTransition(async () => {
      await setLocaleAction(locale === "ar" ? "en" : "ar");
      router.refresh();
    });
  }

  function toggleTheme() {
    const next = getDocumentMapTheme() === "dark" ? "light" : "dark";

    document.documentElement.dataset.theme = next;
    window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
    void setThemeAction(next);
  }

  return (
    <div className="flex items-center">
      <button
        aria-label={m.prefs.switchLanguageLabel}
        className="rounded px-2 py-1.5 text-sm text-mk-muted hover:text-mk-ink disabled:opacity-60"
        disabled={isPending}
        lang={locale === "ar" ? "en" : "ar"}
        onClick={switchLanguage}
        type="button"
      >
        {m.prefs.switchLanguage}
      </button>
      <button
        aria-label={m.prefs.toggleTheme}
        className="rounded p-2 text-mk-muted hover:text-mk-ink"
        onClick={toggleTheme}
        title={m.prefs.toggleTheme}
        type="button"
      >
        <span className="mk-show-light">
          <MoonIcon />
        </span>
        <span className="mk-show-dark">
          <SunIcon />
        </span>
      </button>
    </div>
  );
}
