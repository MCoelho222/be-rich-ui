"use client";
/** Monthly income and expense bars with the cumulative projected balance line (dashboard.md §4.4). */
import { AlertTriangle, Plus } from "lucide-react";
import dynamic from "next/dynamic";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useNewEntry } from "@/components/shell/NewEntry";
import { formatMoney, formatMonth } from "@/lib/format";
import { chartRange, firstOfMonth, lastOfMonth, todayIso } from "@/lib/period";
import { useProjection, type Projection, type ReportFilters } from "@/lib/queries";
import { projectionOutlook } from "./outlook";
import type { DashboardView, useDashboardView } from "./view";
import { CurrencyNote, Skeleton, WidgetCard, WidgetError } from "./Widget";

/** Both panels with their labels: the balance on top, income and expenses below. */
const CHART_HEIGHT = 340;

function ChartSkeleton() {
  return <Skeleton className="h-[340px] w-full" />;
}

// recharts is the dashboard's largest dependency: it loads on its own, behind the skeleton.
const ProjectionPlot = dynamic(() => import("./ProjectionPlot"), {
  ssr: false,
  loading: ChartSkeleton,
});

/**
 * The element's width, kept current. Recharts gets explicit sizes, measured here.
 * A callback ref, so the observer follows the element even if it mounts later.
 */
function useWidth<T extends HTMLElement>() {
  const [node, setNode] = useState<T | null>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    if (!node) return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.floor(entry.contentRect.width)));
    observer.observe(node);
    return () => observer.disconnect();
  }, [node]);
  return [setNode, width] as const;
}

// Amounts are converted to numbers only to test for zero, never to be summed.
const n = (value: string) => Number(value);

type Update = ReturnType<typeof useDashboardView>["update"];

export function ProjectionChart({
  view,
  update,
  filters,
}: {
  view: DashboardView;
  update: Update;
  filters: ReportFilters;
}) {
  const t = useTranslations("dashboard.chart");
  const range = chartRange(view.range, todayIso());
  const projection = useProjection(range.from, range.to, filters);

  return (
    <WidgetCard
      title={t("title")}
      actions={<Legend household={view.member === "me"} />}
      updating={projection.isPlaceholderData}
    >
      {projection.isPending ? (
        <Skeleton className="h-[340px] w-full" />
      ) : projection.isError ? (
        <WidgetError onRetry={() => void projection.refetch()} />
      ) : (
        <>
          <NegativeWarning data={projection.data} update={update} />
          <ChartBody data={projection.data} view={view} />
          <CurrencyNote data={projection.data} />
        </>
      )}
    </WidgetCard>
  );
}

/** When the balance would go below zero: when, how low, and a way to open that month. */
function NegativeWarning({ data, update }: { data: Projection; update: Update }) {
  const t = useTranslations("dashboard.chart");
  const locale = useLocale();
  const outlook = projectionOutlook(data, todayIso());
  const month = data.first_negative_month;
  if (!month) return null;
  return (
    <div
      role="status"
      className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg bg-negative-soft px-3 py-2 text-[13px] text-negative"
    >
      <AlertTriangle size={15} className="shrink-0" aria-hidden />
      <span className="font-medium">{t("negative", { month: formatMonth(month, locale) })}</span>
      {outlook && (
        <span className="num">
          {t("shortfall", {
            amount: formatMoney(outlook.low.balance, data.currency, {
              projected: outlook.low.projected,
            }),
            month: formatMonth(outlook.low.month, locale),
          })}
        </span>
      )}
      <button
        type="button"
        onClick={() =>
          update({
            preset: "custom",
            from: firstOfMonth(`${month}-01`),
            to: lastOfMonth(`${month}-01`),
          })
        }
        className="-my-1 ml-auto inline-flex h-10 items-center rounded-md px-2 font-medium underline-offset-2 hover:underline sm:h-7"
      >
        {t("seeMonth", { month: formatMonth(month, locale) })}
      </button>
    </div>
  );
}

function Legend({ household }: { household: boolean }) {
  const t = useTranslations("dashboard.chart");
  const item = (swatch: React.ReactNode, label: string) => (
    <span className="inline-flex items-center gap-1.5">
      {swatch}
      {label}
    </span>
  );
  return (
    <div className="flex flex-wrap gap-3.5 text-xs text-text-muted">
      {item(<span className="size-2.5 rounded-sm bg-income-bar" />, t("income"))}
      {item(<span className="size-2.5 rounded-sm bg-expense-bar" />, t("expenses"))}
      {item(
        <span className="hatch size-2.5 rounded-sm border border-text-muted text-text-muted" />,
        t("projected")
      )}
      {item(
        <span className="h-0.5 w-3.5 bg-text" />,
        household ? t("householdBalance") : t("balance")
      )}
    </div>
  );
}

function ChartBody({ data, view }: { data: Projection; view: DashboardView }) {
  const t = useTranslations("dashboard.chart");
  const { open } = useNewEntry();
  const [boxRef, boxWidth] = useWidth<HTMLDivElement>();

  const empty = data.months.every((m) => n(m.income.total) === 0 && n(m.expenses.total) === 0);
  if (empty) {
    return (
      <div className="flex h-[220px] flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-line-strong px-4 text-center text-sm text-text-muted">
        {t("empty")}
        <div className="flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={() => open("expense")}
            className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-brand px-3.5 font-semibold text-on-brand hover:bg-brand-hover sm:h-9"
          >
            <Plus size={16} aria-hidden />
            {t("addFirst")}
          </button>
          <button
            type="button"
            onClick={() => open("income")}
            className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-line-strong px-3.5 font-medium text-text hover:bg-surface-2 sm:h-9"
          >
            <Plus size={16} aria-hidden />
            {t("addIncome")}
          </button>
        </div>
      </div>
    );
  }
  return (
    <div
      ref={boxRef}
      className="custom-scrollbar overflow-x-auto"
      style={{ minHeight: CHART_HEIGHT }}
    >
      <MonthTable data={data} />
      {boxWidth > 0 ? (
        <ProjectionPlot data={data} view={view} width={boxWidth} height={CHART_HEIGHT - 44} />
      ) : (
        <ChartSkeleton />
      )}
    </div>
  );
}

/** The chart's numbers as a table, for screen readers (the tooltip is pointer-only). */
function MonthTable({ data }: { data: Projection }) {
  const t = useTranslations("dashboard.chart");
  const locale = useLocale();
  const money = (value: string, projected = false) =>
    formatMoney(value, data.currency, { projected });
  return (
    <table className="sr-only">
      <caption>{t("title")}</caption>
      <thead>
        <tr>
          <th scope="col">{t("monthCol")}</th>
          <th scope="col">{t("income")}</th>
          <th scope="col">{t("expenses")}</th>
          <th scope="col">{t("endBalance")}</th>
        </tr>
      </thead>
      <tbody>
        {data.months.map((m) => (
          <tr key={m.month}>
            <th scope="row">{formatMonth(m.month, locale)}</th>
            <td>{money(m.income.total, n(m.income.projected_fixed) > 0)}</td>
            <td>{money(m.expenses.total, n(m.expenses.projected_fixed) > 0)}</td>
            <td>{m.end_balance === null ? "—" : money(m.end_balance, m.end_balance_projected)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
