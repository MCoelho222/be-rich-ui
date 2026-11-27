"use client";
/** The period's stored rows and projected occurrences (dashboard.md §4.8, ui-behavior §10). */
import { Repeat } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useId, useState } from "react";
import { RegisterDialog } from "@/components/fixed/dialogs";
import { Money } from "@/components/money/Money";
import { formatMoney, formatWeekdayDate } from "@/lib/format";
import {
  byId,
  useAccounts,
  useCards,
  useCategories,
  useProjectionItems,
  useRecurrences,
  type ProjectionItem,
  type Recurrence,
  type ReportFilters,
} from "@/lib/queries";
import { cn } from "@/lib/utils";
import { BeforeOpeningPill } from "@/components/entries/BeforeOpeningPill";
import type { DashboardView } from "./view";
import { CurrencyNote, Skeleton, TypeTabs, WidgetCard, WidgetError, tabId } from "./Widget";

type TypeFilter = "all" | "EXPENSE" | "INCOME";

interface RowView {
  key: string;
  item: ProjectionItem;
  date: string;
  description: string;
  category: string;
  payment: string;
  installment: string | null;
  fixed: boolean;
}

export function EntryList({ view, filters }: { view: DashboardView; filters: ReportFilters }) {
  const t = useTranslations("dashboard.entries");
  const tm = useTranslations("methods");
  const locale = useLocale();
  const [type, setType] = useState<TypeFilter>("all");
  const query = useProjectionItems(
    view.range.from,
    view.range.to,
    type === "all" ? null : type,
    filters
  );
  const categories = byId(useCategories().data);
  const accounts = byId(useAccounts().data);
  const cards = byId(useCards().data);
  const recurrences = byId(useRecurrences().data);
  const [registering, setRegistering] = useState<{ rec: Recurrence; occurrence: string } | null>(
    null
  );
  const panelId = useId();

  const items = query.data?.pages.flatMap((page) => page.items) ?? [];
  const meta = query.data?.pages[0];

  const rows: RowView[] = items.map((item) => {
    const source = item.row ?? item.occurrence!;
    const categoryName = categories.get(source.category_id)?.name ?? "—";
    const cardId = "card_id" in source ? source.card_id : null;
    const where = cardId ? cards.get(cardId)?.alias : accounts.get(source.account_id)?.name;
    const row = item.row;
    return {
      key: row ? row.id : `${item.occurrence!.recurrence_id}-${item.occurrence!.occurrence_date}`,
      item,
      date: formatWeekdayDate(item.payment_date, locale),
      description: source.description || categoryName,
      category: categoryName,
      payment: [tm(source.payment_method as "PIX"), where].filter(Boolean).join(" · "),
      installment:
        row && row.installment_total > 1
          ? `${row.installment_number}/${row.installment_total}`
          : null,
      fixed: item.projected || !!row?.recurrence_id,
    };
  });

  // Register opens the pre-filled form: the real amount may differ from the expected one.
  const register = (item: ProjectionItem) => {
    const rec = recurrences.get(item.occurrence!.recurrence_id);
    if (rec) setRegistering({ rec, occurrence: item.occurrence!.occurrence_date });
  };

  const amount = (row: RowView, className?: string) => {
    const { item } = row;
    const sign = item.type === "INCOME" ? "plus" : "minus";
    const converted = meta && item.currency !== meta.currency && item.converted !== null;
    return (
      <span className={cn("flex flex-col items-end", className)}>
        <Money
          amount={converted ? item.converted! : item.amount}
          currency={converted ? meta!.currency : item.currency}
          sign={sign}
          projected={item.projected}
          className={cn(
            "font-medium",
            !item.projected && (item.type === "INCOME" ? "text-income" : "text-expense")
          )}
        />
        {converted && (
          <span className="num text-xs text-text-muted">
            ({formatMoney(item.amount, item.currency)})
          </span>
        )}
      </span>
    );
  };

  const badges = (row: RowView) => (
    <>
      {row.item.row && (
        <BeforeOpeningPill
          paymentDate={row.item.payment_date}
          account={accounts.get(row.item.row.account_id)}
        />
      )}
      {row.installment && (
        <span className="num rounded-full bg-surface-2 px-2 py-px text-[11px] font-semibold text-text-muted">
          {row.installment}
        </span>
      )}
      {/* A projected row is always a fixed entry's coming occurrence: one badge says both. */}
      {row.item.projected ? (
        <span className="inline-flex items-center gap-1 rounded-full border border-dashed border-text-faint px-2 py-px text-[11px] font-semibold text-text-muted">
          <Repeat size={11} aria-hidden />
          {t("projected")}
        </span>
      ) : (
        row.fixed && (
          <span className="inline-flex items-center gap-1 rounded-full bg-fixed-soft px-2 py-px text-[11px] font-semibold text-fixed">
            <Repeat size={11} aria-hidden />
            {t("fixed")}
          </span>
        )
      )}
    </>
  );

  const registerButton = (row: RowView) =>
    row.item.projected && (
      <button
        type="button"
        disabled={!recurrences.has(row.item.occurrence!.recurrence_id)}
        onClick={() => register(row.item)}
        className="h-10 rounded-lg border border-line-strong bg-surface px-3 text-[13px] font-medium hover:bg-surface-2 disabled:opacity-50 sm:h-7 sm:rounded-md sm:px-2.5 sm:text-xs"
      >
        {t("register")}
      </button>
    );

  return (
    <WidgetCard
      padded={false}
      title={t("title")}
      updating={query.isPlaceholderData}
      actions={
        <TypeTabs<TypeFilter>
          label={t("title")}
          value={type}
          onChange={setType}
          panelId={panelId}
          options={[
            { value: "all", label: t("all"), tone: "brand" },
            { value: "EXPENSE", label: t("expenses"), tone: "expense" },
            { value: "INCOME", label: t("incomes"), tone: "income" },
          ]}
        />
      }
    >
      <div id={panelId} role="tabpanel" aria-labelledby={tabId(panelId, type)} className="contents">
        {query.isPending ? (
          <div className="flex flex-col gap-2 px-4 pb-4 sm:px-5">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : query.isError ? (
          <div className="px-4 pb-4 sm:px-5">
            <WidgetError onRetry={() => void query.refetch()} />
          </div>
        ) : rows.length === 0 ? (
          <p className="px-4 pt-2 pb-8 text-center text-sm text-text-muted">{t("empty")}</p>
        ) : (
          <>
            {/* Desktop: the table style of today's app (frontend.md §1.5) */}
            <div className="hidden overflow-x-auto sm:block">
              <table className="w-full min-w-[720px] border-collapse text-sm">
                <thead>
                  <tr className="bg-surface-2 text-left text-xs tracking-wide text-text-muted uppercase">
                    <th className="px-5 py-2.5 font-medium">{t("date")}</th>
                    <th className="px-3 py-2.5 font-medium">{t("description")}</th>
                    <th className="px-3 py-2.5 font-medium">{t("category")}</th>
                    <th className="px-3 py-2.5 font-medium">{t("payment")}</th>
                    <th className="px-5 py-2.5 text-right font-medium">{t("amount")}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr
                      key={row.key}
                      className="border-t border-line transition-colors hover:bg-surface-2/60"
                    >
                      <td className="num px-5 py-3 whitespace-nowrap text-text-muted">
                        {row.date}
                      </td>
                      <td className="px-3 py-3">
                        <span className="flex flex-wrap items-center gap-2">
                          <span
                            className={cn(row.item.projected ? "text-text-2 italic" : "text-text")}
                          >
                            {row.description}
                          </span>
                          {badges(row)}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-text-2">{row.category}</td>
                      <td className="px-3 py-3 text-text-muted">{row.payment}</td>
                      <td className="px-5 py-3">
                        <span className="flex items-center justify-end gap-3">
                          {registerButton(row)}
                          {amount(row)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Phones: two-line items */}
            <ul className="px-4 sm:hidden">
              {rows.map((row) => (
                <li
                  key={row.key}
                  className="flex flex-col gap-1 border-t border-line py-3 first:border-t-0"
                >
                  <span className="flex items-start gap-2 text-[15px]">
                    <span className={cn("flex-1", row.item.projected && "text-text-2 italic")}>
                      {row.description}
                    </span>
                    {amount(row)}
                  </span>
                  <span className="flex flex-wrap items-center gap-2 text-xs text-text-muted">
                    <span className="num">
                      {row.date} · {row.category}
                    </span>
                    {badges(row)}
                    <span className="ml-auto">{registerButton(row)}</span>
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
        {query.hasNextPage && (
          <div className="flex justify-center px-4 sm:px-5">
            <button
              type="button"
              onClick={() => void query.fetchNextPage()}
              disabled={query.isFetchingNextPage}
              aria-busy={query.isFetchingNextPage}
              className="h-10 rounded-lg border border-line-strong px-4 text-sm hover:bg-surface-2 disabled:opacity-50 sm:h-9"
            >
              {query.isFetchingNextPage ? t("loadingMore") : t("loadMore")}
            </button>
          </div>
        )}
        <div className="flex flex-col gap-2 px-4 pb-4 sm:px-5 empty:hidden">
          <CurrencyNote data={meta} />
        </div>
      </div>
      {registering && (
        <RegisterDialog
          rec={registering.rec}
          occurrence={registering.occurrence}
          onClose={() => setRegistering(null)}
        />
      )}
    </WidgetCard>
  );
}
