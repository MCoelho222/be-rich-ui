"use client";
/**
 * The Entries page's view, kept in the URL (frontend.md §6.2): tab, period and filters.
 * Dashboard links arrive with from/to and a category or card (dashboard.md §4.6–§4.7), and
 * by=payment, since those ranges are payment dates.
 */
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import { isIsoDate, presetRange, PRESETS, todayIso, type Preset, type Range } from "@/lib/period";

export const FILTER_KEYS = ["account", "card", "category", "person", "method"] as const;
export type FilterKey = (typeof FILTER_KEYS)[number];

/** Which date the period applies to: when it was bought, or when it is paid (cash flow). */
export type DateBasis = "purchase" | "payment";

export interface EntriesView {
  tab: "expenses" | "incomes";
  by: DateBasis;
  preset: Preset;
  range: Range;
  q: string;
  fixed: boolean;
  filters: Partial<Record<FilterKey, string>>;
}

export function useEntriesView() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = searchParams.toString();
  const today = todayIso();

  const view = useMemo<EntriesView>(() => {
    const params = new URLSearchParams(query);
    const from = params.get("from");
    const to = params.get("to");
    const rawPreset = params.get("period");
    let preset: Preset = PRESETS.includes(rawPreset as Preset)
      ? (rawPreset as Preset)
      : "this-month";
    let range: Range;
    // Explicit dates (custom, or a dashboard link) win over a preset.
    if ((preset === "custom" || !rawPreset) && isIsoDate(from) && isIsoDate(to) && from <= to) {
      preset = "custom";
      range = { from, to };
    } else {
      if (preset === "custom") preset = "this-month";
      range = presetRange(preset as Exclude<Preset, "custom">, today);
    }
    const filters: EntriesView["filters"] = {};
    for (const key of FILTER_KEYS) {
      const value = params.get(key);
      if (value) filters[key] = value;
    }
    return {
      tab: params.get("tab") === "incomes" ? "incomes" : "expenses",
      by: params.get("by") === "payment" ? "payment" : "purchase",
      preset,
      range,
      q: params.get("q") ?? "",
      fixed: params.get("fixed") === "1",
      filters,
    };
  }, [query, today]);

  const update = useCallback(
    (
      change: Partial<{
        tab: EntriesView["tab"];
        by: DateBasis;
        preset: Preset;
        from: string;
        to: string;
        q: string;
        fixed: boolean;
      }> & { filters?: EntriesView["filters"] }
    ) => {
      const params = new URLSearchParams(query);
      const set = (key: string, value: string | null | undefined) =>
        value ? params.set(key, value) : params.delete(key);
      if (change.tab) {
        set("tab", change.tab === "incomes" ? "incomes" : null);
        // Card and method filters differ between expenses and incomes.
        params.delete("card");
        params.delete("category");
      }
      if (change.preset) {
        set("period", change.preset === "this-month" ? null : change.preset);
        if (change.preset !== "custom") {
          params.delete("from");
          params.delete("to");
        }
      }
      if (change.from && change.to) {
        set("from", change.from);
        set("to", change.to);
      }
      if (change.by) set("by", change.by === "payment" ? "payment" : null);
      if (change.q !== undefined) set("q", change.q.trim() || null);
      if (change.fixed !== undefined) set("fixed", change.fixed ? "1" : null);
      if (change.filters) for (const key of FILTER_KEYS) set(key, change.filters[key]);
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [query, router, pathname]
  );

  return { view, update };
}
