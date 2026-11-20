"use client";
/** Language and theme choices, kept in cookies so the server renders them on the first paint. */
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import { useLocale } from "next-intl";
import { api } from "./api";
import { LANG_COOKIE, ONE_YEAR, THEME_COOKIE, isTheme, type Locale, type Theme } from "@/i18n/config";

function writeCookie(name: string, value: string) {
  document.cookie = `${name}=${value}; path=/; max-age=${ONE_YEAR}; samesite=lax`;
}

function readCookie(name: string): string | undefined {
  return document.cookie
    .split("; ")
    .find((c) => c.startsWith(`${name}=`))
    ?.split("=")[1];
}

export function useLanguage() {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const setLanguage = useCallback(
    (next: Locale, options: { saveToProfile?: boolean } = {}) => {
      if (next === locale) return;
      writeCookie(LANG_COOKIE, next);
      // Logged-in users also keep it on their profile (it picks seed data languages, schemas §5).
      if (options.saveToProfile) api.patch("me", { language: next }).catch(() => undefined);
      startTransition(() => router.refresh());
    },
    [locale, router]
  );

  return { locale, setLanguage, pending };
}

/** Applies a theme choice to <html>. "system" follows the device and its changes. */
export function applyTheme(theme: Theme) {
  const dark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  const root = document.documentElement;
  root.classList.toggle("dark", dark);
  root.classList.toggle("light", !dark);
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>("system");

  useEffect(() => {
    const saved = readCookie(THEME_COOKIE);
    // Reading the cookie once on mount; the server already painted the right colors.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (isTheme(saved)) setThemeState(saved);
  }, []);

  useEffect(() => {
    if (theme !== "system") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyTheme("system");
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [theme]);

  const setTheme = useCallback((next: Theme) => {
    writeCookie(THEME_COOKIE, next);
    setThemeState(next);
    applyTheme(next);
  }, []);

  return { theme, setTheme };
}
