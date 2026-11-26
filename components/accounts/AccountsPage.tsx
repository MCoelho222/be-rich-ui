"use client";
/** Accounts and cards (ui-behavior §4–§5, frontend.md §6.4). */
import { ChevronRight, CreditCard, Landmark, MoreHorizontal, Plus, Wallet } from "lucide-react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { Skeleton, WidgetError } from "@/components/dashboard/Widget";
import { BigMoney, Money } from "@/components/money/Money";
import { PageHeader } from "@/components/shell/PageHeader";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useReferenceWrite } from "@/lib/accounts";
import { useErrorMessage } from "@/lib/errors";
import { formatDayMonth, formatMoney, formatWeekdayDate, shortName } from "@/lib/format";
import { lastOfMonth, todayIso } from "@/lib/period";
import {
  byId,
  useAccounts,
  useBalances,
  useCardBills,
  useCards,
  useMembers,
  type Account,
  type Card,
} from "@/lib/queries";
import { cn } from "@/lib/utils";
import { AccountFormDialog, AdjustDialog, CardFormDialog, DeleteDialog } from "./forms";

type Dialog =
  | { type: "account"; account?: Account }
  | { type: "adjust"; account: Account }
  | { type: "card"; card?: Card }
  | { type: "delete-account"; account: Account }
  | { type: "delete-card"; card: Card }
  | null;

export function AccountsPage() {
  const t = useTranslations("accounts");
  const [dialog, setDialog] = useState<Dialog>(null);
  const close = () => setDialog(null);
  const accounts = useAccounts();
  const cards = useCards();

  const addButton =
    "inline-flex h-9 items-center gap-1.5 rounded-lg border border-line-strong bg-surface px-3 text-sm hover:bg-surface-2";

  return (
    <>
      <PageHeader title={t("title")}>
        <div className="flex gap-2">
          <button
            type="button"
            className={addButton}
            onClick={() => setDialog({ type: "account" })}
          >
            <Plus size={15} aria-hidden />
            {t("addAccount")}
          </button>
          <button type="button" className={addButton} onClick={() => setDialog({ type: "card" })}>
            <Plus size={15} aria-hidden />
            {t("addCard")}
          </button>
        </div>
      </PageHeader>
      <div className="flex flex-col gap-8 px-4 pt-3 pb-10 sm:px-8">
        <TotalBalance />
        <section className="flex flex-col gap-3">
          <h2 className="text-base font-semibold">{t("accountsTitle")}</h2>
          {accounts.isPending ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-40 w-full rounded-xl" />
              ))}
            </div>
          ) : accounts.isError ? (
            <WidgetError onRetry={() => void accounts.refetch()} />
          ) : (
            <AccountGrid accounts={accounts.data} onAction={setDialog} />
          )}
        </section>
        <section className="flex flex-col gap-3">
          <h2 className="text-base font-semibold">{t("cardsTitle")}</h2>
          {cards.isPending ? (
            <Skeleton className="h-32 w-full rounded-xl" />
          ) : cards.isError ? (
            <WidgetError onRetry={() => void cards.refetch()} />
          ) : (
            <CardList
              cards={cards.data}
              onAction={setDialog}
              onAdd={() => setDialog({ type: "card" })}
            />
          )}
        </section>
      </div>

      {dialog?.type === "account" && <AccountFormDialog account={dialog.account} onClose={close} />}
      {dialog?.type === "adjust" && <AdjustDialog account={dialog.account} onClose={close} />}
      {dialog?.type === "card" && <CardFormDialog card={dialog.card} onClose={close} />}
      {dialog?.type === "delete-account" && (
        <DeleteDialog
          resource="accounts"
          item={dialog.account}
          name={dialog.account.name}
          onClose={close}
        />
      )}
      {dialog?.type === "delete-card" && (
        <DeleteDialog
          resource="cards"
          item={dialog.card}
          name={dialog.card.alias}
          onClose={close}
        />
      )}
    </>
  );
}

/** Sum of every account, archived ones included (ui-behavior §4.1). */
function TotalBalance() {
  const t = useTranslations("accounts");
  const td = useTranslations("dashboard.cards");
  const now = useBalances(todayIso(), {});
  const end = useBalances(lastOfMonth(todayIso()), {});
  if (now.isPending || end.isPending) return <Skeleton className="h-24 w-full rounded-xl" />;
  if (now.isError || end.isError)
    return <WidgetError onRetry={() => void Promise.all([now.refetch(), end.refetch()])} />;
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 rounded-xl border border-line bg-surface p-5">
      <div className="flex flex-col gap-2">
        <span className="text-[13px] font-medium text-text-muted">{t("totalBalance")}</span>
        <BigMoney amount={now.data.total} currency={now.data.currency} />
      </div>
      <span className="flex flex-col items-end gap-1 text-[13px] text-text-muted">
        <span>
          {t("endOfMonth")} <Money amount={end.data.total} currency={end.data.currency} projected />
        </span>
        {Number(now.data.investments) > 0 && (
          <Link href="/investments" className="hover:text-text hover:underline">
            {td("inInvestments", { amount: formatMoney(now.data.investments, now.data.currency) })}
          </Link>
        )}
      </span>
    </div>
  );
}

function AccountGrid({
  accounts,
  onAction,
}: {
  accounts: Account[];
  onAction: (d: Dialog) => void;
}) {
  const t = useTranslations("accounts");
  const now = useBalances(todayIso(), {});
  const end = useBalances(lastOfMonth(todayIso()), {});
  const balance = (id: string) => now.data?.accounts.find((a) => a.account_id === id);
  const projected = (id: string) => end.data?.accounts.find((a) => a.account_id === id);
  const active = accounts.filter((a) => a.is_active).sort((a, b) => a.name.localeCompare(b.name));
  const archived = accounts.filter((a) => !a.is_active);

  const tile = (account: Account) => {
    const current = balance(account.id);
    const later = projected(account.id);
    const Icon = account.type === "CASH" ? Wallet : Landmark;
    return (
      <article
        key={account.id}
        className={cn(
          "flex flex-col gap-3 rounded-xl border border-line bg-surface p-5",
          !account.is_active && "opacity-70"
        )}
      >
        <div className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-lg bg-surface-2 text-text-muted">
            <Icon size={18} aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-medium">{account.name}</h3>
            <p className="text-xs text-text-muted">
              {account.type === "CASH" ? t("typeCash") : t("typeBank")} · {account.currency}
            </p>
          </div>
          <AccountMenu account={account} onAction={onAction} />
        </div>
        {current?.balance == null ? (
          <span className="text-sm text-text-muted">—</span>
        ) : (
          <BigMoney amount={current.balance} currency={account.currency} size="md" />
        )}
        <div className="flex flex-wrap items-center justify-between gap-2 text-[13px] text-text-muted">
          <span>
            {t("endOfMonth")}{" "}
            {later?.balance == null ? (
              "—"
            ) : (
              <Money amount={later.balance} currency={account.currency} projected />
            )}
          </span>
          <button
            type="button"
            onClick={() => onAction({ type: "adjust", account })}
            className="font-medium text-brand hover:underline"
          >
            {t("adjust")}
          </button>
        </div>
      </article>
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{active.map(tile)}</div>
      {archived.length > 0 && (
        <details className="group">
          <summary className="flex cursor-pointer list-none items-center gap-1.5 text-sm text-text-muted hover:text-text">
            <ChevronRight
              size={15}
              className="transition-transform group-open:rotate-90"
              aria-hidden
            />
            {t("archivedCount", { count: archived.length })}
          </summary>
          <div className="mt-3 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{archived.map(tile)}</div>
        </details>
      )}
    </div>
  );
}

function useArchiveToggle(resource: "accounts" | "cards") {
  const t = useTranslations("accounts");
  const write = useReferenceWrite(resource);
  const errorMessage = useErrorMessage();
  return (id: string, archived: boolean) =>
    write
      .mutateAsync({ kind: archived ? "unarchive" : "archive", id })
      .then(() => toast.success(archived ? t("unarchived") : t("archived")))
      .catch((error) => toast.error(errorMessage(error)));
}

function AccountMenu({ account, onAction }: { account: Account; onAction: (d: Dialog) => void }) {
  const t = useTranslations("accounts");
  const toggle = useArchiveToggle("accounts");
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={t("actionsFor", { name: account.name })}
        className="flex size-8 items-center justify-center rounded-md text-text-muted hover:bg-surface-2 hover:text-text"
      >
        <MoreHorizontal size={18} aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-44">
        <DropdownMenuItem onSelect={() => onAction({ type: "account", account })}>
          {t("edit")}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => onAction({ type: "adjust", account })}>
          {t("adjust")}
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`/entries?account=${account.id}`}>{t("viewEntries")}</Link>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => void toggle(account.id, !account.is_active)}>
          {account.is_active ? t("archive") : t("unarchive")}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={() => onAction({ type: "delete-account", account })}
          className="text-negative"
        >
          {t("delete")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function CardList({
  cards,
  onAction,
  onAdd,
}: {
  cards: Card[];
  onAction: (d: Dialog) => void;
  onAdd: () => void;
}) {
  const t = useTranslations("accounts");
  const locale = useLocale();
  const accounts = byId(useAccounts().data);
  const members = useMembers().data ?? [];
  const billsData = useCardBills({}).data;
  const bills = byId((billsData?.items ?? []).map((b) => ({ ...b, id: b.card_id })));
  const toggle = useArchiveToggle("cards");
  const active = cards.filter((c) => c.is_active).sort((a, b) => a.alias.localeCompare(b.alias));
  const archived = cards.filter((c) => !c.is_active);

  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-line-strong px-6 py-10 text-center text-sm text-text-muted">
        {t("noCards")}
        <button
          type="button"
          onClick={onAdd}
          className="h-9 rounded-lg bg-brand px-3.5 font-semibold text-on-brand hover:bg-brand-hover"
        >
          {t("addCard")}
        </button>
      </div>
    );
  }

  const typeLabel = (card: Card) =>
    card.type === "CREDIT" ? t("credit") : card.type === "DEBIT" ? t("debit") : t("creditDebit");
  const row = (card: Card) => {
    const owner = members.find((m) => m.id === card.owner_id);
    const bill = bills.get(card.id);
    return (
      <li
        key={card.id}
        className={cn(
          "flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line px-4 py-3.5 first:border-t-0 sm:px-5",
          !card.is_active && "opacity-70"
        )}
      >
        <span
          aria-hidden
          className="flex h-8 w-12 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-violet-600 to-violet-900 text-white/80"
        >
          <CreditCard size={16} />
        </span>
        <div className="min-w-40 flex-1">
          <p className="font-medium">
            {card.alias}{" "}
            {card.last_four && (
              <span className="font-normal text-text-muted">•••• {card.last_four}</span>
            )}
          </p>
          <p className="text-xs text-text-muted">
            {[
              typeLabel(card),
              owner ? shortName(owner.name) : t("formerMember"),
              t("paidFrom", { account: accounts.get(card.account_id)?.name ?? "—" }),
            ].join(" · ")}
          </p>
        </div>
        {card.best_buy_day && card.due_day && (
          <p className="text-xs text-text-muted">
            {t("cycle", { best: card.best_buy_day, due: card.due_day })}
          </p>
        )}
        {bill && (
          <Link
            href={`/entries?card=${card.id}&by=payment&from=${bill.due_date}&to=${bill.due_date}`}
            className="flex flex-col items-end text-right hover:underline"
          >
            <Money
              amount={bill.total}
              currency={billsData?.currency}
              projected={Number(bill.projected_fixed) > 0}
              className="font-semibold not-italic"
            />
            <span className="num text-xs text-text-muted">
              {t("nextBill", {
                date: formatWeekdayDate(bill.due_date, locale),
                closes: formatDayMonth(bill.closes_on),
              })}
            </span>
          </Link>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label={t("actionsFor", { name: card.alias })}
            className="flex size-8 items-center justify-center rounded-md text-text-muted hover:bg-surface-2 hover:text-text"
          >
            <MoreHorizontal size={18} aria-hidden />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-44">
            <DropdownMenuItem onSelect={() => onAction({ type: "card", card })}>
              {t("edit")}
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/entries?card=${card.id}`}>{t("viewEntries")}</Link>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => void toggle(card.id, !card.is_active)}>
              {card.is_active ? t("archive") : t("unarchive")}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => onAction({ type: "delete-card", card })}
              className="text-negative"
            >
              {t("delete")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </li>
    );
  };

  return (
    <div className="flex flex-col gap-4">
      {active.length > 0 && (
        <ul className="rounded-xl border border-line bg-surface">{active.map(row)}</ul>
      )}
      {archived.length > 0 && (
        <details className="group">
          <summary className="flex cursor-pointer list-none items-center gap-1.5 text-sm text-text-muted hover:text-text">
            <ChevronRight
              size={15}
              className="transition-transform group-open:rotate-90"
              aria-hidden
            />
            {t("archivedCount", { count: archived.length })}
          </summary>
          <ul className="mt-3 rounded-xl border border-line bg-surface">{archived.map(row)}</ul>
        </details>
      )}
    </div>
  );
}
