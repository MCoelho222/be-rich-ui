"use client";
/** Overdue fixed entries with Register and Skip (dashboard.md §4.5). Whole household, no filters. */
import { ChevronDown, Clock } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { Money } from "@/components/money/Money";
import { useErrorMessage } from "@/lib/errors";
import { formatDate } from "@/lib/format";
import {
  byId,
  useCategories,
  useOccurrenceAction,
  useOverdue,
  useRecurrences,
  type Overdue,
} from "@/lib/queries";
import { cn } from "@/lib/utils";

export function OverduePanel() {
  const t = useTranslations("dashboard.overdue");
  const overdue = useOverdue();
  const recurrences = byId(useRecurrences().data);
  const categories = byId(useCategories().data);
  const action = useOccurrenceAction();
  const errorMessage = useErrorMessage();
  const [expanded, setExpanded] = useState(false);

  // Shown only when there are any; a failure here is not worth a banner on the home screen.
  const items = overdue.data ?? [];
  if (items.length === 0) return null;

  // mutateAsync: the toast must show even when this panel unmounts (the last entry handled).
  const run = (kind: "register" | "skip", item: Overdue) =>
    action
      .mutateAsync({
        action: kind,
        recurrenceId: item.recurrence_id,
        occurrenceDate: item.occurrence_date,
      })
      .then(() => toast.success(kind === "register" ? t("registered") : t("skipped")))
      .catch((error) => toast.error(errorMessage(error)));

  return (
    <section
      aria-label={t("title", { count: items.length })}
      className="rounded-xl border border-warning-line bg-warning-soft px-4 py-3 sm:px-5"
    >
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className="flex w-full items-center gap-2 text-left sm:pointer-events-none"
      >
        <Clock size={16} className="shrink-0 text-warning" aria-hidden />
        <span className="text-sm font-semibold text-warning">
          {t("title", { count: items.length })}
        </span>
        <span className="hidden text-[13px] text-text-muted sm:inline">{t("note")}</span>
        <ChevronDown
          size={16}
          aria-hidden
          className={cn(
            "ml-auto text-warning transition-transform sm:hidden",
            expanded && "rotate-180"
          )}
        />
      </button>
      <div className={cn("mt-2 flex-col", expanded ? "flex" : "hidden sm:flex")}>
        <p className="pb-1 text-[13px] text-text-muted sm:hidden">{t("note")}</p>
        {items.map((item) => {
          const rec = recurrences.get(item.recurrence_id);
          const name = rec?.description || (rec && categories.get(rec.category_id)?.name) || "—";
          const busy =
            action.isPending &&
            action.variables?.recurrenceId === item.recurrence_id &&
            action.variables.occurrenceDate === item.occurrence_date;
          return (
            <div
              key={`${item.recurrence_id}-${item.occurrence_date}`}
              className="flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-line py-2.5 text-sm"
            >
              <span className="min-w-32 flex-1 font-medium">{name}</span>
              <span className="num w-24 text-text-muted">{formatDate(item.occurrence_date)}</span>
              <Money
                amount={item.expected_amount}
                currency={item.currency}
                sign={rec?.type === "INCOME" ? "plus" : "minus"}
                className={cn(
                  "w-32 text-right",
                  rec?.type === "INCOME" ? "text-income" : "text-expense"
                )}
              />
              <div className="flex gap-1">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => run("register", item)}
                  className="h-8 rounded-md border border-line-strong bg-surface px-3 text-[13px] font-medium hover:bg-surface-2 disabled:opacity-50"
                >
                  {t("register")}
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => run("skip", item)}
                  className="h-8 rounded-md px-2.5 text-[13px] text-text-muted hover:bg-surface hover:text-text disabled:opacity-50"
                >
                  {t("skip")}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
