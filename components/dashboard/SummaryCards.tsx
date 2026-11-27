"use client";
/**
 * The top of the dashboard (dashboard.md §4.1–§4.3). The balance leads as the one big figure,
 * with the projection's verdict under it; the period's flows follow as one group.
 */
import { AlertTriangle, ChevronDown, CircleAlert, Repeat, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { BalanceSplit } from "@/components/money/BalanceSplit";
import { BigMoney, Money } from "@/components/money/Money";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatMoney, formatMonth, formatShare } from "@/lib/format";
import { chartRange } from "@/lib/period";
import {
  byId,
  useAccounts,
  useBalances,
  useProjection,
  useSummary,
  type ReportFilters,
  type Summary,
} from "@/lib/queries";
import { cn } from "@/lib/utils";
import { projectionOutlook } from "./outlook";
import type { DashboardView } from "./view";
import { Skeleton, WidgetError } from "./Widget";

const cardClass =
  "flex min-w-0 flex-col gap-3 rounded-xl border border-line bg-surface p-4 transition-opacity sm:p-5";
const labelClass = "text-[13px] font-medium text-text-muted";
const captionClass = "text-[13px] text-text-muted";
/** Previous figures stay up, dimmed, while a new period or filter loads. */
const updatingClass = "opacity-60";

export function SummaryCards({
  view,
  filters,
  today,
}: {
  view: DashboardView;
  filters: ReportFilters;
  today: string;
}) {
  return (
    <div className="grid gap-4 sm:gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
      <BalanceCard view={view} filters={filters} today={today} />
      <FlowsCard view={view} filters={filters} />
    </div>
  );
}

// --- Balance, its outlook, and accounts below zero ------------------------------------

function BalanceCard({
  view,
  filters,
  today,
}: {
  view: DashboardView;
  filters: ReportFilters;
  today: string;
}) {
  const t = useTranslations("dashboard.cards");
  const accountFilter = { accountId: view.accountId };
  const now = useBalances(today, accountFilter);
  const end = useBalances(view.range.to, accountFilter);
  const accounts = useAccounts();
  const names = byId(accounts.data);

  if (now.isPending || end.isPending) {
    return (
      <div className={cardClass}>
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-9 w-44" />
        <Skeleton className="h-4 w-56" />
        <Skeleton className="h-4 w-64" />
      </div>
    );
  }
  if (now.isError || end.isError) {
    return (
      <div className={cardClass}>
        <WidgetError onRetry={() => void Promise.all([now.refetch(), end.refetch()])} />
      </div>
    );
  }

  const endProjected = end.data.projected;
  const noOpenings = (accounts.data ?? []).every((a) => Number(a.opening_balance) === 0);
  const endByAccount = new Map(end.data.accounts.map((a) => [a.account_id, a]));
  // Sign check only, to warn about accounts below zero (dashboard.md §1, question 1).
  const overdrawn = now.data.accounts.filter((a) => a.balance !== null && Number(a.balance) < 0);

  return (
    <section
      aria-labelledby="balance-label"
      aria-busy={now.isPlaceholderData || end.isPlaceholderData}
      className={cn(cardClass, (now.isPlaceholderData || end.isPlaceholderData) && updatingClass)}
    >
      <div className="flex items-center gap-2">
        <span id="balance-label" className={cn(labelClass, "flex-1")}>
          {view.member ? t("household") : t("total")}
        </span>
        <Popover>
          <PopoverTrigger className="-my-2 -mr-2 inline-flex h-10 items-center gap-1 rounded-md px-2 text-[13px] text-text-muted transition-colors hover:bg-surface-2 hover:text-text sm:h-8">
            {t("byAccount")}
            <ChevronDown size={14} aria-hidden />
          </PopoverTrigger>
          {/* Sized by its content: amounts never wrap, so a fixed width pushed the End column
              out of the box. Capped at the screen, where the table scrolls sideways instead. */}
          <PopoverContent
            align="end"
            className="w-auto max-w-[calc(100vw-2rem)] min-w-80 bg-surface/80 p-0 backdrop-blur-sm"
          >
            <div className="custom-scrollbar overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs tracking-wide text-text-muted uppercase">
                    <th className="px-4 pt-3 pb-2 font-medium">{t("account")}</th>
                    <th className="px-2 pt-3 pb-2 text-right font-medium">{t("now")}</th>
                    <th className="px-4 pt-3 pb-2 text-right font-medium">{t("endShort")}</th>
                  </tr>
                </thead>
                <tbody>
                  {now.data.accounts.map((row) => {
                    const later = endByAccount.get(row.account_id);
                    const name = names.get(row.account_id)?.name ?? "—";
                    return (
                      <tr key={row.account_id} className="border-t border-line">
                        <td className="max-w-32 truncate px-4 py-2" title={name}>
                          {name}
                        </td>
                        <td className="px-2 py-2 text-right">
                          {row.balance === null ? (
                            "—"
                          ) : (
                            <Money
                              amount={row.balance}
                              currency={row.account_currency}
                              className={cn(Number(row.balance) < 0 && "text-negative")}
                            />
                          )}
                        </td>
                        <td className="px-4 py-2 text-right">
                          {later?.balance == null ? (
                            "—"
                          ) : (
                            <Money
                              amount={later.balance}
                              currency={later.account_currency}
                              projected={endProjected}
                            />
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {(Number(now.data.investments) > 0 || Number(end.data.investments) > 0) && (
                    <tr className="border-t border-line">
                      <td className="px-4 py-2">
                        <Link href="/investments" className="hover:underline">
                          {t("investmentsRow")}
                        </Link>
                      </td>
                      <td className="px-2 py-2 text-right">
                        <Money amount={now.data.investments} currency={now.data.currency} />
                      </td>
                      <td className="px-4 py-2 text-right">
                        <Money
                          amount={end.data.investments}
                          currency={end.data.currency}
                          projected={endProjected}
                        />
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="border-t border-line px-4 py-2.5">
              <Link
                href="/accounts"
                className="text-sm text-brand hover:text-brand-hover hover:underline"
              >
                {t("viewAccounts")}
              </Link>
            </div>
          </PopoverContent>
        </Popover>
      </div>
      <div className="flex flex-col gap-1">
        <BigMoney amount={now.data.total} currency={now.data.currency} />
        <BalanceSplit
          total={now.data.total}
          investments={now.data.investments}
          currency={now.data.currency}
        />
      </div>
      <span className={captionClass}>
        {t("endOfPeriod")}{" "}
        <Money amount={end.data.total} currency={end.data.currency} projected={endProjected} />
      </span>
      <OutlookLine view={view} filters={filters} today={today} />
      {overdrawn.length > 0 && (
        <p className="flex items-start gap-2 rounded-lg bg-warning-soft px-3 py-2 text-[13px] text-warning">
          <CircleAlert size={15} className="mt-px shrink-0" aria-hidden />
          <span className="num">
            {overdrawn.length === 1
              ? t("overdrawnOne", {
                  name: names.get(overdrawn[0].account_id)?.name ?? "—",
                  amount: formatMoney(overdrawn[0].balance!, overdrawn[0].account_currency),
                })
              : t("overdrawnMany", { count: overdrawn.length })}
          </span>
        </p>
      )}
      {noOpenings && <span className="text-xs text-text-muted">{t("noOpening")}</span>}
    </section>
  );
}

/** The projection's verdict, read from the same query the chart uses (shared cache). */
function OutlookLine({
  view,
  filters,
  today,
}: {
  view: DashboardView;
  filters: ReportFilters;
  today: string;
}) {
  const t = useTranslations("dashboard.cards");
  const locale = useLocale();
  const range = chartRange(view.range, today);
  const projection = useProjection(range.from, range.to, filters);
  if (!projection.isSuccess) return null;
  const outlook = projectionOutlook(projection.data, today);
  if (!outlook) return null;

  const values = {
    amount: formatMoney(outlook.low.balance, projection.data.currency, {
      projected: outlook.low.projected,
    }),
    lowMonth: formatMonth(outlook.low.month, locale),
  };
  const negative = outlook.negativeFrom !== null;
  const Icon = negative ? AlertTriangle : TrendingUp;
  return (
    <p
      className={cn(
        "num flex items-start gap-2 text-[13px]",
        negative ? "font-medium text-negative" : "text-text-2"
      )}
    >
      <Icon
        size={15}
        className={cn("mt-px shrink-0", !negative && "text-text-muted")}
        aria-hidden
      />
      {negative
        ? t("outlookNegative", { month: formatMonth(outlook.negativeFrom!, locale), ...values })
        : t("outlookPositive", { month: formatMonth(outlook.through, locale), ...values })}
    </p>
  );
}

// --- The period's flows: income, expenses, net, and the fixed share --------------------

type Flow = Summary["income"];

function FlowsCard({ view, filters }: { view: DashboardView; filters: ReportFilters }) {
  const t = useTranslations("dashboard.cards");
  const summary = useSummary(view.range.from, view.range.to, filters);

  if (summary.isPending) {
    return (
      <div className={cardClass}>
        <div className="grid gap-5 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex flex-col gap-2.5">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-7 w-32" />
              <Skeleton className="h-4 w-36" />
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (summary.isError) {
    return (
      <div className={cardClass}>
        <WidgetError onRetry={() => void summary.refetch()} />
      </div>
    );
  }

  const s = summary.data;
  const share = s.fixed_expenses.share;
  return (
    <section
      aria-label={t("periodFlows")}
      aria-busy={summary.isPlaceholderData}
      className={cn(cardClass, "gap-4", summary.isPlaceholderData && updatingClass)}
    >
      <div className="grid gap-4 sm:grid-cols-3 sm:gap-6">
        <FlowFigure label={t("income")} flow={s.income} summary={s} tone="income" />
        <FlowFigure label={t("expenses")} flow={s.expenses} summary={s} tone="expense" />
        <FlowFigure label={t("net")} flow={s.net} summary={s} tone="default" />
      </div>
      {share !== null && (
        <Link
          href="/fixed"
          className="group -mx-1 inline-flex min-h-10 items-center gap-2 self-start rounded-md px-1 text-[13px] text-text-muted sm:min-h-0 sm:py-1"
        >
          <Repeat size={14} className="shrink-0 text-fixed" aria-hidden />
          <span className="num group-hover:text-text group-hover:underline">
            {t("fixedShare", {
              share: formatShare(share),
              amount: formatMoney(s.fixed_expenses.total, s.currency, {
                projected: s.includes_projection,
              }),
            })}
          </span>
        </Link>
      )}
    </section>
  );
}

/**
 * One flow. A period that is all past shows its total. One that reaches into the future
 * shows what is realized so far, labelled, with the projected total beside it; when nothing
 * is realized yet, the projected total itself is the figure (ui-behavior §1, dashboard §4.2).
 */
function FlowFigure({
  label,
  flow,
  summary,
  tone,
}: {
  label: string;
  flow: Flow;
  summary: Summary;
  tone: "default" | "income" | "expense";
}) {
  const t = useTranslations("dashboard.cards");
  const currency = summary.currency;
  const mixed = summary.includes_projection;
  // Zero check only: decides which figure leads, never arithmetic on money.
  const nothingRealized = mixed && Number(flow.realized) === 0;
  const lead = mixed && !nothingRealized ? flow.realized : flow.total;
  const caption = !mixed
    ? null
    : nothingRealized
      ? t("allProjected")
      : flow.total === flow.realized
        ? null
        : t("realizedOf", { amount: formatMoney(flow.total, currency, { projected: true }) });

  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-3 gap-y-1 sm:flex sm:flex-col sm:items-start sm:gap-2">
      <span className={labelClass}>{label}</span>
      <BigMoney
        amount={lead}
        currency={currency}
        tone={tone}
        size="md"
        projected={nothingRealized}
      />
      {caption && <span className={cn(captionClass, "num col-span-2")}>{caption}</span>}
    </div>
  );
}
