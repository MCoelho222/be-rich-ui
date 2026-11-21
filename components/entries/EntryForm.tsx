"use client";
/**
 * The expense and income form (ui-behavior §6–§7): create, split payment, repeats, and
 * edit with the scope rules of §11. Dates, installments and rounding come from the server's
 * preview (api.md §10.5), so those rules live only in the API.
 */
import { Info, Loader2, Plus, Repeat, Trash2 } from "lucide-react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { MoneyInput } from "@/components/ui/money-input";
import { PrimaryButton, SecondaryButton } from "@/components/ui/form-dialog";
import { Switch } from "@/components/ui/switch";
import { ApiError } from "@/lib/api";
import { useMe } from "@/lib/auth";
import {
  CARD_METHODS,
  cardOf,
  CURRENCIES,
  PAYMENT_METHODS,
  personField,
  personOf,
  useCreateEntry,
  useCreateRecurrence,
  usePreview,
  useUpdateEntry,
  type CreateBody,
  type Currency,
  type Entry,
  type EntryKind,
  type PaymentMethod,
  type Preview,
  type Scope,
} from "@/lib/entries";
import { useErrorMessage } from "@/lib/errors";
import { formatDate, formatMoney, formatMonth, shortName } from "@/lib/format";
import { fromCents, toCents } from "@/lib/money";
import { todayIso } from "@/lib/period";
import {
  useAccounts,
  useCards,
  useCategories,
  useMembers,
  type Account,
  type Card,
} from "@/lib/queries";
import { cn } from "@/lib/utils";
import { CardFormDialog } from "@/components/accounts/forms";
import { CategoryPicker, FieldShell, NewAccountInline, Select } from "./pickers";

const MAX_PARTS = 6;
const DESCRIPTION_MAX = 200;
const INTERVALS = [1, 2, 3, 6, 12];
const NEW_ACCOUNT = "__new__";
const NEW_CARD = "__new_card__";

export type FormMode =
  | { type: "create"; repeats?: boolean }
  | { type: "edit"; entry: Entry; scope?: Scope; seriesTotal?: string };

interface Part {
  key: number;
  method: PaymentMethod;
  cardId: string;
  accountId: string;
  amount: string;
  installments: number;
}

type Errors = Record<string, string>;

let partKey = 0;
const newPart = (method: PaymentMethod = "PIX"): Part => ({
  key: ++partKey,
  method,
  cardId: "",
  accountId: "",
  amount: "",
  installments: 1,
});

/** Cards that support the method (schemas §8): credit cards for CREDIT, debit cards for DEBIT. */
function cardsFor(cards: Card[], method: PaymentMethod): Card[] {
  const types = method === "CREDIT" ? ["CREDIT", "CREDIT_DEBIT"] : ["DEBIT", "CREDIT_DEBIT"];
  return cards.filter((c) => c.is_active && types.includes(c.type));
}

function accountsFor(accounts: Account[], method: PaymentMethod): Account[] {
  return accounts.filter((a) => a.is_active && a.type === (method === "CASH" ? "CASH" : "BANK"));
}

/** "parts[1].card_id" → "parts.1.card_id"; single-payment fields go to part 0. */
function normalizeField(field: string): string {
  const key = field.replace(/\[(\d+)\]/g, ".$1");
  if (["card_id", "account_id", "payment_method", "installments"].includes(key))
    return `parts.0.${key}`;
  if (key === "total_amount") return "amount";
  if (["spender_id", "receiver_id", "person_id"].includes(key)) return "person";
  if (key === "start_date") return "transaction_date";
  return key;
}

function useDebounced<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(timer);
  }, [value, ms]);
  return debounced;
}

/** The first occurrence of a new fixed entry: this month's, on the chosen day (ui-behavior §6.4). */
function firstOccurrence(date: string, day: number): string {
  const [y, m] = date.split("-").map(Number);
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return `${y}-${String(m).padStart(2, "0")}-${String(Math.min(day, last)).padStart(2, "0")}`;
}

export function EntryForm({
  kind,
  mode,
  onDone,
}: {
  kind: EntryKind;
  mode: FormMode;
  onDone: () => void;
}) {
  const t = useTranslations("entryForm");
  const tm = useTranslations("methods");
  const locale = useLocale();
  const errorMessage = useErrorMessage();
  const me = useMe();
  const accounts = useAccounts().data ?? [];
  const cards = useCards().data ?? [];
  const categories = useCategories().data ?? [];
  const members = useMembers().data ?? [];
  const create = useCreateEntry(kind);
  const createRecurrence = useCreateRecurrence();
  const update = useUpdateEntry(kind);

  const editing = mode.type === "edit" ? mode.entry : null;
  const scope = mode.type === "edit" ? mode.scope : undefined;
  const inSeries = !!editing?.installment_group_id;
  // ui-behavior §11.1: payment fields only change with scope "All" (or on a single row).
  const paymentLocked = inSeries && scope !== "ALL";
  const entryType = kind === "expense" ? "EXPENSE" : "INCOME";

  const initial = useMemo(() => {
    if (!editing) return null;
    return {
      amount:
        scope === "ALL" && mode.type === "edit" && mode.seriesTotal
          ? mode.seriesTotal
          : editing.amount,
      currency: editing.currency,
      date: editing.transaction_date,
      categoryId: editing.category_id,
      personId: personOf(editing),
      description: editing.description ?? "",
      part: {
        key: ++partKey,
        method: editing.payment_method,
        cardId: cardOf(editing) ?? "",
        accountId: editing.account_id,
        amount: "",
        installments: editing.installment_total,
      } satisfies Part,
    };
  }, [editing, scope, mode]);

  const [amount, setAmount] = useState(initial?.amount ?? "");
  const [currency, setCurrency] = useState<Currency | "">(initial?.currency ?? "");
  const [date, setDate] = useState(initial?.date ?? todayIso());
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? "");
  const [personId, setPersonId] = useState(initial?.personId ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [split, setSplit] = useState(false);
  const [parts, setParts] = useState<Part[]>(() => [initial?.part ?? newPart()]);
  const [repeats, setRepeats] = useState(mode.type === "create" && !!mode.repeats);
  const [interval, setInterval] = useState(1);
  const [day, setDay] = useState<number | "">("");
  const [until, setUntil] = useState("");
  const [creatingAccountFor, setCreatingAccountFor] = useState<number | null>(null);
  const [creatingCardFor, setCreatingCardFor] = useState<number | null>(null);
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);

  // Defaults that depend on loaded data: the household's currency and the logged-in member.
  const effectiveCurrency: Currency =
    currency || (me.data?.household.default_currency as Currency) || "BRL";
  const effectivePerson = personId || me.data?.user.id || "";
  const effectiveDay = day === "" ? Number(date.slice(8, 10)) || 1 : day;

  const needsCard = (method: PaymentMethod) => kind === "expense" && CARD_METHODS.includes(method);
  const cashAccounts = accountsFor(accounts, "CASH");
  const showAccount = (method: PaymentMethod) =>
    !needsCard(method) && (method !== "CASH" || cashAccounts.length > 1);
  /** Resolved card and account: the chosen one, else the first that fits (shown preselected). */
  const resolve = (part: Part) => {
    if (needsCard(part.method)) {
      const options = cardsFor(cards, part.method);
      const card = cards.find((c) => c.id === part.cardId) ?? options[0];
      return { cardId: card?.id ?? "", accountId: card?.account_id ?? "", card };
    }
    const options = accountsFor(accounts, part.method);
    return { cardId: "", accountId: part.accountId || options[0]?.id || "", card: undefined };
  };

  const updatePart = (key: number, change: Partial<Part>) =>
    setParts((list) => list.map((p) => (p.key === key ? { ...p, ...change } : p)));

  const remainingCents = split
    ? toCents(amount || "0") - parts.reduce((sum, p) => sum + toCents(p.amount || "0"), 0)
    : 0;

  // --- Request bodies --------------------------------------------------------------

  const partBodies = parts.map((part) => {
    const { cardId, accountId } = resolve(part);
    return {
      payment_method: part.method,
      ...(needsCard(part.method) ? { card_id: cardId || null } : { account_id: accountId || null }),
      ...(split ? { amount: part.amount } : {}),
      installments: kind === "expense" && part.method === "DEBIT" ? 1 : part.installments,
    };
  });

  const createBody: CreateBody = {
    transaction_date: date,
    currency: effectiveCurrency,
    category_id: categoryId,
    description: description.trim() || null,
    total_amount: amount,
    [personField(kind)]: effectivePerson || undefined,
    parts: partBodies,
  };

  // Preview only once the server can answer (amount, category and payment chosen).
  const previewReady =
    mode.type === "create" &&
    toCents(amount || "0") > 0 &&
    !!categoryId &&
    partBodies.every((p) =>
      "card_id" in p ? p.card_id : p.account_id || p.payment_method === "CASH"
    ) &&
    (!split || remainingCents === 0);
  const previewBody = useDebounced(
    previewReady
      ? repeats
        ? { ...createBody, parts: [{ ...partBodies[0], installments: 1 }] }
        : createBody
      : null,
    350
  );
  const preview = usePreview(kind, previewBody);

  // --- Validation and submit ----------------------------------------------------------

  function validate(): Errors {
    const found: Errors = {};
    if (!(toCents(amount || "0") > 0)) found.amount = t("errAmount");
    if (!categoryId) found.category_id = t("errRequired");
    if (!date) found.transaction_date = t("errRequired");
    parts.forEach((part, i) => {
      const { cardId, accountId } = resolve(part);
      if (needsCard(part.method) && !cardId) found[`parts.${i}.card_id`] = t("errCard");
      if (!needsCard(part.method) && part.method !== "CASH" && !accountId)
        found[`parts.${i}.account_id`] = t("errRequired");
      if (split && !(toCents(part.amount || "0") > 0)) found[`parts.${i}.amount`] = t("errAmount");
    });
    if (repeats && until && until < date) found.end_date = t("errUntil");
    return found;
  }

  function handleError(error: unknown) {
    if (error instanceof ApiError && Object.keys(error.fields).length) {
      const mapped: Errors = {};
      const unmatched: string[] = [];
      for (const [field, messages] of Object.entries(error.fields)) {
        const key = normalizeField(field);
        mapped[key] = messages[0];
        if (
          !/^(amount|category_id|transaction_date|person|description|end_date|parts\.\d+\.\w+)$/.test(
            key
          )
        )
          unmatched.push(messages[0]);
      }
      setErrors(mapped);
      setFormError(unmatched.length ? unmatched.join(" ") : null);
      return;
    }
    setFormError(errorMessage(error));
  }

  const pending = create.isPending || createRecurrence.isPending || update.isPending;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const found = validate();
    setErrors(found);
    setFormError(null);
    if (Object.keys(found).length) {
      // ui-behavior §1.3: focus the first invalid field.
      requestAnimationFrame(() =>
        (
          document.querySelector("[data-entry-form] [aria-invalid=true]") as HTMLElement | null
        )?.focus()
      );
      return;
    }
    try {
      if (editing) {
        await update.mutateAsync({
          id: editing.id,
          scope: inSeries ? scope : undefined,
          body: patchBody(),
        });
        toast.success(t("updated"));
      } else if (repeats) {
        const occurrence = firstOccurrence(date, effectiveDay);
        const { cardId, accountId } = resolve(parts[0]);
        await createRecurrence.mutateAsync({
          type: entryType,
          person_id: effectivePerson || undefined,
          amount,
          currency: effectiveCurrency,
          payment_method: parts[0].method,
          card_id: needsCard(parts[0].method) ? cardId : null,
          account_id: needsCard(parts[0].method) ? null : accountId || null,
          category_id: categoryId,
          description: description.trim() || null,
          interval_months: interval,
          day_of_month: effectiveDay,
          start_date: occurrence < date ? occurrence : date,
          end_date: until || null,
          register_first: { occurrence_date: occurrence },
        });
        toast.success(kind === "expense" ? t("fixedExpenseCreated") : t("fixedIncomeCreated"));
      } else {
        await create.mutateAsync(createBody);
        toast.success(t("saved"));
      }
      onDone();
    } catch (error) {
      handleError(error);
    }
  }

  /** Only the fields that changed, and only those the scope allows (api.md §10.6). */
  function patchBody(): Record<string, unknown> {
    if (!initial) return {};
    const body: Record<string, unknown> = {};
    if (effectivePerson !== initial.personId) body[personField(kind)] = effectivePerson;
    if (categoryId !== initial.categoryId) body.category_id = categoryId;
    if ((description.trim() || "") !== initial.description)
      body.description = description.trim() || null;
    if (amount !== initial.amount) body.amount = amount;
    if (!paymentLocked) {
      const part = parts[0];
      const { cardId, accountId } = resolve(part);
      if (date !== initial.date) body.transaction_date = date;
      if (effectiveCurrency !== initial.currency) body.currency = effectiveCurrency;
      if (part.method !== initial.part.method) body.payment_method = part.method;
      if (needsCard(part.method) && cardId !== initial.part.cardId) body.card_id = cardId;
      if (!needsCard(part.method) && accountId !== initial.part.accountId)
        body.account_id = accountId;
      if (inSeries && scope === "ALL" && part.installments !== initial.part.installments)
        body.installments = part.installments;
    }
    return body;
  }

  // --- Rendering ------------------------------------------------------------------

  const lockedHint = paymentLocked ? t("lockedHint") : undefined;
  // A row of a former member shows the person as read-only text (ui-behavior §1.5).
  const formerMember =
    !!editing && members.length > 0 && !members.some((m) => m.id === effectivePerson);

  const methodChips = (part: Part) => (
    <div role="radiogroup" aria-label={t("method")} className="flex flex-wrap gap-1.5">
      {PAYMENT_METHODS.map((method) => {
        const active = part.method === method;
        return (
          <button
            key={method}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={paymentLocked}
            onClick={() => updatePart(part.key, { method, cardId: "", accountId: "" })}
            className={cn(
              "h-8 rounded-full border px-3 text-[13px] transition-colors disabled:cursor-not-allowed disabled:opacity-50",
              active
                ? "border-brand bg-brand/10 font-medium text-brand"
                : "border-line-strong text-text-2 hover:bg-surface-2"
            )}
          >
            {tm(method)}
          </button>
        );
      })}
    </div>
  );

  const paymentFields = (part: Part, index: number) => {
    const { cardId, accountId, card } = resolve(part);
    const prefix = `parts.${index}`;
    const cardList = cardsFor(cards, part.method);
    const accountList = accountsFor(accounts, part.method);
    const showInstallments =
      !repeats &&
      !(kind === "expense" && part.method === "DEBIT") &&
      (!editing || (inSeries && scope === "ALL"));
    const paidFrom = card ? accounts.find((a) => a.id === card.account_id)?.name : undefined;
    return (
      <div className="flex flex-col gap-3">
        {methodChips(part)}
        <div
          className={cn(
            "grid gap-3",
            split
              ? "grid-cols-1 sm:grid-cols-[1fr_140px_92px]"
              : "grid-cols-1 sm:grid-cols-[1fr_120px]"
          )}
        >
          {needsCard(part.method) ? (
            <FieldShell
              label={t("card")}
              required
              error={errors[`${prefix}.card_id`]}
              hint={
                paidFrom ? (
                  t("paidFrom", { account: paidFrom })
                ) : cardList.length === 0 ? (
                  <Link href="/accounts" className="text-brand hover:underline">
                    {t("addCard")}
                  </Link>
                ) : undefined
              }
            >
              <Select
                value={cardId}
                disabled={paymentLocked}
                invalid={!!errors[`${prefix}.card_id`]}
                onChange={(e) =>
                  e.target.value === NEW_CARD
                    ? setCreatingCardFor(part.key)
                    : updatePart(part.key, { cardId: e.target.value })
                }
                aria-label={t("card")}
              >
                {cardList.length === 0 && <option value="">—</option>}
                {cardList.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.alias}
                    {c.last_four ? ` •••• ${c.last_four}` : ""}
                  </option>
                ))}
                {!paymentLocked && <option value={NEW_CARD}>+ {t("newCard")}</option>}
              </Select>
              {/* ui-behavior §1.5: the Card form opens in a nested dialog; the new card is selected. */}
              {creatingCardFor === part.key && (
                <CardFormDialog
                  onClose={() => setCreatingCardFor(null)}
                  onCreated={(id) => updatePart(part.key, { cardId: id })}
                />
              )}
            </FieldShell>
          ) : showAccount(part.method) ? (
            <FieldShell
              label={kind === "income" ? t("receivedIn") : t("account")}
              required
              error={errors[`${prefix}.account_id`]}
            >
              {creatingAccountFor === part.key ? (
                <NewAccountInline
                  onCreated={(id) => {
                    updatePart(part.key, { accountId: id });
                    setCreatingAccountFor(null);
                  }}
                  onCancel={() => setCreatingAccountFor(null)}
                />
              ) : (
                <Select
                  value={accountId}
                  disabled={paymentLocked}
                  invalid={!!errors[`${prefix}.account_id`]}
                  aria-label={t("account")}
                  onChange={(e) =>
                    e.target.value === NEW_ACCOUNT
                      ? setCreatingAccountFor(part.key)
                      : updatePart(part.key, { accountId: e.target.value })
                  }
                >
                  {accountList.length === 0 && <option value="">—</option>}
                  {accountList.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                  {part.method !== "CASH" && (
                    <option value={NEW_ACCOUNT}>+ {t("newAccount")}</option>
                  )}
                </Select>
              )}
            </FieldShell>
          ) : (
            <p className="self-end pb-2.5 text-[13px] text-text-muted">{t("cashAuto")}</p>
          )}
          {split && (
            <FieldShell label={t("partAmount")} required error={errors[`${prefix}.amount`]}>
              <MoneyInput
                value={part.amount}
                onChange={(value) => updatePart(part.key, { amount: value })}
                aria-invalid={!!errors[`${prefix}.amount`]}
                aria-label={t("partAmount")}
                symbol={
                  new Intl.NumberFormat("pt-BR", { style: "currency", currency: effectiveCurrency })
                    .formatToParts(0)
                    .find((p) => p.type === "currency")?.value
                }
              />
            </FieldShell>
          )}
          {showInstallments && (
            <FieldShell label={t("installments")} error={errors[`${prefix}.installments`]}>
              <Input
                type="number"
                min={1}
                max={60}
                value={part.installments}
                onChange={(e) =>
                  updatePart(part.key, {
                    installments: Math.min(60, Math.max(1, Number(e.target.value) || 1)),
                  })
                }
                aria-label={t("installments")}
              />
            </FieldShell>
          )}
        </div>
      </div>
    );
  };

  const currencySymbol =
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: effectiveCurrency })
      .formatToParts(0)
      .find((p) => p.type === "currency")?.value ?? "R$";

  return (
    <form
      id="entry-form"
      data-entry-form
      noValidate
      onSubmit={submit}
      className="flex flex-col gap-5"
    >
      {editing && inSeries && (
        <p className="flex items-start gap-2 rounded-lg bg-surface-2 px-3 py-2 text-[13px] text-text-2">
          <Info size={15} className="mt-0.5 shrink-0 text-text-muted" aria-hidden />
          {t(`scopeNote.${scope ?? "THIS"}`, {
            n: editing.installment_number,
            total: editing.installment_total,
          })}
        </p>
      )}
      {editing?.recurrence_id && (
        <p className="flex flex-wrap items-center gap-2 rounded-lg bg-fixed-soft px-3 py-2 text-[13px] text-text-2">
          <Repeat size={14} className="text-fixed" aria-hidden />
          {t("recurrenceRow")}
          <Link
            href={`/fixed?id=${editing.recurrence_id}`}
            className="font-medium text-fixed hover:underline"
          >
            {t("editFixed")}
          </Link>
        </p>
      )}

      {/* Amount and currency */}
      <FieldShell
        label={scope === "ALL" ? t("seriesTotal") : t("amount")}
        required
        error={errors.amount}
        htmlFor="entry-amount"
      >
        <div className="flex gap-2">
          <MoneyInput
            id="entry-amount"
            size="lg"
            autoFocus={mode.type === "create"}
            value={amount}
            onChange={setAmount}
            symbol={currencySymbol}
            aria-invalid={!!errors.amount}
            className={cn(
              "flex-1",
              kind === "expense" ? "[&_input]:text-expense" : "[&_input]:text-income"
            )}
          />
          <Select
            value={effectiveCurrency}
            onChange={(e) => setCurrency(e.target.value as Currency)}
            disabled={paymentLocked}
            aria-label={t("currency")}
            className="h-14 w-24"
          >
            {CURRENCIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </Select>
        </div>
      </FieldShell>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FieldShell
          label={kind === "expense" ? t("purchaseDate") : t("date")}
          required
          error={errors.transaction_date}
          htmlFor="entry-date"
          hint={lockedHint}
        >
          <Input
            id="entry-date"
            type="date"
            value={date}
            disabled={paymentLocked}
            onChange={(e) => setDate(e.target.value)}
            aria-invalid={!!errors.transaction_date}
          />
        </FieldShell>
        <FieldShell
          label={t("category")}
          required
          error={errors.category_id}
          htmlFor="entry-category"
        >
          <CategoryPicker
            id="entry-category"
            type={entryType}
            categories={categories}
            value={categoryId}
            onChange={setCategoryId}
            invalid={!!errors.category_id}
          />
        </FieldShell>
        <FieldShell
          label={kind === "expense" ? t("spender") : t("receiver")}
          error={errors.person}
          htmlFor="entry-person"
        >
          {formerMember ? (
            <p className="flex h-10 items-center text-sm text-text-2">{t("formerMember")}</p>
          ) : (
            <Select
              id="entry-person"
              value={effectivePerson}
              onChange={(e) => setPersonId(e.target.value)}
            >
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {shortName(m.name)}
                  {m.is_you ? ` (${t("you")})` : ""}
                </option>
              ))}
            </Select>
          )}
        </FieldShell>
        <FieldShell
          label={t("description")}
          htmlFor="entry-description"
          error={errors.description}
          hint={
            description.length >= DESCRIPTION_MAX * 0.8 ? (
              <span className="num">
                {description.length}/{DESCRIPTION_MAX}
              </span>
            ) : undefined
          }
        >
          <Input
            id="entry-description"
            value={description}
            maxLength={DESCRIPTION_MAX}
            onChange={(e) => setDescription(e.target.value)}
          />
        </FieldShell>
      </div>

      {/* Payment */}
      <fieldset className="flex flex-col gap-4 rounded-xl border border-line p-4">
        <legend className="px-1.5 text-[13px] font-medium text-text-2">{t("payment")}</legend>
        {split ? (
          <>
            {parts.map((part, index) => (
              <div
                key={part.key}
                className="flex flex-col gap-3 border-b border-line pb-4 last:border-b-0 last:pb-0"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold tracking-wide text-text-muted uppercase">
                    {t("paymentN", { n: index + 1 })}
                  </span>
                  {parts.length > 2 && (
                    <button
                      type="button"
                      onClick={() => setParts((list) => list.filter((p) => p.key !== part.key))}
                      aria-label={t("removePayment")}
                      className="flex size-7 items-center justify-center rounded-md text-text-muted hover:bg-surface-2 hover:text-negative"
                    >
                      <Trash2 size={15} aria-hidden />
                    </button>
                  )}
                </div>
                {paymentFields(part, index)}
              </div>
            ))}
            <div className="flex flex-wrap items-center justify-between gap-3">
              {parts.length < MAX_PARTS ? (
                <button
                  type="button"
                  onClick={() => setParts((list) => [...list, newPart()])}
                  className="inline-flex items-center gap-1.5 text-sm text-brand hover:underline"
                >
                  <Plus size={15} aria-hidden />
                  {t("addPayment")}
                </button>
              ) : (
                <span />
              )}
              <span
                className={cn(
                  "num text-sm font-medium",
                  remainingCents === 0 ? "text-text-muted" : "text-negative"
                )}
                role="status"
              >
                {t("remaining", {
                  amount: formatMoney(fromCents(remainingCents), effectiveCurrency),
                })}
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                setSplit(false);
                setParts((list) => [list[0]]);
              }}
              className="self-start text-[13px] text-text-muted hover:text-text hover:underline"
            >
              {t("singlePayment")}
            </button>
          </>
        ) : (
          <>
            {paymentFields(parts[0], 0)}
            {mode.type === "create" && !repeats && (
              <button
                type="button"
                onClick={() => {
                  setSplit(true);
                  setParts((list) => [
                    { ...list[0], amount: amount },
                    newPart(list[0].method === "PIX" ? "CREDIT" : "PIX"),
                  ]);
                }}
                className="self-start text-sm text-brand hover:underline"
              >
                {t("splitPayment")}
              </button>
            )}
          </>
        )}
        <PreviewSummary
          kind={kind}
          preview={preview.data}
          loading={preview.isFetching}
          show={previewReady}
          split={split}
          locale={locale}
        />
      </fieldset>

      {/* Repeats (fixed entry) */}
      {mode.type === "create" && (
        <div className="flex flex-col gap-4">
          <label className="flex cursor-pointer items-center gap-3">
            <Switch
              checked={repeats}
              disabled={split}
              onCheckedChange={(on) => {
                setRepeats(on);
                if (on) setParts((list) => [{ ...list[0], installments: 1 }]);
              }}
            />
            <span className="flex flex-col">
              <span className="text-sm font-medium">
                {kind === "expense" ? t("isFixedExpense") : t("isFixedIncome")}
              </span>
              <span className="text-[13px] text-text-muted">
                {split ? t("repeatsNoSplit") : t("repeatsHint")}
              </span>
            </span>
          </label>
          {repeats && (
            <div className="grid grid-cols-1 gap-4 rounded-xl bg-surface-2/60 p-4 sm:grid-cols-3">
              <FieldShell label={t("every")}>
                <Select value={interval} onChange={(e) => setInterval(Number(e.target.value))}>
                  {INTERVALS.map((n) => (
                    <option key={n} value={n}>
                      {t(`interval.${n}` as "interval.1")}
                    </option>
                  ))}
                </Select>
              </FieldShell>
              <FieldShell label={t("onDay")}>
                <Input
                  type="number"
                  min={1}
                  max={31}
                  value={effectiveDay}
                  onChange={(e) => setDay(Math.min(31, Math.max(1, Number(e.target.value) || 1)))}
                />
              </FieldShell>
              <FieldShell
                label={t("until")}
                error={errors.end_date}
                hint={!until ? t("noEnd") : undefined}
              >
                <Input
                  type="date"
                  value={until}
                  min={date}
                  onChange={(e) => setUntil(e.target.value)}
                  aria-invalid={!!errors.end_date}
                />
              </FieldShell>
            </div>
          )}
        </div>
      )}

      {formError && (
        <p role="alert" className="rounded-lg bg-negative-soft px-3 py-2 text-[13px] text-negative">
          {formError}
        </p>
      )}

      {/* The dialog renders the buttons in its footer; this keeps Enter-to-submit working. */}
      <button type="submit" hidden />
      <FormFooterPortal>
        <SecondaryButton onClick={onDone}>{t("cancel")}</SecondaryButton>
        <PrimaryButton
          type="submit"
          form="entry-form"
          disabled={pending || (split && remainingCents !== 0)}
        >
          {pending && <Loader2 size={16} className="animate-spin" aria-hidden />}
          {editing ? t("saveChanges") : kind === "expense" ? t("saveExpense") : t("saveIncome")}
        </PrimaryButton>
      </FormFooterPortal>
    </form>
  );
}

/** Renders its children into the dialog footer (FormDialog's footer slot). */
function FormFooterPortal({ children }: { children: React.ReactNode }) {
  const [target, setTarget] = useState<Element | null>(null);
  useEffect(() => {
    // The footer element exists once the dialog has mounted.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTarget(document.querySelector("[data-entry-footer]"));
  }, []);
  if (!target) return null;
  return createPortal(children, target);
}

function PreviewSummary({
  kind,
  preview,
  loading,
  show,
  split,
  locale,
}: {
  kind: EntryKind;
  preview: Preview | undefined;
  loading: boolean;
  show: boolean;
  split: boolean;
  locale: string;
}) {
  const t = useTranslations("entryForm");
  if (!show || !preview) return null;
  const partIndexes = [...new Set(preview.items.map((row) => row.part))];
  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-lg bg-bg/60 px-3.5 py-3 text-[13px] transition-opacity",
        loading && "opacity-60"
      )}
      aria-live="polite"
    >
      {partIndexes.map((part) => {
        const rows = preview.items.filter((row) => row.part === part);
        const first = rows[0];
        const last = rows[rows.length - 1];
        const n = rows.length;
        const regular = rows[n > 1 ? 1 : 0].amount;
        return (
          <div key={part} className="flex flex-col gap-0.5">
            {split && (
              <span className="font-medium text-text-2">{t("paymentN", { n: part + 1 })}</span>
            )}
            {n > 1 ? (
              <span className="num text-text">
                {n} × {formatMoney(regular, first.currency)}
                {first.amount !== regular && (
                  <span className="text-text-muted">
                    {" "}
                    · {t("firstInstallment", { amount: formatMoney(first.amount, first.currency) })}
                  </span>
                )}
                <span className="text-text-muted">
                  {" "}
                  · {formatMonth(first.payment_date.slice(0, 7), locale)} →{" "}
                  {formatMonth(last.payment_date.slice(0, 7), locale)}
                </span>
              </span>
            ) : (
              <span className="num text-text">{formatMoney(first.amount, first.currency)}</span>
            )}
            {first.payment_method === "CREDIT" && (
              <span className="text-text-muted">
                {kind === "expense"
                  ? t("chargedOn", { date: formatDate(first.payment_date) })
                  : t("expectedOn", { date: formatDate(first.payment_date) })}
              </span>
            )}
          </div>
        );
      })}
      {preview.converted_total && (
        <span className="num text-text-muted">
          {t("converted", {
            amount: formatMoney(preview.converted_total.amount, preview.converted_total.currency),
          })}
        </span>
      )}
    </div>
  );
}
