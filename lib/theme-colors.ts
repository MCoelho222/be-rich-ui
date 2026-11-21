"use client";
/** Resolved theme token values for SVG attributes (charts), re-read when the theme class changes. */
import { useEffect, useState } from "react";

const TOKENS = [
  "--income-bar",
  "--expense-bar",
  "--text",
  "--text-muted",
  "--line",
  "--line-strong",
  "--negative",
  "--surface",
  "--surface-2",
] as const;
export type ThemeColors = Record<(typeof TOKENS)[number], string>;

function read(): ThemeColors {
  const style = getComputedStyle(document.documentElement);
  return Object.fromEntries(
    TOKENS.map((token) => [token, style.getPropertyValue(token).trim()])
  ) as ThemeColors;
}

export function useThemeColors(): ThemeColors | null {
  const [colors, setColors] = useState<ThemeColors | null>(null);
  useEffect(() => {
    // Computed styles only exist in the browser; read once mounted, then on theme changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setColors(read());
    const observer = new MutationObserver(() => setColors(read()));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);
  return colors;
}

/** "dark" or "light" as currently applied to <html> (the "system" choice resolved). */
export function useResolvedTheme(): "dark" | "light" {
  const [theme, setTheme] = useState<"dark" | "light">("light");
  useEffect(() => {
    const read = () =>
      setTheme(document.documentElement.classList.contains("dark") ? "dark" : "light");
    read();
    const observer = new MutationObserver(read);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);
  return theme;
}
