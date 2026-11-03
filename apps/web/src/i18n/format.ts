import type { Locale } from "@/i18n/config";

// Plural forms follow Intl.PluralRules categories. Arabic uses zero/one/two/few/many/other;
// English only needs one/other. Every form is a template that may contain {n}.
export type PluralForms = {
  one: string;
  other: string;
  zero?: string;
  two?: string;
  few?: string;
  many?: string;
};

const numberFormatter = new Intl.NumberFormat("en-US");
const pluralRules: Record<Locale, Intl.PluralRules> = {
  en: new Intl.PluralRules("en"),
  ar: new Intl.PluralRules("ar"),
};

// Game numbers use Western digits in both languages so tables line up and stay deterministic.
export function formatNumber(value: number): string {
  return numberFormatter.format(value);
}

export function fill(template: string, values: Record<string, string | number> = {}): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => {
    const value = values[key];

    if (value === undefined) {
      return match;
    }

    return typeof value === "number" ? formatNumber(value) : value;
  });
}

export function plural(
  locale: Locale,
  forms: PluralForms,
  count: number,
  values: Record<string, string | number> = {},
): string {
  const category = pluralRules[locale].select(count) as keyof PluralForms;
  const template = forms[category] ?? forms.other;

  return fill(template, { n: count, ...values });
}
