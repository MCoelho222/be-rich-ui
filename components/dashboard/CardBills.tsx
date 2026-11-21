"use client";
/** Each credit card's next bill (dashboard.md §4.7). Hidden when there are no credit cards. */
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Money } from "@/components/money/Money";
import { formatDayMonth, formatWeekdayDate, shortName } from "@/lib/format";
import { byId, useCardBills, useCards, useMembers, type ReportFilters } from "@/lib/queries";
import { CurrencyNote, Skeleton, WidgetCard, WidgetError } from "./Widget";

export function CardBills({ filters }: { filters: ReportFilters }) {
  const t = useTranslations("dashboard.bills");
  const locale = useLocale();
  const bills = useCardBills(filters);
  const cards = byId(useCards().data);
  const members = byId(useMembers().data);

  if (bills.isSuccess && bills.data.items.length === 0) return null;

  return (
    <WidgetCard title={t("title")}>
      {bills.isPending ? (
        <Skeleton className="h-16 w-full" />
      ) : bills.isError ? (
        <WidgetError onRetry={() => void bills.refetch()} />
      ) : (
        <ul className="flex flex-col gap-2">
          {bills.data.items.map((bill) => {
            const card = cards.get(bill.card_id);
            const owner = card ? members.get(card.owner_id)?.name : undefined;
            const projected = Number(bill.projected_fixed) > 0;
            return (
              <li key={bill.card_id}>
                <Link
                  href={`/entries?tab=expenses&card=${bill.card_id}&from=${bill.due_date}&to=${bill.due_date}`}
                  className="flex items-center gap-3 rounded-lg bg-surface-2 p-3 transition-colors hover:bg-line"
                >
                  <span
                    aria-hidden
                    className="h-7 w-10 shrink-0 rounded-md bg-gradient-to-br from-violet-600 to-violet-900"
                  />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-sm font-medium">
                      {card?.alias ?? "—"}{" "}
                      {card?.last_four && (
                        <span className="font-normal text-text-muted">•••• {card.last_four}</span>
                      )}
                    </span>
                    <span className="num truncate text-xs text-text-muted">
                      {[
                        owner && shortName(owner),
                        t("closes", { date: formatDayMonth(bill.closes_on) }),
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </span>
                  <span className="flex flex-col items-end">
                    <Money
                      amount={bill.total}
                      currency={bills.data.currency}
                      projected={projected}
                      className="text-[15px] font-semibold not-italic"
                    />
                    <span className="num text-xs text-text-muted">
                      {t("due", { date: formatWeekdayDate(bill.due_date, locale) })}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
      <CurrencyNote data={bills.data} />
    </WidgetCard>
  );
}
