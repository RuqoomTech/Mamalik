import type { Metadata } from "next";
import { Amiri, IBM_Plex_Sans_Arabic } from "next/font/google";
import "maplibre-gl/dist/maplibre-gl.css";
import "./globals.css";
import { I18nProvider } from "@/i18n/I18nProvider";
import { toClientMessages } from "@/i18n/messages";
import { getI18n, getThemePreference } from "@/i18n/server";

const plexArabic = IBM_Plex_Sans_Arabic({
  display: "swap",
  subsets: ["arabic"],
  variable: "--font-plex-arabic",
  weight: ["400", "500", "600", "700"],
});

const amiri = Amiri({
  display: "swap",
  subsets: ["arabic"],
  variable: "--font-amiri",
  weight: ["700"],
});

export async function generateMetadata(): Promise<Metadata> {
  const { m } = await getI18n();

  return {
    title: m.common.appName,
    description: m.meta.description,
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [{ dir, locale, m }, theme] = await Promise.all([getI18n(), getThemePreference()]);

  return (
    <html
      className={`${plexArabic.variable} ${amiri.variable}`}
      data-theme={theme === "system" ? undefined : theme}
      dir={dir}
      lang={locale}
      suppressHydrationWarning
    >
      <body>
        <I18nProvider locale={locale} messages={toClientMessages(m)}>
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}
