"use client";
/** Totals per category, Expenses or Incomes, only the categories in use (dashboard.md §4.6). */
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useId, useState } from "react";
import { Money } from "@/components/money/Money";
import { formatShare } from "@/lib/format";
import { byId, useCategories, useCategoryBreakdown, type ReportFilters } from "@/lib/queries";
import type { DashboardView, useDashboardView } from "./view";
import { CurrencyNote, Skeleton, TypeTabs, WidgetCard, WidgetError, tabId } from "./Widget";

/** Categories have no color of their own: a fixed palette (frontend.md §6.1). */
export const CATEGORY_PALETTE = [
  "#0ea5e9",
  "#8b5cf6",
  "#f59e0b",
  "#ec4899",
  "#14b8a6",
  "#f97316",
  "#6366f1",
  "#84cc16",
];
const VISIBLE = 8;

/** A category keeps the same color whatever its rank in the period, so it stays recognizable. */
export function categoryColor(categoryId: string): string {
  let hash = 0;
  for (const char of categoryId) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return CATEGORY_PALETTE[hash % CATEGORY_PALETTE.length];
}

type Update = ReturnType<typeof useDashboardView>["update"];

export function CategoryBreakdown({
  view,
  update,
  filters,
}: {
  view: DashboardView;
  update: Update;
  filters: ReportFilters;
}) {
  const t = useTranslations("dashboard.categories");
  const type = view.categories === "incomes" ? "INCOME" : "EXPENSE";
  const breakdown = useCategoryBreakdown(view.range.from, view.range.to, type, filters);
  const names = byId(useCategories().data);
  const [showAll, setShowAll] = useState(false);
  const panelId = useId();

  const items = breakdown.data?.items ?? [];
  const visible = showAll ? items : items.slice(0, VISIBLE);
  const max = Math.max(...items.map((i) => Number(i.total)), 0);

  return (
    <WidgetCard
      title={t("title")}
      actions={
        <TypeTabs
          label={t("title")}
          value={view.categories}
          onChange={(categories) => update({ categories })}
          panelId={panelId}
          options={[
            { value: "expenses", label: t("expenses"), tone: "expense" },
            { value: "incomes", label: t("incomes"), tone: "income" },
          ]}
        />
      }
    >
      <div
        id={panelId}
        role="tabpanel"
        aria-labelledby={tabId(panelId, view.categories)}
        className="contents"
      >
        {breakdown.isPending ? (
          <div className="flex flex-col gap-4">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-9 w-full" />
            ))}
          </div>
        ) : breakdown.isError ? (
          <WidgetError onRetry={() => void breakdown.refetch()} />
        ) : items.length === 0 ? (
          <p className="py-6 text-center text-sm text-text-muted">
            {type === "EXPENSE" ? t("emptyExpenses") : t("emptyIncomes")}
          </p>
        ) : (
          <ul className="flex flex-col gap-3.5">
            {visible.map((item) => {
              const color = categoryColor(item.category_id);
              const total = Number(item.total);
              const realized = Number(item.realized);
              const projectedPart = total - realized;
              const href = `/entries?tab=${view.categories}&category=${item.category_id}&by=payment&from=${view.range.from}&to=${view.range.to}`;
              return (
                <li key={item.category_id}>
                  <Link href={href} className="group flex flex-col gap-1.5 rounded-md">
                    <span className="flex items-baseline gap-2 text-sm">
                      <span
                        aria-hidden
                        className="size-2 self-center rounded-sm"
                        style={{ background: color }}
                      />
                      <span className="flex-1 truncate font-medium group-hover:underline">
                        {names.get(item.category_id)?.name ?? "—"}
                      </span>
                      <Money
                        amount={item.total}
                        currency={breakdown.data.currency}
                        projected={projectedPart > 0}
                      />
                      <span className="num w-11 text-right text-[13px] text-text-muted">
                        {formatShare(item.share)}
                      </span>
                    </span>
                    <span className="flex h-2 overflow-hidden rounded bg-surface-2" aria-hidden>
                      <span
                        style={{ width: `${max ? (realized / max) * 100 : 0}%`, background: color }}
                      />
                      <span
                        className="hatch"
                        style={{ width: `${max ? (projectedPart / max) * 100 : 0}%`, color }}
                      />
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
        {items.length > VISIBLE && (
          <button
            type="button"
            onClick={() => setShowAll((v) => !v)}
            className="-my-2 self-start py-2 text-sm text-brand hover:text-brand-hover hover:underline"
          >
            {showAll ? t("showLess") : t("showAll", { count: items.length })}
          </button>
        )}
        <CurrencyNote data={breakdown.data} />
      </div>
    </WidgetCard>
  );
}
