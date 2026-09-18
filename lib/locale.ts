export const supportedLocales = ["ru", "kk", "en"] as const;

export type Locale = (typeof supportedLocales)[number];

export function normalizeLocale(value: unknown): Locale {
  return supportedLocales.includes(value as Locale) ? (value as Locale) : "ru";
}

export const localeNames: Record<Locale, string> = {
  ru: "Русский",
  kk: "Қазақша",
  en: "English",
};

export const aiLanguageNames: Record<Locale, string> = {
  ru: "Russian",
  kk: "Kazakh",
  en: "English",
};
