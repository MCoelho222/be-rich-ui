"use client";
/** The EN/PT and System/Light/Dark toggles (specs/frontend.md §1.2, §2). */
import { Monitor, Moon, Sun } from "lucide-react";
import { useTranslations } from "next-intl";
import { useLanguage, useTheme } from "@/lib/preferences";
import type { Locale, Theme } from "@/i18n/config";
import { Segmented } from "./Segmented";

interface ToggleProps {
  size?: "sm" | "md";
  className?: string;
}

export function LanguageToggle({ size, className, saveToProfile = false }: ToggleProps & { saveToProfile?: boolean }) {
  const t = useTranslations("common");
  const { locale, setLanguage } = useLanguage();
  return (
    <Segmented<Locale>
      label={t("language")}
      value={locale}
      onChange={(next) => setLanguage(next, { saveToProfile })}
      options={[
        { value: "en", label: "EN", title: "English" },
        { value: "pt", label: "PT", title: "Português" },
      ]}
      size={size}
      className={className}
    />
  );
}

export function ThemeToggle({ size, className }: ToggleProps) {
  const t = useTranslations("common");
  const { theme, setTheme } = useTheme();
  const icon = size === "sm" ? 13 : 15;
  return (
    <Segmented<Theme>
      label={t("theme")}
      value={theme}
      onChange={setTheme}
      options={[
        { value: "system", label: <Monitor size={icon} aria-hidden />, title: t("themeSystem") },
        { value: "light", label: <Sun size={icon} aria-hidden />, title: t("themeLight") },
        { value: "dark", label: <Moon size={icon} aria-hidden />, title: t("themeDark") },
      ]}
      size={size}
      className={className}
    />
  );
}
