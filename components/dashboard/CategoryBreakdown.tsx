"use client";
/** Totals per category, Expenses or Incomes, only the categories in use (dashboard.md §4.6). */
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useId, useState } from "react";
import { Money } from "@/components/money/Money";
import { formatShare } from "@/lib/format";
import { byId, useCategories, useCategoryBreakdown, type ReportFilters } from "@/lib/queries";
import { cn } from "@/lib/utils";
import type { DashboardView, useDashboardView } from "./view";
import { CurrencyNote, Skeleton, TypeTabs, WidgetCard, WidgetError, tabId } from "./Widget";

const VISIBLE = 8;

/**
 * One series, one colour: every bar takes the tab's colour (rose for expenses, emerald for
 * incomes). Each row names its category, so a colour per category would add nothing.
 */
const BAR = { EXPENSE: "bg-expense-bar", INCOME: "bg-income-bar" };
const HATCH = { EXPENSE: "text-expense-bar", INCOME: "text-income-bar" };

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
      updating={breakdown.isPlaceholderData}
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
              const total = Number(item.total);
              const realized = Number(item.realized);
              const projectedPart = total - realized;
              const href = `/entries?tab=${view.categories}&category=${item.category_id}&by=payment&from=${view.range.from}&to=${view.range.to}`;
              return (
                <li key={item.category_id}>
                  <Link href={href} className="group flex flex-col gap-1.5 rounded-md">
                    <span className="flex items-baseline gap-2 text-sm">
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
                        className={BAR[type]}
                        style={{ width: `${max ? (realized / max) * 100 : 0}%` }}
                      />
                      <span
                        className={cn("hatch", HATCH[type])}
                        style={{ width: `${max ? (projectedPart / max) * 100 : 0}%` }}
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
            className="-my-2 inline-flex min-h-10 items-center self-start text-sm sm:min-h-9 text-brand hover:text-brand-hover hover:underline"
          >
            {showAll ? t("showLess") : t("showAll", { count: items.length })}
          </button>
        )}
        <CurrencyNote data={breakdown.data} />
      </div>
    </WidgetCard>
  );
}
