"use client";
/** Monthly income and expense bars with the cumulative projected balance line (dashboard.md §4.4). */
import { AlertTriangle, Plus } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useId, useState } from "react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceArea,
  ReferenceLine,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useNewEntry } from "@/components/shell/NewEntry";
import { formatCompact, formatMoney, formatMonth, formatMonthShort } from "@/lib/format";
import { chartRange, todayIso } from "@/lib/period";
import { useProjection, type Projection, type ReportFilters } from "@/lib/queries";
import { useThemeColors } from "@/lib/theme-colors";
import type { DashboardView } from "./view";
import { CurrencyNote, Skeleton, WidgetCard, WidgetError } from "./Widget";

type Month = Projection["months"][number];

interface Point {
  key: string;
  month: Month;
  incomeSolid: number;
  incomeProjected: number;
  expenseSolid: number;
  expenseProjected: number;
  balance: number | null;
}

const CHART_HEIGHT = 280;

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

// Chart geometry only: amounts are converted to numbers to be drawn, never to be summed.
const n = (value: string) => Number(value);

function toPoints(months: Month[]): Point[] {
  return months.map((m) => ({
    key: m.month,
    month: m,
    incomeSolid: n(m.income.realized) + n(m.income.scheduled),
    incomeProjected: n(m.income.projected_fixed),
    expenseSolid: n(m.expenses.realized) + n(m.expenses.scheduled),
    expenseProjected: n(m.expenses.projected_fixed),
    balance: m.end_balance === null ? null : n(m.end_balance),
  }));
}

export function ProjectionChart({
  view,
  filters,
}: {
  view: DashboardView;
  filters: ReportFilters;
}) {
  const t = useTranslations("dashboard.chart");
  const locale = useLocale();
  const range = chartRange(view.range, todayIso());
  const projection = useProjection(range.from, range.to, filters);

  return (
    <WidgetCard title={t("title")} actions={<Legend />}>
      {projection.isPending ? (
        <Skeleton className="h-[280px] w-full" />
      ) : projection.isError ? (
        <WidgetError onRetry={() => void projection.refetch()} />
      ) : (
        <>
          {projection.data.first_negative_month && (
            <p className="inline-flex items-center gap-2 self-start rounded-full bg-negative-soft px-3 py-1.5 text-[13px] font-medium text-negative">
              <AlertTriangle size={14} aria-hidden />
              {t("negative", { month: formatMonth(projection.data.first_negative_month, locale) })}
            </p>
          )}
          <ChartBody data={projection.data} view={view} />
          <CurrencyNote data={projection.data} />
        </>
      )}
    </WidgetCard>
  );
}

function Legend() {
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
        <span className="hatch size-2.5 rounded-sm border border-expense-bar text-expense-bar" />,
        t("projected")
      )}
      {item(<span className="h-0.5 w-3.5 bg-text" />, t("balance"))}
    </div>
  );
}

function ChartBody({ data, view }: { data: Projection; view: DashboardView }) {
  const t = useTranslations("dashboard.chart");
  const locale = useLocale();
  const colors = useThemeColors();
  const { open } = useNewEntry();
  const uid = useId().replace(/:/g, "");
  const [boxRef, boxWidth] = useWidth<HTMLDivElement>();
  const points = toPoints(data.months);

  const empty = data.months.every((m) => n(m.income.total) === 0 && n(m.expenses.total) === 0);
  if (empty) {
    return (
      <div className="flex h-[220px] flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-line-strong text-sm text-text-muted">
        {t("empty")}
        <button
          type="button"
          onClick={() => open("expense")}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-brand px-3.5 font-semibold text-on-brand hover:bg-brand-hover"
        >
          <Plus size={16} aria-hidden />
          {t("addFirst")}
        </button>
      </div>
    );
  }
  // On phones the chart keeps ~56px per month and scrolls sideways (dashboard.md §2.2).
  const width = Math.max(boxWidth, Math.max(points.length, 6) * 56);
  if (!colors || boxWidth === 0) {
    // Keep the measured box mounted while the width and theme colors are read.
    return (
      <div ref={boxRef} style={{ minHeight: CHART_HEIGHT }}>
        <Skeleton className="h-[280px] w-full" />
      </div>
    );
  }

  // The selected period's months are highlighted.
  const inPeriod = points.filter(
    (p) => p.key >= view.range.from.slice(0, 7) && p.key <= view.range.to.slice(0, 7)
  );
  // The balance line turns red below zero: a vertical gradient split at the zero line.
  const balances = points.map((p) => p.balance).filter((b): b is number => b !== null);
  const max = Math.max(...balances, 0);
  const min = Math.min(...balances, 0);
  const zeroAt = max === min ? 1 : max / (max - min);
  const lineStroke =
    max === min || min >= 0
      ? colors["--text"]
      : max <= 0
        ? colors["--negative"]
        : `url(#bal-${uid})`;
  const first = data.months[0]?.month;
  const last = data.months[data.months.length - 1]?.month;

  return (
    <div
      ref={boxRef}
      className="custom-scrollbar overflow-x-auto"
      style={{ minHeight: CHART_HEIGHT }}
    >
      <ComposedChart
        width={width}
        height={CHART_HEIGHT}
        data={points}
        barGap={3}
        margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
        accessibilityLayer
        title={t("aria", { from: formatMonth(first, locale), to: formatMonth(last, locale) })}
      >
        <defs>
          {(["income", "expense"] as const).map((kind) => {
            const color = colors[kind === "income" ? "--income-bar" : "--expense-bar"];
            return (
              <pattern
                key={kind}
                id={`${kind}-${uid}`}
                width="6"
                height="6"
                patternUnits="userSpaceOnUse"
                patternTransform="rotate(45)"
              >
                <rect width="6" height="6" fill={color} fillOpacity={0.12} />
                <line x1="0" y1="0" x2="0" y2="6" stroke={color} strokeWidth="2.2" />
              </pattern>
            );
          })}
          <linearGradient id={`bal-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset={zeroAt} stopColor={colors["--text"]} />
            <stop offset={zeroAt} stopColor={colors["--negative"]} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke={colors["--line"]} />
        {inPeriod.length > 0 && (
          <ReferenceArea
            x1={inPeriod[0].key}
            x2={inPeriod[inPeriod.length - 1].key}
            fill={colors["--text"]}
            fillOpacity={0.04}
            ifOverflow="extendDomain"
          />
        )}
        <XAxis
          dataKey="key"
          tickFormatter={(key: string) => formatMonthShort(key, locale)}
          tickLine={false}
          axisLine={false}
          tick={{ fill: colors["--text-muted"], fontSize: 12 }}
        />
        <YAxis
          tickFormatter={(value: number) => formatCompact(value, locale)}
          tickLine={false}
          axisLine={false}
          width={44}
          tick={{ fill: colors["--text-muted"], fontSize: 11 }}
        />
        <ReferenceLine y={0} stroke={colors["--line-strong"]} strokeDasharray="4 4" />
        <Bar
          dataKey="incomeSolid"
          stackId="income"
          fill={colors["--income-bar"]}
          maxBarSize={22}
          isAnimationActive={false}
        />
        <Bar
          dataKey="incomeProjected"
          stackId="income"
          fill={`url(#income-${uid})`}
          stroke={colors["--income-bar"]}
          strokeWidth={1}
          maxBarSize={22}
          isAnimationActive={false}
        />
        <Bar
          dataKey="expenseSolid"
          stackId="expense"
          fill={colors["--expense-bar"]}
          maxBarSize={22}
          isAnimationActive={false}
        />
        <Bar
          dataKey="expenseProjected"
          stackId="expense"
          fill={`url(#expense-${uid})`}
          stroke={colors["--expense-bar"]}
          strokeWidth={1}
          maxBarSize={22}
          isAnimationActive={false}
        />
        <Line
          dataKey="balance"
          type="linear"
          stroke={lineStroke}
          strokeWidth={2.5}
          connectNulls
          isAnimationActive={false}
          dot={(props: { cx?: number; cy?: number; payload?: Point; index?: number }) => {
            const negative = (props.payload?.balance ?? 0) < 0;
            if (props.cx === undefined || props.cy === undefined || props.payload?.balance === null)
              return <g key={props.index} />;
            return (
              <circle
                key={props.index}
                cx={props.cx}
                cy={props.cy}
                r={4}
                fill={colors["--surface"]}
                stroke={negative ? colors["--negative"] : colors["--text"]}
                strokeWidth={2.5}
              />
            );
          }}
          activeDot={{ r: 5 }}
        />
        <Tooltip
          content={(props) => (
            <MonthTooltip active={props.active} payload={props.payload} currency={data.currency} />
          )}
          cursor={{ fill: colors["--text"], fillOpacity: 0.05 }}
        />
      </ComposedChart>
    </div>
  );
}

function MonthTooltip({
  active,
  payload,
  currency,
}: {
  active?: boolean;
  payload?: ReadonlyArray<{ payload?: unknown }>;
  currency: string;
}) {
  const t = useTranslations("dashboard.chart");
  const locale = useLocale();
  const point = payload?.[0]?.payload as Point | undefined;
  if (!active || !point) return null;
  const m = point.month;
  const rows = (label: string, part: Month["income"]) => (
    <>
      <tr>
        <td colSpan={2} className="pt-2 pb-0.5 text-xs font-semibold text-text">
          {label}
        </td>
      </tr>
      {(
        [
          [t("realized"), part.realized],
          [t("scheduled"), part.scheduled],
          [t("projectedFixed"), part.projected_fixed],
        ] as const
      ).map(([name, value]) => (
        <tr key={name}>
          <td className="pr-4 text-text-muted">{name}</td>
          <td className="num text-right">{formatMoney(value, currency)}</td>
        </tr>
      ))}
    </>
  );
  return (
    <div className="rounded-lg border border-line bg-surface px-3 py-2.5 text-[13px] shadow-lg shadow-black/10">
      <p className="font-semibold">{formatMonth(m.month, locale)}</p>
      <table>
        <tbody>
          {rows(t("income"), m.income)}
          {rows(t("expenses"), m.expenses)}
          <tr>
            <td className="pt-2 pr-4 font-semibold">{t("endBalance")}</td>
            <td
              className={`num pt-2 text-right font-semibold ${m.end_balance !== null && Number(m.end_balance) < 0 ? "text-negative" : ""}`}
            >
              {m.end_balance === null
                ? "—"
                : formatMoney(m.end_balance, currency, { projected: m.end_balance_projected })}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
