/** Languages and themes, shared by the server (cookies) and the client (toggles). See specs/frontend.md §1.2 and §2. */

export const LOCALES = ["en", "pt"] as const;
export type Locale = (typeof LOCALES)[number];
export const LANG_COOKIE = "brs_lang";

export const THEMES = ["system", "light", "dark"] as const;
export type Theme = (typeof THEMES)[number];
export const THEME_COOKIE = "brs_theme";

export const ONE_YEAR = 60 * 60 * 24 * 365;

export function isLocale(value: string | undefined): value is Locale {
  return LOCALES.includes(value as Locale);
}

export function isTheme(value: string | undefined): value is Theme {
  return THEMES.includes(value as Theme);
}

/** The browser's language decides when no choice was saved: pt-* is Portuguese, anything else English. */
export function localeFromAcceptLanguage(header: string | null): Locale {
  const first = header?.split(",")[0]?.trim().toLowerCase() ?? "";
  return first.startsWith("pt") ? "pt" : "en";
}
