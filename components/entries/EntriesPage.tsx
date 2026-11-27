"use client";
/** Expenses and incomes (frontend.md §6.2, ui-behavior §10–§11). */
import { Layers, Pencil, Repeat, Search, SlidersHorizontal, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { controlClass, PeriodPicker } from "@/components/dashboard/FilterBar";
import { Skeleton, WidgetError } from "@/components/dashboard/Widget";
import { Money } from "@/components/money/Money";
import { useNewEntry } from "@/components/shell/NewEntry";
import { PageHeader } from "@/components/shell/PageHeader";
import { BeforeOpeningPill } from "./BeforeOpeningPill";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  cardOf,
  PAYMENT_METHODS,
  personOf,
  useEntryList,
  type Entry,
  type EntryKind,
} from "@/lib/entries";
import { formatDayMonth, formatWeekdayDate, shortName } from "@/lib/format";
import { byId, useAccounts, useCards, useCategories, useMembers } from "@/lib/queries";
import { cn } from "@/lib/utils";
import { Select } from "./pickers";
import { FILTER_KEYS, useEntriesView, type EntriesView, type FilterKey } from "./view";

export function EntriesPage() {
  const t = useTranslations("entries");
  const { view, update } = useEntriesView();
  const kind: EntryKind = view.tab === "incomes" ? "income" : "expense";

  const tab = (value: EntriesView["tab"], label: string, color: string) => {
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
        <div role="tablist" className="flex border-b border-line">
          {tab("expenses", t("expenses"), "text-expense")}
          {tab("incomes", t("incomes"), "text-income")}
        </div>
        <Toolbar view={view} update={update} kind={kind} />
        <EntryTable kind={kind} view={view} />
      </div>
    </>
  );
}

// --- Toolbar: period, search, filters -------------------------------------------------

type Update = ReturnType<typeof useEntriesView>["update"];

function Toolbar({ view, update, kind }: { view: EntriesView; update: Update; kind: EntryKind }) {
  const t = useTranslations("entries");
  const tm = useTranslations("methods");
  const accounts = useAccounts().data ?? [];
  const cards = useCards().data ?? [];
  const categories = useCategories().data ?? [];
  const members = useMembers().data ?? [];
  const [q, setQ] = useState(view.q);

  // Search is applied after a pause in typing.
  useEffect(() => {
    if (q === view.q) return;
    const timer = setTimeout(() => update({ q }), 350);
    return () => clearTimeout(timer);
  }, [q, view.q, update]);

  const type = kind === "expense" ? "EXPENSE" : "INCOME";
  const names: Record<FilterKey, (id: string) => string | undefined> = {
    account: (id) => accounts.find((a) => a.id === id)?.name,
    card: (id) => cards.find((c) => c.id === id)?.alias,
    category: (id) => categories.find((c) => c.id === id)?.name,
    person: (id) => {
      const name = members.find((m) => m.id === id)?.name;
      return name && shortName(name);
    },
    method: (id) => tm(id as "PIX"),
  };
  const setFilter = (key: FilterKey, value: string) =>
    update({ filters: { ...view.filters, [key]: value || undefined } });
  const active = FILTER_KEYS.filter((key) => view.filters[key]);
  const visibleKeys = FILTER_KEYS.filter((key) => kind === "expense" || key !== "card");

  const options: Record<FilterKey, { value: string; label: string }[]> = {
    account: accounts.map((a) => ({
      value: a.id,
      label: a.name + (a.is_active ? "" : ` (${t("archived")})`),
    })),
    card: cards.map((c) => ({
      value: c.id,
      label: c.alias + (c.is_active ? "" : ` (${t("archived")})`),
    })),
    category: categories
      .filter((c) => c.type === type)
      .map((c) => ({ value: c.id, label: c.name + (c.is_active ? "" : ` (${t("archived")})`) })),
    person: members.map((m) => ({ value: m.id, label: shortName(m.name) })),
    method: PAYMENT_METHODS.map((m) => ({ value: m, label: tm(m) })),
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <PeriodPicker view={view} update={update} />
        <Select
          value={view.by}
          onChange={(e) => update({ by: e.target.value as EntriesView["by"] })}
          aria-label={t("dateBasis")}
          className="h-9 w-auto"
        >
          <option value="purchase">
            {kind === "expense" ? t("byPurchase") : t("byTransaction")}
          </option>
          <option value="payment">{t("byPayment")}</option>
        </Select>
        <label className="relative min-w-48 flex-1 sm:max-w-72">
          <Search
            size={16}
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-text-muted"
          />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("search")}
            aria-label={t("search")}
            className="h-9 pl-9"
          />
        </label>
        <Popover>
          <PopoverTrigger className={controlClass}>
            <SlidersHorizontal size={15} className="text-text-muted" aria-hidden />
            {t("filters")}
            {active.length + (view.fixed ? 1 : 0) > 0 && (
              <span className="num rounded-full bg-brand px-1.5 text-[11px] font-semibold text-on-brand">
                {active.length + (view.fixed ? 1 : 0)}
              </span>
            )}
          </PopoverTrigger>
          <PopoverContent align="start" className="flex w-80 flex-col gap-3">
            {visibleKeys.map((key) => (
              <label key={key} className="flex flex-col gap-1 text-[13px] text-text-2">
                {t(`filter.${key}`)}
                <Select
                  value={view.filters[key] ?? ""}
                  onChange={(e) => setFilter(key, e.target.value)}
                >
                  <option value="">{t("any")}</option>
                  {options[key].map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </Select>
              </label>
            ))}
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={view.fixed}
                onChange={(e) => update({ fixed: e.target.checked })}
                className="size-4 accent-[var(--brand)]"
              />
              {t("fixedOnly")}
            </label>
          </PopoverContent>
        </Popover>
      </div>
      {(active.length > 0 || view.fixed) && (
        <div className="flex flex-wrap gap-2">
          {active.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key, "")}
              className="inline-flex h-7 items-center gap-1.5 rounded-full bg-surface-2 pr-2 pl-3 text-[13px] hover:bg-line"
              aria-label={t("removeFilter", { name: names[key](view.filters[key]!) ?? "" })}
            >
              <span className="text-text-muted">{t(`filter.${key}`)}:</span>{" "}
              {names[key](view.filters[key]!) ?? "—"}
              <X size={13} aria-hidden />
            </button>
          ))}
          {view.fixed && (
            <button
              type="button"
              onClick={() => update({ fixed: false })}
              className="inline-flex h-7 items-center gap-1.5 rounded-full bg-surface-2 pr-2 pl-3 text-[13px] hover:bg-line"
            >
              {t("fixedOnly")}
              <X size={13} aria-hidden />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// --- Table --------------------------------------------------------------------------------

function EntryTable({ kind, view }: { kind: EntryKind; view: EntriesView }) {
  const t = useTranslations("entries");
  const tm = useTranslations("methods");
  const locale = useLocale();
  const { edit, remove, open } = useNewEntry();
  const list = useEntryList(kind, {
    from: view.range.from,
    to: view.range.to,
    q: view.q || undefined,
    fixed_only: view.fixed,
    account_id: view.filters.account,
    card_id: kind === "expense" ? view.filters.card : undefined,
    category_id: view.filters.category,
    person_id: view.filters.person,
    payment_method: view.filters.method,
    date_field: view.by === "payment" ? "payment_date" : "transaction_date",
  });
  const accounts = byId(useAccounts().data);
  const cards = byId(useCards().data);
  const categories = byId(useCategories().data);
  const members = useMembers().data ?? [];

  if (list.isPending) {
    return (
      <div className="flex flex-col gap-2">
        {[0, 1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-11 w-full" />
        ))}
      </div>
    );
  }
  if (list.isError) return <WidgetError onRetry={() => void list.refetch()} />;

  const rows = list.data.pages.flatMap((page) => page.items);
  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-line-strong px-6 py-14 text-center text-sm text-text-muted">
        {kind === "expense" ? t("emptyExpenses") : t("emptyIncomes")}
        <button
          type="button"
          onClick={() => open(kind)}
          className="h-9 rounded-lg bg-brand px-3.5 font-semibold text-on-brand hover:bg-brand-hover"
        >
          {kind === "expense" ? t("addExpense") : t("addIncome")}
        </button>
      </div>
    );
  }

  const personName = (id: string) => {
    const member = members.find((m) => m.id === id);
    return member ? shortName(member.name) : t("formerMember");
  };
  const category = (entry: Entry) => {
    const c = categories.get(entry.category_id);
    return c ? c.name + (c.is_active ? "" : ` (${t("archived")})`) : "—";
  };
  const shownDate = (entry: Entry) =>
    view.by === "payment" ? entry.payment_date : entry.transaction_date;
  /** The other date, when it differs (a credit purchase is paid with a later bill). */
  const otherDate = (entry: Entry) =>
    entry.payment_date !== entry.transaction_date && (
      <span className="block text-xs text-text-muted/80 max-sm:inline">
        {view.by === "payment"
          ? t(kind === "expense" ? "boughtOn" : "receivedOnDate", {
              date: formatDayMonth(entry.transaction_date),
            })
          : t(kind === "expense" ? "paidOnDate" : "expectedOnDate", {
              date: formatDayMonth(entry.payment_date),
            })}
      </span>
    );
  const payment = (entry: Entry) => {
    const card = cardOf(entry);
    const where = card ? cards.get(card)?.alias : accounts.get(entry.account_id)?.name;
    return [tm(entry.payment_method as "PIX"), where].filter(Boolean).join(" · ");
  };
  const badges = (entry: Entry) => (
    <>
      <BeforeOpeningPill
        paymentDate={entry.payment_date}
        account={accounts.get(entry.account_id)}
      />
      {entry.installment_total > 1 && (
        <span className="num rounded-full bg-surface-2 px-2 py-px text-[11px] font-semibold text-text-muted">
          {entry.installment_number}/{entry.installment_total}
        </span>
      )}
      {entry.split_group_id && (
        <span
          title={t("split")}
          aria-label={t("split")}
          className="inline-flex items-center text-text-muted"
        >
          <Layers size={14} aria-hidden />
        </span>
      )}
      {entry.recurrence_id && (
        <Link
          href={`/fixed?id=${entry.recurrence_id}`}
          title={t("openFixed")}
          className="inline-flex items-center gap-1 rounded-full bg-fixed-soft px-2 py-px text-[11px] font-semibold text-fixed hover:underline"
        >
          <Repeat size={11} aria-hidden />
          {t("fixed")}
        </Link>
      )}
    </>
  );
  const amount = (entry: Entry) => (
    <Money
      amount={entry.amount}
      currency={entry.currency}
      sign={kind === "income" ? "plus" : "minus"}
      className={cn("font-medium", kind === "income" ? "text-income" : "text-expense")}
    />
  );
  const actions = (entry: Entry) => (
    <span className="flex justify-end gap-1">
      <button
        type="button"
        onClick={() => edit(kind, entry)}
        aria-label={t("edit")}
        title={t("edit")}
        className="flex size-8 items-center justify-center rounded-md text-text-muted hover:bg-surface-2 hover:text-text"
      >
        <Pencil size={15} aria-hidden />
      </button>
      <button
        type="button"
        onClick={() => remove(kind, entry)}
        aria-label={t("delete")}
        title={t("delete")}
        className="flex size-8 items-center justify-center rounded-md text-text-muted hover:bg-surface-2 hover:text-negative"
      >
        <Trash2 size={15} aria-hidden />
      </button>
    </span>
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Desktop table (frontend.md §1.5) */}
      <div className="hidden overflow-hidden rounded-xl border border-line bg-surface sm:block">
        <div className="custom-scrollbar overflow-x-auto">
          <table className="w-full min-w-[860px] border-collapse text-sm">
            <thead>
              <tr className="bg-surface-2 text-left text-xs tracking-wide text-text-muted uppercase">
                <th className="px-5 py-2.5 font-semibold">
                  {view.by === "payment"
                    ? t("col.paymentDate")
                    : kind === "expense"
                      ? t("col.purchaseDate")
                      : t("col.date")}
                </th>
                <th className="px-3 py-2.5 font-semibold">{t("col.description")}</th>
                <th className="px-3 py-2.5 font-semibold">{t("col.category")}</th>
                <th className="px-3 py-2.5 font-semibold">{t("col.payment")}</th>
                <th className="px-3 py-2.5 font-semibold">
                  {kind === "expense" ? t("col.spender") : t("col.receiver")}
                </th>
                <th className="px-3 py-2.5 text-right font-semibold">{t("col.amount")}</th>
                <th className="w-24 px-3 py-2.5" aria-label={t("col.actions")} />
              </tr>
            </thead>
            <tbody>
              {rows.map((entry) => (
                <tr
                  key={entry.id}
                  className="group border-t border-line transition-colors hover:bg-surface-2/60"
                >
                  <td className="num px-5 py-3 whitespace-nowrap text-text-muted">
                    {formatWeekdayDate(shownDate(entry), locale)}
                    {otherDate(entry)}
                  </td>
                  <td className="px-3 py-3">
                    <span className="flex flex-wrap items-center gap-2">
                      <span>{entry.description || category(entry)}</span>
                      {badges(entry)}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-text-2">{category(entry)}</td>
                  <td className="px-3 py-3 text-text-muted">{payment(entry)}</td>
                  <td className="px-3 py-3 text-text-muted">{personName(personOf(entry))}</td>
                  <td className="px-3 py-3 text-right">{amount(entry)}</td>
                  <td className="px-3 py-2">{actions(entry)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Phones: two-line items; tapping a row edits it */}
      <ul className="flex flex-col rounded-xl border border-line bg-surface px-4 sm:hidden">
        {rows.map((entry) => (
          <li
            key={entry.id}
            className="flex items-center gap-2 border-t border-line py-3 first:border-t-0"
          >
            <button
              type="button"
              onClick={() => edit(kind, entry)}
              className="flex min-w-0 flex-1 flex-col gap-1 text-left"
            >
              <span className="flex items-start gap-2 text-[15px]">
                <span className="min-w-0 flex-1 truncate">
                  {entry.description || category(entry)}
                </span>
                {amount(entry)}
              </span>
              <span className="flex flex-wrap items-center gap-2 text-xs text-text-muted">
                <span className="num">
                  {formatWeekdayDate(shownDate(entry), locale)} · {category(entry)}
                </span>
                {otherDate(entry)}
                {badges(entry)}
              </span>
            </button>
            <button
              type="button"
              onClick={() => remove(kind, entry)}
              aria-label={t("delete")}
              className="flex size-9 shrink-0 items-center justify-center rounded-md text-text-muted hover:text-negative"
            >
              <Trash2 size={16} aria-hidden />
            </button>
          </li>
        ))}
      </ul>

      {list.hasNextPage && (
        <button
          type="button"
          onClick={() => void list.fetchNextPage()}
          disabled={list.isFetchingNextPage}
          className="self-center rounded-lg border border-line-strong px-4 py-2 text-sm hover:bg-surface-2 disabled:opacity-50"
        >
          {t("loadMore")}
        </button>
      )}
    </div>
  );
}
