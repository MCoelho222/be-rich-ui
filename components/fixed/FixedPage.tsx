"use client";
/** Fixed entries (ui-behavior §8, frontend.md §6.3). */
import { AlertTriangle, MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { OverduePanel } from "@/components/dashboard/OverduePanel";
import { Skeleton, WidgetError } from "@/components/dashboard/Widget";
import { Money } from "@/components/money/Money";
import { Segmented } from "@/components/preferences/Segmented";
import { useNewEntry } from "@/components/shell/NewEntry";
import { PageHeader } from "@/components/shell/PageHeader";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidePanel } from "@/components/ui/side-panel";
import { useMe } from "@/lib/auth";
import { useErrorMessage } from "@/lib/errors";
import { formatDate, formatDayMonth, formatMoney, formatMonth, shortName } from "@/lib/format";
import { fromCents, toCents } from "@/lib/money";
import {
  byId,
  useAccounts,
  useCards,
  useCategories,
  useMembers,
  useOverdue,
  useRecurrences,
  type Recurrence,
} from "@/lib/queries";
import { useOccurrences, useRecurrenceAction, type Occurrence } from "@/lib/recurrences";
import { cn } from "@/lib/utils";
import {
  ChangeAmountDialog,
  DeleteDialog,
  EditRecurrenceDialog,
  EndDialog,
  RegisterDialog,
  SkipDialog,
} from "./dialogs";

type Status = "active" | "paused" | "ended" | "all";
type Dialog =
  | { type: "register" | "skip"; rec: Recurrence; occurrence: string }
  | { type: "edit" | "change" | "end" | "delete"; rec: Recurrence }
  | null;

function useFixedView() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const query = params.toString();
  const view = {
    tab: params.get("tab") === "incomes" ? ("incomes" as const) : ("expenses" as const),
    status: (["active", "paused", "ended", "all"].includes(params.get("status") ?? "")
      ? params.get("status")
      : "active") as Status,
    id: params.get("id"),
  };
  const update = useCallback(
    (change: Partial<{ tab: "expenses" | "incomes"; status: Status; id: string | null }>) => {
      const next = new URLSearchParams(query);
      for (const [key, value] of Object.entries(change)) {
        const isDefault =
          (key === "tab" && value === "expenses") || (key === "status" && value === "active");
        if (value && !isDefault) next.set(key, value);
        else next.delete(key);
      }
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [query, router, pathname]
  );
  return { view, update };
}

export function FixedPage() {
  const t = useTranslations("fixed");
  const { view, update } = useFixedView();
  const recurrences = useRecurrences();
  const [dialog, setDialog] = useState<Dialog>(null);
  const close = () => setDialog(null);
  const type = view.tab === "incomes" ? "INCOME" : "EXPENSE";
  const rows = (recurrences.data ?? [])
    .filter(
      (r) => r.type === type && (view.status === "all" || r.status === view.status.toUpperCase())
    )
    .sort((a, b) =>
      (a.next_occurrence?.payment_date ?? "9999").localeCompare(
        b.next_occurrence?.payment_date ?? "9999"
      )
    );
  const selected = recurrences.data?.find((r) => r.id === view.id) ?? null;

  const tab = (value: "expenses" | "incomes", label: string, color: string) => {
    const active = view.tab === value;
    return (
      <button
        type="button"
        role="tab"
        aria-selected={active}
        onClick={() => update({ tab: value })}
        className={cn(
          "h-11 px-4 text-[15px] font-medium transition-colors",
          active ? color : "text-text-muted hover:text-text"
        )}
        style={active ? { boxShadow: "inset 0 -2px 0 currentColor" } : undefined}
      >
        {label}
      </button>
    );
  };

  return (
    <>
      <PageHeader title={t("title")} />
      <div className="flex flex-col gap-4 px-4 pt-2 pb-10 sm:px-8">
        <OverduePanel />
        <MonthlyTotals recurrences={recurrences.data ?? []} />
        <div role="tablist" className="flex border-b border-line">
          {tab("expenses", t("expenses"), "text-expense")}
          {tab("incomes", t("incomes"), "text-income")}
        </div>
        <Segmented<Status>
          label={t("status")}
          value={view.status}
          onChange={(status) => update({ status })}
          options={(["active", "paused", "ended", "all"] as const).map((s) => ({
            value: s,
            label: t(`statusTab.${s}`),
          }))}
          className="self-start [&_button]:h-8 [&_button]:px-3 [&_button]:text-[13px] [&_button]:font-medium"
        />
        {recurrences.isPending ? (
          <div className="flex flex-col gap-2">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : recurrences.isError ? (
          <WidgetError onRetry={() => void recurrences.refetch()} />
        ) : (
          <RecurrenceTable
            rows={rows}
            type={type}
            onOpen={(id) => update({ id })}
            onAction={setDialog}
          />
        )}
      </div>

      {selected && (
        <OccurrencePanel rec={selected} onClose={() => update({ id: null })} onAction={setDialog} />
      )}
      {dialog?.type === "register" && (
        <RegisterDialog rec={dialog.rec} occurrence={dialog.occurrence} onClose={close} />
      )}
      {dialog?.type === "skip" && (
        <SkipDialog rec={dialog.rec} occurrence={dialog.occurrence} onClose={close} />
      )}
      {dialog?.type === "edit" && <EditRecurrenceDialog rec={dialog.rec} onClose={close} />}
      {dialog?.type === "change" && <ChangeAmountDialog rec={dialog.rec} onClose={close} />}
      {dialog?.type === "end" && <EndDialog rec={dialog.rec} onClose={close} />}
      {dialog?.type === "delete" && (
        <DeleteDialog
          rec={dialog.rec}
          onClose={close}
          onEnd={() => setDialog({ type: "end", rec: dialog.rec })}
        />
      )}
    </>
  );
}

/** "Fixed expenses: ~R$ 4.200,00 / month" (ui-behavior §8.2): active entries, yearly ones divided by 12. */
function MonthlyTotals({ recurrences }: { recurrences: Recurrence[] }) {
  const t = useTranslations("fixed");
  const me = useMe();
  const currency = me.data?.household.default_currency ?? "BRL";
  const total = (type: "EXPENSE" | "INCOME") => {
    // Running entries only: an ended one stops counting, and after an amount change the
    // old version is ended, so it shows once.
    const active = recurrences.filter((r) => r.type === type && r.status === "ACTIVE");
    // Exact cents per month; amounts in other currencies are noted, not converted here.
    const cents = active
      .filter((r) => r.currency === currency)
      .reduce((sum, r) => sum + Math.round(toCents(r.amount) / r.interval_months), 0);
    return { amount: fromCents(cents), other: active.some((r) => r.currency !== currency) };
  };
  const expenses = total("EXPENSE");
  const incomes = total("INCOME");
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
      {[
        { label: t("monthlyExpenses"), value: expenses, tone: "text-expense" },
        { label: t("monthlyIncomes"), value: incomes, tone: "text-income" },
      ].map(({ label, value, tone }) => (
        <div
          key={label}
          className="flex items-baseline justify-between gap-3 rounded-xl border border-line bg-surface px-4 py-3 sm:px-5"
        >
          <span className="text-[13px] font-medium text-text-muted">{label}</span>
          <span className="text-right">
            <Money
              amount={value.amount}
              currency={currency}
              projected
              className={cn("text-lg font-semibold not-italic", tone)}
            />
            <span className="text-[13px] text-text-muted"> {t("perMonth")}</span>
            {value.other && (
              <span className="block text-xs text-text-muted">{t("otherCurrencies")}</span>
            )}
          </span>
        </div>
      ))}
    </div>
  );
}

function useDescribe() {
  const t = useTranslations("fixed");
  const locale = useLocale();
  const categories = byId(useCategories().data);
  const accounts = byId(useAccounts().data);
  const cards = byId(useCards().data);
  const members = useMembers().data;
  return (rec: Recurrence) => {
    const category = categories.get(rec.category_id);
    const card = rec.card_id ? cards.get(rec.card_id) : undefined;
    const account = accounts.get(rec.account_id);
    const start = rec.start_date;
    const frequency =
      rec.interval_months === 1
        ? t("monthlyOn", { day: rec.day_of_month })
        : rec.interval_months === 12
          ? t("yearlyOn", {
              date: `${String(rec.day_of_month).padStart(2, "0")}/${start.slice(5, 7)}`,
            })
          : t("everyMonthsOn", { months: rec.interval_months, day: rec.day_of_month });
    const validity = rec.end_date
      ? `${formatMonth(start.slice(0, 7), locale)} → ${formatMonth(rec.end_date.slice(0, 7), locale)}`
      : t("sinceNoEnd", { month: formatMonth(start.slice(0, 7), locale) });
    // ui-behavior §8.4: archived references or a former member need attention before registering.
    const warnings = [
      category && !category.is_active && t("warnCategory"),
      card && !card.is_active && t("warnCard"),
      !card && account && !account.is_active && t("warnAccount"),
      members && !members.some((m) => m.id === rec.person_id) && t("warnPerson"),
    ].filter(Boolean) as string[];
    return {
      name: rec.description || category?.name || "—",
      category: category?.name ?? "—",
      payment: card?.alias ?? account?.name ?? "—",
      person: members?.find((m) => m.id === rec.person_id)?.name,
      frequency,
      validity,
      warnings,
    };
  };
}

function StatusBadge({ status }: { status: Recurrence["status"] }) {
  const t = useTranslations("fixed");
  const style =
    status === "ACTIVE"
      ? "bg-brand/10 text-brand"
      : status === "PAUSED"
        ? "bg-warning-soft text-warning"
        : "bg-surface-2 text-text-muted";
  return (
    <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", style)}>
      {t(`statusLabel.${status}`)}
    </span>
  );
}

function NextBadge({ rec, overdueCount }: { rec: Recurrence; overdueCount: number }) {
  const t = useTranslations("fixed");
  return (
    <span className="flex flex-wrap items-center gap-1.5">
      {overdueCount > 0 && (
        <span className="rounded-full bg-negative-soft px-2 py-0.5 text-[11px] font-semibold text-negative">
          {t("overdueN", { count: overdueCount })}
        </span>
      )}
      {rec.next_occurrence ? (
        rec.next_occurrence.status === "PENDING" ? (
          <span className="num rounded-full bg-warning-soft px-2 py-0.5 text-[11px] font-semibold text-warning">
            {t("dueOn", { date: formatDayMonth(rec.next_occurrence.payment_date) })}
          </span>
        ) : (
          <span className="num text-text-2">{formatDate(rec.next_occurrence.payment_date)}</span>
        )
      ) : overdueCount === 0 ? (
        <span className="text-text-muted">—</span>
      ) : null}
    </span>
  );
}

function RowMenu({
  rec,
  onAction,
  nextOccurrence,
}: {
  rec: Recurrence;
  onAction: (d: Dialog) => void;
  nextOccurrence: string | null;
}) {
  const t = useTranslations("fixed");
  const action = useRecurrenceAction();
  const errorMessage = useErrorMessage();
  const toggle = () =>
    action
      .mutateAsync({ kind: rec.is_active ? "pause" : "resume", id: rec.id })
      .then(() => toast.success(rec.is_active ? t("paused") : t("resumed")))
      .catch((error) => toast.error(errorMessage(error)));
  const ended = rec.status === "ENDED";
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={t("actions")}
        className="flex size-8 items-center justify-center rounded-md text-text-muted hover:bg-surface-2 hover:text-text"
      >
        <MoreHorizontal size={18} aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-52">
        {nextOccurrence && (
          <>
            <DropdownMenuItem
              onSelect={() => onAction({ type: "register", rec, occurrence: nextOccurrence })}
            >
              {t("register")}
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => onAction({ type: "skip", rec, occurrence: nextOccurrence })}
            >
              {t("skipThis")}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem onSelect={() => onAction({ type: "edit", rec })}>
          {t("edit")}
        </DropdownMenuItem>
        {!ended && (
          <DropdownMenuItem onSelect={() => onAction({ type: "change", rec })}>
            {t("changeAmount")}
          </DropdownMenuItem>
        )}
        {!ended && (
          <DropdownMenuItem onSelect={() => void toggle()}>
            {rec.is_active ? t("pause") : t("resume")}
          </DropdownMenuItem>
        )}
        {!ended && (
          <DropdownMenuItem onSelect={() => onAction({ type: "end", rec })}>
            {t("end")}
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={() => onAction({ type: "delete", rec })}
          className="text-negative"
        >
          {t("delete")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function RecurrenceTable({
  rows,
  type,
  onOpen,
  onAction,
}: {
  rows: Recurrence[];
  type: "EXPENSE" | "INCOME";
  onOpen: (id: string) => void;
  onAction: (d: Dialog) => void;
}) {
  const t = useTranslations("fixed");
  const describe = useDescribe();
  const { open } = useNewEntry();
  const overdue = useOverdue().data ?? [];
  const overdueOf = (id: string) => overdue.filter((o) => o.recurrence_id === id);
  // Register/Skip act on the oldest overdue occurrence first, then the next one (ui-behavior §8.3).
  const actionable = (rec: Recurrence) =>
    overdueOf(rec.id)[0]?.occurrence_date ?? rec.next_occurrence?.occurrence_date ?? null;

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-line-strong px-6 py-14 text-center text-sm text-text-muted">
        {type === "EXPENSE" ? t("emptyExpenses") : t("emptyIncomes")}
        <button
          type="button"
          onClick={() => open(type === "EXPENSE" ? "fixed" : "income")}
          className="h-9 rounded-lg bg-brand px-3.5 font-semibold text-on-brand hover:bg-brand-hover"
        >
          {t("add")}
        </button>
      </div>
    );
  }

  const name = (rec: Recurrence, d: ReturnType<typeof describe>) => (
    <span className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => onOpen(rec.id)}
        className="text-left font-medium hover:underline"
      >
        {d.name}
      </button>
      {d.warnings.length > 0 && (
        <span
          title={d.warnings.join(" ")}
          aria-label={d.warnings.join(" ")}
          className="text-warning"
        >
          <AlertTriangle size={14} aria-hidden />
        </span>
      )}
    </span>
  );

  return (
    <>
      <div className="hidden overflow-hidden rounded-xl border border-line bg-surface sm:block">
        <div className="custom-scrollbar overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse text-sm">
            <thead>
              <tr className="bg-surface-2 text-left text-xs tracking-wide text-text-muted uppercase">
                <th className="px-5 py-2.5 font-semibold">{t("col.description")}</th>
                <th className="px-3 py-2.5 text-right font-semibold">{t("col.amount")}</th>
                <th className="px-3 py-2.5 font-semibold">{t("col.frequency")}</th>
                <th className="px-3 py-2.5 font-semibold">{t("col.payment")}</th>
                <th className="px-3 py-2.5 font-semibold">{t("col.next")}</th>
                <th className="px-3 py-2.5 font-semibold">{t("col.validity")}</th>
                <th className="px-3 py-2.5 font-semibold">{t("col.status")}</th>
                <th className="w-12 px-3 py-2.5" aria-label={t("actions")} />
              </tr>
            </thead>
            <tbody>
              {rows.map((rec) => {
                const d = describe(rec);
                return (
                  <tr
                    key={rec.id}
                    className="border-t border-line transition-colors hover:bg-surface-2/60"
                  >
                    <td className="px-5 py-3">
                      <span className="flex flex-col gap-0.5">
                        {name(rec, d)}
                        <span className="text-xs text-text-muted">{d.category}</span>
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <Money
                        amount={rec.amount}
                        currency={rec.currency}
                        className={cn(
                          "font-medium",
                          type === "EXPENSE" ? "text-expense" : "text-income"
                        )}
                      />
                    </td>
                    <td className="px-3 py-3 text-text-2">{d.frequency}</td>
                    <td className="px-3 py-3 text-text-muted">{d.payment}</td>
                    <td className="px-3 py-3">
                      <NextBadge rec={rec} overdueCount={overdueOf(rec.id).length} />
                    </td>
                    <td className="px-3 py-3 text-text-muted">{d.validity}</td>
                    <td className="px-3 py-3">
                      <StatusBadge status={rec.status} />
                    </td>
                    <td className="px-3 py-2">
                      <RowMenu rec={rec} onAction={onAction} nextOccurrence={actionable(rec)} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      <ul className="flex flex-col rounded-xl border border-line bg-surface px-4 sm:hidden">
        {rows.map((rec) => {
          const d = describe(rec);
          return (
            <li
              key={rec.id}
              className="flex items-center gap-2 border-t border-line py-3 first:border-t-0"
            >
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="flex items-start gap-2 text-[15px]">
                  <span className="min-w-0 flex-1 truncate">{name(rec, d)}</span>
                  <Money
                    amount={rec.amount}
                    currency={rec.currency}
                    className={cn(
                      "font-medium",
                      type === "EXPENSE" ? "text-expense" : "text-income"
                    )}
                  />
                </span>
                <span className="flex flex-wrap items-center gap-2 text-xs text-text-muted">
                  {d.frequency}
                  <NextBadge rec={rec} overdueCount={overdueOf(rec.id).length} />
                  {rec.status !== "ACTIVE" && <StatusBadge status={rec.status} />}
                </span>
              </div>
              <RowMenu rec={rec} onAction={onAction} nextOccurrence={actionable(rec)} />
            </li>
          );
        })}
      </ul>
    </>
  );
}

/** The panel's actions as buttons (a menu inside the panel would fight its focus trap). */
function PanelActions({ rec, onAction }: { rec: Recurrence; onAction: (d: Dialog) => void }) {
  const t = useTranslations("fixed");
  const action = useRecurrenceAction();
  const errorMessage = useErrorMessage();
  const ended = rec.status === "ENDED";
  const button =
    "h-8 rounded-md border border-line-strong px-3 text-[13px] font-medium hover:bg-surface-2";
  return (
    <div className="flex flex-wrap gap-1.5">
      <button type="button" className={button} onClick={() => onAction({ type: "edit", rec })}>
        {t("edit")}
      </button>
      {!ended && (
        <button type="button" className={button} onClick={() => onAction({ type: "change", rec })}>
          {t("changeAmount")}
        </button>
      )}
      {!ended && (
        <button
          type="button"
          className={button}
          onClick={() =>
            action
              .mutateAsync({ kind: rec.is_active ? "pause" : "resume", id: rec.id })
              .then(() => toast.success(rec.is_active ? t("paused") : t("resumed")))
              .catch((error) => toast.error(errorMessage(error)))
          }
        >
          {rec.is_active ? t("pause") : t("resume")}
        </button>
      )}
      {!ended && (
        <button type="button" className={button} onClick={() => onAction({ type: "end", rec })}>
          {t("end")}
        </button>
      )}
      <button
        type="button"
        className={cn(button, "text-negative")}
        onClick={() => onAction({ type: "delete", rec })}
      >
        {t("delete")}
      </button>
    </div>
  );
}

/** The next 12 months of a fixed entry (frontend.md §6.3). */
function OccurrencePanel({
  rec,
  onClose,
  onAction,
}: {
  rec: Recurrence;
  onClose: () => void;
  onAction: (d: Dialog) => void;
}) {
  const t = useTranslations("fixed");
  const describe = useDescribe();
  const d = describe(rec);
  const occurrences = useOccurrences(rec.id);
  const action = useRecurrenceAction();
  const errorMessage = useErrorMessage();
  const overdue = (useOverdue().data ?? []).filter((o) => o.recurrence_id === rec.id);
  const items: Occurrence[] = useMemo(() => {
    const later = occurrences.data ?? [];
    const seen = new Set(later.map((o) => o.occurrence_date));
    return [...overdue.filter((o) => !seen.has(o.occurrence_date)), ...later];
  }, [occurrences.data, overdue]);

  const unskip = (occurrence: string) =>
    action
      .mutateAsync({ kind: "unskip", id: rec.id, occurrence })
      .then(() => toast.success(t("unskipped")))
      .catch((error) => toast.error(errorMessage(error)));

  const badge = (status: Occurrence["status"]) => {
    const style: Record<Occurrence["status"], string> = {
      REGISTERED: "bg-brand/10 text-brand",
      PENDING: "bg-warning-soft text-warning",
      OVERDUE: "bg-negative-soft text-negative",
      FUTURE: "bg-surface-2 text-text-muted",
      SKIPPED: "bg-surface-2 text-text-faint line-through",
    };
    return (
      <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", style[status])}>
        {t(`occurrence.${status}`)}
      </span>
    );
  };

  return (
    <SidePanel
      open
      onOpenChange={(open) => !open && onClose()}
      title={d.name}
      subtitle={[
        formatMoney(rec.amount, rec.currency),
        d.frequency,
        d.payment,
        d.person && shortName(d.person),
      ]
        .filter(Boolean)
        .join(" · ")}
    >
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={rec.status} />
          <span className="text-[13px] text-text-muted">{d.validity}</span>
        </div>
        <PanelActions rec={rec} onAction={onAction} />
        {d.warnings.map((w) => (
          <p
            key={w}
            className="flex items-start gap-2 rounded-lg bg-warning-soft px-3 py-2 text-[13px] text-warning"
          >
            <AlertTriangle size={14} className="mt-0.5 shrink-0" aria-hidden />
            {w}
          </p>
        ))}
        <h3 className="mt-2 text-sm font-semibold">{t("nextMonths")}</h3>
        {occurrences.isPending ? (
          <Skeleton className="h-48 w-full" />
        ) : occurrences.isError ? (
          <WidgetError onRetry={() => void occurrences.refetch()} />
        ) : items.length === 0 ? (
          <p className="text-sm text-text-muted">{t("noOccurrences")}</p>
        ) : (
          <ul className="flex flex-col">
            {items.map((o) => (
              <li
                key={o.occurrence_date}
                className="flex flex-wrap items-center gap-x-3 gap-y-1.5 border-t border-line py-2.5 text-sm first:border-t-0"
              >
                <span className="num w-24">{formatDate(o.payment_date)}</span>
                {badge(o.status)}
                <Money
                  amount={o.expected_amount}
                  currency={o.currency}
                  className="ml-auto text-text-2"
                />
                <span className="flex w-full justify-end gap-1 sm:w-auto">
                  {(o.status === "PENDING" || o.status === "OVERDUE" || o.status === "FUTURE") && (
                    <>
                      <button
                        type="button"
                        onClick={() =>
                          onAction({ type: "register", rec, occurrence: o.occurrence_date })
                        }
                        className="h-7 rounded-md border border-line-strong px-2.5 text-xs font-medium hover:bg-surface-2"
                      >
                        {t("register")}
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          onAction({ type: "skip", rec, occurrence: o.occurrence_date })
                        }
                        className="h-7 rounded-md px-2 text-xs text-text-muted hover:bg-surface-2 hover:text-text"
                      >
                        {t("skip")}
                      </button>
                    </>
                  )}
                  {o.status === "SKIPPED" && (
                    <button
                      type="button"
                      onClick={() => void unskip(o.occurrence_date)}
                      className="h-7 rounded-md px-2 text-xs text-text-muted hover:bg-surface-2 hover:text-text"
                    >
                      {t("undoSkip")}
                    </button>
                  )}
                  {o.status === "REGISTERED" && o.row_id && (
                    <Link
                      href={`/entries?tab=${rec.type === "EXPENSE" ? "expenses" : "incomes"}&by=payment&from=${o.payment_date}&to=${o.payment_date}`}
                      className="h-7 px-2 text-xs leading-7 text-brand hover:underline"
                    >
                      {t("viewPayment")}
                    </Link>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </SidePanel>
  );
}
