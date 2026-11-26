"use client";
/**
 * Overdue fixed entries (dashboard.md §4.5). Whole household, no filters. Register opens the
 * pre-filled form and Skip asks first, as on the Fixed page (ui-behavior §8.3).
 */
import { ChevronDown, Clock, RotateCw } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { RegisterDialog, SkipDialog } from "@/components/fixed/dialogs";
import { Money } from "@/components/money/Money";
import { daysBetween, formatDate } from "@/lib/format";
import { todayIso } from "@/lib/period";
import { byId, useCategories, useOverdue, useRecurrences, type Recurrence } from "@/lib/queries";
import { cn } from "@/lib/utils";

type Dialog = { kind: "register" | "skip"; rec: Recurrence; occurrence: string } | null;

export function OverduePanel() {
  const t = useTranslations("dashboard.overdue");
  const td = useTranslations("dashboard");
  const overdue = useOverdue();
  const recurrences = byId(useRecurrences().data);
  const categories = byId(useCategories().data);
  const [expanded, setExpanded] = useState(false);
  const [dialog, setDialog] = useState<Dialog>(null);
  const close = () => setDialog(null);
  const today = todayIso();

  // A failed check is said once, quietly, with a retry: it must not pass for "nothing overdue".
  if (overdue.isError) {
    return (
      <p
        role="status"
        className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-warning-line bg-warning-soft px-4 py-2.5 text-[13px] text-warning sm:px-5"
      >
        <Clock size={15} className="shrink-0" aria-hidden />
        <span className="flex-1">{t("loadError")}</span>
        <button
          type="button"
          onClick={() => void overdue.refetch()}
          className="inline-flex h-10 items-center gap-1.5 font-medium hover:underline sm:h-7"
        >
          <RotateCw size={14} aria-hidden />
          {td("retry")}
        </button>
      </p>
    );
  }
  // Nothing while loading: in the usual case there is nothing overdue, and a placeholder that
  // then vanishes would shift the page for no reason.
  const items = overdue.data ?? [];
  if (items.length === 0) return null;

  const title = t("title", { count: items.length });
  const heading = (
    <>
      <Clock size={16} className="shrink-0 text-warning" aria-hidden />
      <span className="text-sm font-semibold text-warning">{title}</span>
      <span className="hidden text-[13px] text-text-muted sm:inline">{t("note")}</span>
    </>
  );

  return (
    <section
      aria-label={title}
      className="rounded-xl border border-warning-line bg-warning-soft px-4 py-3 sm:px-5"
    >
      {/* Phones collapse the list behind this toggle; larger screens always show it. */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className="flex min-h-10 w-full items-center gap-2 text-left sm:hidden"
      >
        {heading}
        <ChevronDown
          size={16}
          aria-hidden
          className={cn("ml-auto text-warning transition-transform", expanded && "rotate-180")}
        />
      </button>
      <div className="hidden items-center gap-2 sm:flex">{heading}</div>
      <div className={cn("mt-2 flex-col", expanded ? "flex" : "hidden sm:flex")}>
        <p className="pb-1 text-[13px] text-text-muted sm:hidden">{t("note")}</p>
        {items.map((item) => {
          const rec = recurrences.get(item.recurrence_id);
          const name = rec?.description || (rec && categories.get(rec.category_id)?.name) || "—";
          const late = daysBetween(item.occurrence_date, today);
          return (
            <div
              key={`${item.recurrence_id}-${item.occurrence_date}`}
              className="flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-line py-2.5 text-sm"
            >
              <span className="flex min-w-40 flex-1 flex-col">
                <span className="font-medium">{name}</span>
                <span className="num text-[13px] text-text-muted">
                  {formatDate(item.occurrence_date)} · {t("daysLate", { count: late })}
                </span>
              </span>
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
                  disabled={!rec}
                  onClick={() =>
                    rec && setDialog({ kind: "register", rec, occurrence: item.occurrence_date })
                  }
                  className="h-10 rounded-lg border border-line-strong bg-surface px-3 text-[13px] font-medium hover:bg-surface-2 disabled:opacity-50 sm:h-8"
                >
                  {t("register")}
                </button>
                <button
                  type="button"
                  disabled={!rec}
                  onClick={() =>
                    rec && setDialog({ kind: "skip", rec, occurrence: item.occurrence_date })
                  }
                  className="h-10 rounded-lg px-2.5 text-[13px] text-text-muted hover:bg-surface hover:text-text disabled:opacity-50 sm:h-8"
                >
                  {t("skip")}
                </button>
              </div>
            </div>
          );
        })}
      </div>
      {dialog?.kind === "register" && (
        <RegisterDialog rec={dialog.rec} occurrence={dialog.occurrence} onClose={close} />
      )}
      {dialog?.kind === "skip" && (
        <SkipDialog rec={dialog.rec} occurrence={dialog.occurrence} onClose={close} />
      )}
    </section>
  );
}
