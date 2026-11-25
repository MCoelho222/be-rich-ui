"use client";
/**
 * The dashboard's view: period, account, Me/Everyone and the category toggle.
 * Kept in the URL (reload and shared links keep it) and saved in the browser, so opening
 * the dashboard without parameters restores the last view (dashboard.md §3.3).
 */
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo } from "react";
import { isIsoDate, presetRange, PRESETS, todayIso, type Preset, type Range } from "@/lib/period";

const STORAGE_KEY = "brs_dashboard_view";

export interface DashboardView {
  preset: Preset;
  range: Range;
  accountId: string | null;
  member: "me" | null;
  categories: "expenses" | "incomes";
}

type ViewChange = Partial<{
  preset: Preset;
  from: string;
  to: string;
  accountId: string | null;
  member: "me" | null;
  categories: "expenses" | "incomes";
}>;

function parse(params: URLSearchParams, today: string): DashboardView {
  const rawPreset = params.get("period");
  let preset: Preset = PRESETS.includes(rawPreset as Preset) ? (rawPreset as Preset) : "this-month";
  let range: Range;
  const from = params.get("from");
  const to = params.get("to");
  if (preset === "custom" && isIsoDate(from) && isIsoDate(to) && from <= to) {
    range = { from, to };
  } else {
    if (preset === "custom") preset = "this-month";
    range = presetRange(preset as Exclude<Preset, "custom">, today);
  }
  return {
    preset,
    range,
    accountId: params.get("account"),
    member: params.get("member") === "me" ? "me" : null,
    categories: params.get("categories") === "incomes" ? "incomes" : "expenses",
  };
}

function serialize(view: DashboardView): string {
  const params = new URLSearchParams();
  if (view.preset !== "this-month") params.set("period", view.preset);
  if (view.preset === "custom") {
    params.set("from", view.range.from);
    params.set("to", view.range.to);
  }
  if (view.accountId) params.set("account", view.accountId);
  if (view.member) params.set("member", view.member);
  if (view.categories === "incomes") params.set("categories", "incomes");
  return params.toString();
}

export function useDashboardView() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const today = todayIso();
  const query = searchParams.toString();
  const view = useMemo(() => parse(new URLSearchParams(query), today), [query, today]);

  // No parameters: restore the last saved view once.
  useEffect(() => {
    if (query) return;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) router.replace(`${pathname}?${saved}`, { scroll: false });
    } catch {
      /* storage unavailable */
    }
    // Only on the first visit without parameters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Any view with parameters (a change here, or a link opened) becomes the remembered one.
  useEffect(() => {
    if (!query) return;
    try {
      localStorage.setItem(STORAGE_KEY, serialize(view));
    } catch {
      /* storage unavailable */
    }
  }, [query, view]);

  const update = useCallback(
    (change: ViewChange) => {
      const next: DashboardView = { ...view };
      if (change.preset) {
        next.preset = change.preset;
        if (change.preset !== "custom") next.range = presetRange(change.preset, today);
      }
      if (change.from && change.to) next.range = { from: change.from, to: change.to };
      if ("accountId" in change) next.accountId = change.accountId ?? null;
      if ("member" in change) next.member = change.member ?? null;
      if (change.categories) next.categories = change.categories;
      const qs = serialize(next);
      try {
        localStorage.setItem(STORAGE_KEY, qs);
      } catch {
        /* storage unavailable */
      }
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [view, today, router, pathname]
  );

  /** Called when a saved account no longer exists: fall back to "All accounts". */
  const clearMissingAccount = useCallback(() => update({ accountId: null }), [update]);

  return { view, update, clearMissingAccount, today };
}
