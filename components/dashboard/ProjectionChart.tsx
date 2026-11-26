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
import { formatCompactMoney, formatMoney, formatMonth, formatMonthShort } from "@/lib/format";
import { chartRange, firstOfMonth, lastOfMonth, todayIso } from "@/lib/period";
import { useProjection, type Projection, type ReportFilters } from "@/lib/queries";
import { useThemeColors } from "@/lib/theme-colors";
import { projectionOutlook } from "./outlook";
import type { DashboardView, useDashboardView } from "./view";
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
    <WidgetCard title={t("title")} actions={<Legend household={view.member === "me"} />}>
      {projection.isPending ? (
        <Skeleton className="h-[280px] w-full" />
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
  const locale = useLocale();
  const colors = useThemeColors();
  const { open } = useNewEntry();
  const uid = useId().replace(/:/g, "");
  const [boxRef, boxWidth] = useWidth<HTMLDivElement>();
  const points = toPoints(data.months);

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
  // Balance labelled on the line where it matters: the start, the lowest point, the end.
  const withBalance = points.flatMap((p, i) => (p.balance === null ? [] : [i]));
  const lowest = withBalance.reduce(
    (a, b) => (points[b].balance! < points[a].balance! ? b : a),
    withBalance[0] ?? -1
  );
  const labelled = new Set([withBalance[0], lowest, withBalance[withBalance.length - 1]]);
  const negativeMonths = points.filter((p) => p.balance !== null && p.balance < 0);
  const money = (value: number) => formatCompactMoney(value, data.currency, locale);

  return (
    <div
      ref={boxRef}
      className="custom-scrollbar overflow-x-auto"
      style={{ minHeight: CHART_HEIGHT }}
    >
      <MonthTable data={data} />
      <ComposedChart
        width={width}
        height={CHART_HEIGHT}
        data={points}
        barGap={3}
        margin={{ top: 24, right: 4, bottom: 0, left: 0 }}
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
        <CartesianGrid yAxisId="flow" vertical={false} stroke={colors["--line"]} />
        {negativeMonths.map((p) => (
          <ReferenceArea
            key={p.key}
            yAxisId="flow"
            x1={p.key}
            x2={p.key}
            fill={colors["--negative"]}
            fillOpacity={0.08}
            ifOverflow="extendDomain"
          />
        ))}
        {inPeriod.length > 0 && (
          <ReferenceArea
            yAxisId="flow"
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
        {/* Flows and the balance differ by an order of magnitude: each gets its own axis. */}
        <YAxis
          yAxisId="flow"
          tickFormatter={money}
          tickLine={false}
          axisLine={false}
          width={60}
          tick={{ fill: colors["--text-muted"], fontSize: 11 }}
        />
        <YAxis
          yAxisId="balance"
          orientation="right"
          tickFormatter={money}
          tickLine={false}
          axisLine={false}
          width={60}
          tick={{ fill: colors["--text-muted"], fontSize: 11 }}
        />
        {min < 0 && (
          <ReferenceLine
            yAxisId="balance"
            y={0}
            stroke={colors["--negative"]}
            strokeOpacity={0.5}
            strokeDasharray="4 4"
          />
        )}
        <Bar
          dataKey="incomeSolid"
          yAxisId="flow"
          stackId="income"
          fill={colors["--income-bar"]}
          maxBarSize={22}
          isAnimationActive={false}
        />
        <Bar
          dataKey="incomeProjected"
          yAxisId="flow"
          stackId="income"
          fill={`url(#income-${uid})`}
          stroke={colors["--income-bar"]}
          strokeWidth={1}
          maxBarSize={22}
          isAnimationActive={false}
        />
        <Bar
          dataKey="expenseSolid"
          yAxisId="flow"
          stackId="expense"
          fill={colors["--expense-bar"]}
          maxBarSize={22}
          isAnimationActive={false}
        />
        <Bar
          dataKey="expenseProjected"
          yAxisId="flow"
          stackId="expense"
          fill={`url(#expense-${uid})`}
          stroke={colors["--expense-bar"]}
          strokeWidth={1}
          maxBarSize={22}
          isAnimationActive={false}
        />
        <Line
          dataKey="balance"
          yAxisId="balance"
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
          label={(props: { x?: number | string; y?: number | string; index?: number }) => {
            const point = props.index === undefined ? undefined : points[props.index];
            if (!point || point.balance === null || !labelled.has(props.index!))
              return <g key={`label-${props.index}`} />;
            return (
              <text
                key={`label-${props.index}`}
                x={Number(props.x)}
                y={Number(props.y) - 12}
                textAnchor="middle"
                fontSize={11}
                fontWeight={600}
                className="num"
                fill={point.balance < 0 ? colors["--negative"] : colors["--text"]}
              >
                {money(point.balance)}
              </text>
            );
          }}
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
