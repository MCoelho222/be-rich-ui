"use client";
/** Total balance, Income, Expenses, Net and Fixed (dashboard.md §4.1–§4.3). */
import Link from "next/link";
import { useTranslations } from "next-intl";
import { BigMoney, Money } from "@/components/money/Money";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatShare } from "@/lib/format";
import { byId, useAccounts, useBalances, useSummary, type ReportFilters } from "@/lib/queries";
import { cn } from "@/lib/utils";
import type { DashboardView } from "./view";
import { Skeleton, WidgetError } from "./Widget";

const cardClass =
  "flex min-w-0 flex-col gap-2.5 rounded-xl border border-line bg-surface p-4 sm:p-5";
// Phones: a horizontal row that snaps; larger screens: a grid.
const rowClass =
  "-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-[repeat(auto-fit,minmax(200px,1fr))] sm:gap-4 sm:overflow-visible sm:px-0 sm:pb-0 [&>*]:shrink-0 [&>*]:basis-[78%] [&>*]:snap-start sm:[&>*]:basis-auto";

function CardSkeleton() {
  return (
    <div className={cardClass}>
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-9 w-36" />
      <Skeleton className="h-4 w-32" />
    </div>
  );
}

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
    <div className={rowClass}>
      <TotalBalanceCard view={view} today={today} />
      <FlowCards view={view} filters={filters} />
    </div>
  );
}

function TotalBalanceCard({ view, today }: { view: DashboardView; today: string }) {
  const t = useTranslations("dashboard.cards");
  const accountFilter = { accountId: view.accountId };
  const now = useBalances(today, accountFilter);
  const end = useBalances(view.range.to, accountFilter);
  const accounts = useAccounts();
  const names = byId(accounts.data);

  if (now.isPending || end.isPending) return <CardSkeleton />;
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

  return (
    <Popover>
      <PopoverTrigger
        className={cn(cardClass, "text-left transition-colors hover:border-line-strong")}
      >
        <span className="text-[13px] font-medium text-text-muted">
          {view.member ? t("household") : t("total")}
        </span>
        <BigMoney amount={now.data.total} currency={now.data.currency} />
        <span className="text-[13px] text-text-muted">
          {t("endOfPeriod")}{" "}
          <Money amount={end.data.total} currency={end.data.currency} projected={endProjected} />
        </span>
        {noOpenings && <span className="text-xs text-text-muted">{t("noOpening")}</span>}
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-text-muted uppercase">
              <th className="px-4 pt-3 pb-2 font-semibold">{t("account")}</th>
              <th className="px-2 pt-3 pb-2 text-right font-semibold">{t("now")}</th>
              <th className="px-4 pt-3 pb-2 text-right font-semibold">{t("endShort")}</th>
            </tr>
          </thead>
          <tbody>
            {now.data.accounts.map((row) => {
              const later = endByAccount.get(row.account_id);
              return (
                <tr key={row.account_id} className="border-t border-line">
                  <td className="max-w-28 truncate px-4 py-2">
                    {names.get(row.account_id)?.name ?? "—"}
                  </td>
                  <td className="px-2 py-2 text-right">
                    {row.balance === null ? (
                      "—"
                    ) : (
                      <Money amount={row.balance} currency={row.account_currency} />
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
          </tbody>
        </table>
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
  );
}

function FlowCards({ view, filters }: { view: DashboardView; filters: ReportFilters }) {
  const t = useTranslations("dashboard.cards");
  const summary = useSummary(view.range.from, view.range.to, filters);

  if (summary.isPending) return [0, 1, 2, 3].map((i) => <CardSkeleton key={i} />);
  if (summary.isError) {
    return (
      <div className={cn(cardClass, "sm:col-span-4")}>
        <WidgetError onRetry={() => void summary.refetch()} />
      </div>
    );
  }

  const s = summary.data;
  const flows = [
    { key: "income", label: t("income"), value: s.income, tone: "income" as const },
    { key: "expenses", label: t("expenses"), value: s.expenses, tone: "expense" as const },
    { key: "net", label: t("net"), value: s.net, tone: "default" as const },
  ];

  return (
    <>
      {flows.map((flow) => (
        <div key={flow.key} className={cardClass}>
          <span className="text-[13px] font-medium text-text-muted">{flow.label}</span>
          <BigMoney
            amount={s.includes_projection ? flow.value.realized : flow.value.total}
            currency={s.currency}
            tone={flow.tone}
          />
          {s.includes_projection && (
            <span className="text-[13px] text-text-muted">
              {t("projected")} <Money amount={flow.value.total} currency={s.currency} projected />
            </span>
          )}
        </div>
      ))}
      <Link href="/fixed" className={cn(cardClass, "transition-colors hover:border-line-strong")}>
        <span className="text-[13px] font-medium text-text-muted">{t("fixed")}</span>
        <span className="num inline-flex items-baseline text-fixed">
          <span className="text-[32px] leading-none font-semibold tracking-tight sm:text-[36px]">
            {s.fixed_expenses.share === null
              ? "—"
              : formatShare(s.fixed_expenses.share).replace("%", "")}
          </span>
          {s.fixed_expenses.share !== null && <span className="text-base">%</span>}
        </span>
        <span className="text-[13px] text-text-muted">
          <Money
            amount={s.fixed_expenses.total}
            currency={s.currency}
            projected={s.includes_projection}
          />{" "}
          {t("ofExpenses")}
        </span>
      </Link>
    </>
  );
}
