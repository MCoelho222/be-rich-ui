"use client";
/**
 * The drawn projection chart: bars, the balance line and the month tooltip (dashboard.md §4.4).
 * Kept apart from ProjectionChart so recharts (about 130 KB gzipped) loads on its own,
 * after the rest of the dashboard is usable.
 */
import { useLocale, useTranslations } from "next-intl";
import { useId } from "react";
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
import { formatCompactMoney, formatMoney, formatMonth, formatMonthShort } from "@/lib/format";
import type { Projection } from "@/lib/queries";
import { useThemeColors } from "@/lib/theme-colors";
import { cn } from "@/lib/utils";
import type { DashboardView } from "./view";
import { Skeleton } from "./Widget";

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

export default function ProjectionPlot({
  data,
  view,
  width: boxWidth,
  height,
}: {
  data: Projection;
  view: DashboardView;
  /** The measured width of the scroll box. */
  width: number;
  height: number;
}) {
  const t = useTranslations("dashboard.chart");
  const locale = useLocale();
  const colors = useThemeColors();
  const uid = useId().replace(/:/g, "");
  const points = toPoints(data.months);
  if (!colors) return <Skeleton className="h-[340px] w-full" />;

  // On phones the chart keeps ~56px per month and scrolls sideways (dashboard.md §2.2).
  const width = Math.max(boxWidth, Math.max(points.length, 6) * 56);
  // Two panels on one month axis, never two scales on one plot: the balance on top, the
  // flows below, each with its own honest axis. Hovering a month highlights it in both.
  const balanceHeight = Math.round(height * 0.4);
  const flowsHeight = height - balanceHeight;
  const syncId = `projection-${uid}`;

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

  // Shared by both panels so their month columns line up exactly.
  const margin = { top: 0, right: 8, bottom: 0, left: 0 };
  const axisTick = { fill: colors["--text-muted"], fontSize: 11 };
  const cursor = { fill: colors["--text"], fillOpacity: 0.05 };
  const highlights = (
    <>
      {negativeMonths.map((p) => (
        <ReferenceArea
          key={p.key}
          x1={p.key}
          x2={p.key}
          fill={colors["--negative"]}
          fillOpacity={0.08}
          ifOverflow="extendDomain"
        />
      ))}
      {inPeriod.length > 0 && (
        <ReferenceArea
          x1={inPeriod[0].key}
          x2={inPeriod[inPeriod.length - 1].key}
          fill={colors["--text"]}
          fillOpacity={0.04}
          ifOverflow="extendDomain"
        />
      )}
    </>
  );
  const panelLabel = "pl-[60px] text-xs font-medium text-text-muted";

  return (
    <div className="flex flex-col gap-1" style={{ width }}>
      <p className={panelLabel}>{view.member === "me" ? t("householdBalance") : t("balance")}</p>
      <ComposedChart
        width={width}
        height={balanceHeight}
        data={points}
        syncId={syncId}
        margin={{ ...margin, top: 20 }}
      >
        <defs>
          <linearGradient id={`bal-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset={zeroAt} stopColor={colors["--text"]} />
            <stop offset={zeroAt} stopColor={colors["--negative"]} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke={colors["--line"]} />
        {highlights}
        <XAxis dataKey="key" hide />
        <YAxis
          tickFormatter={money}
          tickLine={false}
          axisLine={false}
          width={60}
          tickCount={3}
          tick={axisTick}
        />
        {min < 0 && (
          <ReferenceLine
            y={0}
            stroke={colors["--negative"]}
            strokeOpacity={0.5}
            strokeDasharray="4 4"
          />
        )}
        <Line
          dataKey="balance"
          type="linear"
          stroke={lineStroke}
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
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
                strokeWidth={2}
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
                y={Number(props.y) - 10}
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
        {/* The month's details show once, under the flows panel; here only the column lights up. */}
        <Tooltip content={() => null} cursor={cursor} />
      </ComposedChart>

      <p className={cn(panelLabel, "mt-2")}>{t("flows")}</p>
      <ComposedChart
        width={width}
        height={flowsHeight}
        data={points}
        syncId={syncId}
        barGap={3}
        margin={margin}
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
        </defs>
        <CartesianGrid vertical={false} stroke={colors["--line"]} />
        {highlights}
        <XAxis
          dataKey="key"
          tickFormatter={(key: string) => formatMonthShort(key, locale)}
          tickLine={false}
          axisLine={false}
          tick={{ ...axisTick, fontSize: 12 }}
        />
        <YAxis tickFormatter={money} tickLine={false} axisLine={false} width={60} tick={axisTick} />
        <Bar
          dataKey="incomeSolid"
          stackId="income"
          fill={colors["--income-bar"]}
          maxBarSize={22}
          isAnimationActive={false}
          shape={roundedTop((p) => p.incomeProjected === 0)}
        />
        <Bar
          dataKey="incomeProjected"
          stackId="income"
          fill={`url(#income-${uid})`}
          stroke={colors["--income-bar"]}
          strokeWidth={1}
          maxBarSize={22}
          isAnimationActive={false}
          shape={roundedTop(() => true)}
        />
        <Bar
          dataKey="expenseSolid"
          stackId="expense"
          fill={colors["--expense-bar"]}
          maxBarSize={22}
          isAnimationActive={false}
          shape={roundedTop((p) => p.expenseProjected === 0)}
        />
        <Bar
          dataKey="expenseProjected"
          stackId="expense"
          fill={`url(#expense-${uid})`}
          stroke={colors["--expense-bar"]}
          strokeWidth={1}
          maxBarSize={22}
          isAnimationActive={false}
          shape={roundedTop(() => true)}
        />
        <Tooltip
          content={(props) => (
            <MonthTooltip active={props.active} payload={props.payload} currency={data.currency} />
          )}
          cursor={cursor}
        />
      </ComposedChart>
    </div>
  );
}

interface BarShapeProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number | string;
  payload?: Point;
}

/**
 * A bar segment drawn with 4px rounded corners at its data end and square at the baseline.
 * Only the segment on top of its stack is rounded, so a stack reads as one bar.
 */
function roundedTop(isTop: (point: Point) => boolean) {
  function RoundedTopBar({
    x = 0,
    y = 0,
    width = 0,
    height = 0,
    payload,
    ...paint
  }: BarShapeProps) {
    if (height <= 0 || width <= 0) return <g />;
    const r = payload && isTop(payload) ? Math.min(4, width / 2, height) : 0;
    const d = `M${x},${y + height}V${y + r}Q${x},${y} ${x + r},${y}H${x + width - r}Q${x + width},${y} ${x + width},${y + r}V${y + height}Z`;
    return <path d={d} fill={paint.fill} stroke={paint.stroke} strokeWidth={paint.strokeWidth} />;
  }
  return RoundedTopBar;
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
          [t("realized"), part.realized, false],
          [t("scheduled"), part.scheduled, false],
          [t("projectedFixed"), part.projected_fixed, true],
        ] as const
      ).map(([name, value, projected]) => (
        <tr key={name}>
          <td className="pr-4 text-text-muted">{name}</td>
          <td className={cn("num text-right", projected && "text-text-2 italic")}>
            {formatMoney(value, currency, { projected })}
          </td>
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
              className={cn(
                "num pt-2 text-right font-semibold",
                m.end_balance !== null && Number(m.end_balance) < 0 && "text-negative"
              )}
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
