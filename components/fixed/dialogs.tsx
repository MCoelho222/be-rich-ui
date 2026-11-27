"use client";
/** Dialogs for fixed entries (ui-behavior §8.3, §11.4). */
import { Info, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { CategoryPicker, FieldShell, Select } from "@/components/entries/pickers";
import { FormDialog, PrimaryButton, SecondaryButton } from "@/components/ui/form-dialog";
import { Input } from "@/components/ui/input";
import { MoneyInput } from "@/components/ui/money-input";
import { ApiError } from "@/lib/api";
import {
  CARD_METHODS,
  CURRENCIES,
  PAYMENT_METHODS,
  type Currency,
  type PaymentMethod,
} from "@/lib/entries";
import { useErrorMessage } from "@/lib/errors";
import { formatDate, formatMoney, shortName } from "@/lib/format";
import { toCents } from "@/lib/money";
import { purchaseDateFor } from "@/lib/credit";
import { firstOfMonth, todayIso } from "@/lib/period";
import { useAccounts, useCards, useCategories, useMembers, type Recurrence } from "@/lib/queries";
import { useRecurrenceAction } from "@/lib/recurrences";
import { cn } from "@/lib/utils";

const INTERVALS = [1, 2, 3, 6, 12];

function symbolOf(currency: string) {
  return (
    new Intl.NumberFormat("pt-BR", { style: "currency", currency })
      .formatToParts(0)
      .find((p) => p.type === "currency")?.value ?? currency
  );
}

function useRun() {
  const action = useRecurrenceAction();
  const errorMessage = useErrorMessage();
  const run = (
    input: Parameters<typeof action.mutateAsync>[0],
    success: string,
    onDone: () => void
  ) =>
    action
      .mutateAsync(input)
      .then(() => {
        toast.success(success);
        onDone();
      })
      .catch((error) => {
        toast.error(errorMessage(error));
        throw error;
      });
  return { run, pending: action.isPending };
}

function Footer({
  onCancel,
  onConfirm,
  label,
  pending,
  disabled,
  danger,
}: {
  onCancel: () => void;
  onConfirm: () => void;
  label: string;
  pending: boolean;
  disabled?: boolean;
  danger?: boolean;
}) {
  const t = useTranslations("fixed");
  return (
    <>
      <SecondaryButton onClick={onCancel}>{t("cancel")}</SecondaryButton>
      <PrimaryButton danger={danger} disabled={pending || disabled} onClick={onConfirm}>
        {pending && <Loader2 size={16} className="animate-spin" aria-hidden />}
        {label}
      </PrimaryButton>
    </>
  );
}

/** Register an occurrence, pre-filled with the expected values (ui-behavior §8.3). */
export function RegisterDialog({
  rec,
  occurrence,
  onClose,
}: {
  rec: Recurrence;
  occurrence: string;
  onClose: () => void;
}) {
  const t = useTranslations("fixed");
  const { run, pending } = useRun();
  const cards = useCards().data ?? [];
  // Name the fixed entry: two on the same day look alike in the entries list.
  const categories = useCategories().data ?? [];
  const name = rec.description || categories.find((c) => c.id === rec.category_id)?.name || "—";
  // A credit card fixed expense's occurrence is a bill's due date (schemas §12.1): the payment
  // gets a purchase date inside that bill.
  const card =
    rec.type === "EXPENSE" && rec.payment_method === "CREDIT"
      ? cards.find((c) => c.id === rec.card_id)
      : undefined;
  const suggested = card ? purchaseDateFor(occurrence, card, todayIso()) : null;
  const [amount, setAmount] = useState(rec.amount);
  const [picked, setDate] = useState<string | null>(null);
  const date = picked ?? suggested ?? occurrence;
  const [description, setDescription] = useState(rec.description ?? "");
  const body = {
    ...(amount !== rec.amount ? { amount } : {}),
    ...(date !== occurrence ? { transaction_date: date } : {}),
    ...(description !== (rec.description ?? "") ? { description: description || null } : {}),
  };
  return (
    <FormDialog
      open
      width="sm"
      onOpenChange={(open) => !open && onClose()}
      title={t("registerTitle")}
      description={t("registerFor", {
        name,
        amount: formatMoney(rec.amount, rec.currency),
        date: formatDate(occurrence),
      })}
      footer={
        <Footer
          onCancel={onClose}
          pending={pending}
          disabled={!(toCents(amount || "0") > 0)}
          label={t("register")}
          onConfirm={() =>
            void run(
              { kind: "register", id: rec.id, occurrence, body },
              t("registered"),
              onClose
            ).catch(() => undefined)
          }
        />
      }
    >
      <div className="flex flex-col gap-4">
        <FieldShell label={t("amount")} required>
          <MoneyInput
            value={amount}
            onChange={setAmount}
            symbol={symbolOf(rec.currency)}
            aria-label={t("amount")}
          />
        </FieldShell>
        <FieldShell
          label={card ? t("purchasedOn") : t("paidOn")}
          hint={card ? t("purchasedOnHint") : undefined}
          required
        >
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </FieldShell>
        <FieldShell label={t("description")}>
          <Input
            value={description}
            maxLength={200}
            onChange={(e) => setDescription(e.target.value)}
          />
        </FieldShell>
      </div>
    </FormDialog>
  );
}

export function SkipDialog({
  rec,
  occurrence,
  onClose,
}: {
  rec: Recurrence;
  occurrence: string;
  onClose: () => void;
}) {
  const t = useTranslations("fixed");
  const { run, pending } = useRun();
  return (
    <FormDialog
      open
      width="sm"
      onOpenChange={(open) => !open && onClose()}
      title={t("skipTitle")}
      footer={
        <Footer
          onCancel={onClose}
          pending={pending}
          label={t("skip")}
          onConfirm={() =>
            void run({ kind: "skip", id: rec.id, occurrence }, t("skipped"), onClose).catch(
              () => undefined
            )
          }
        />
      }
    >
      <p className="text-sm text-text-2">
        {t("skipBody", { name: rec.description || "—", date: formatDate(occurrence) })}
      </p>
    </FormDialog>
  );
}

export function ChangeAmountDialog({ rec, onClose }: { rec: Recurrence; onClose: () => void }) {
  const t = useTranslations("fixed");
  const { run, pending } = useRun();
  // The new amount must start after the entry does (api.md §12.2): the 1st of next month,
  // or of the month after the start, whichever is later.
  const [effective, setEffective] = useState(
    [firstOfMonth(todayIso(), 1), firstOfMonth(rec.start_date, 1)].sort()[1]
  );
  const [amount, setAmount] = useState("");
  return (
    <FormDialog
      open
      width="sm"
      onOpenChange={(open) => !open && onClose()}
      title={t("changeAmountTitle")}
      description={t("changeAmountIntro", { amount: formatMoney(rec.amount, rec.currency) })}
      footer={
        <Footer
          onCancel={onClose}
          pending={pending}
          disabled={!(toCents(amount || "0") > 0) || !effective}
          label={t("apply")}
          onConfirm={() =>
            void run(
              { kind: "change-amount", id: rec.id, effective_date: effective, amount },
              t("amountChanged"),
              onClose
            ).catch(() => undefined)
          }
        />
      }
    >
      <div className="flex flex-col gap-4">
        <FieldShell label={t("newAmount")} required>
          <MoneyInput
            value={amount}
            onChange={setAmount}
            symbol={symbolOf(rec.currency)}
            autoFocus
            aria-label={t("newAmount")}
          />
        </FieldShell>
        <FieldShell label={t("startingOn")} required hint={t("changeAmountHint")}>
          <Input
            type="date"
            value={effective}
            min={rec.start_date}
            onChange={(e) => setEffective(e.target.value)}
          />
        </FieldShell>
      </div>
    </FormDialog>
  );
}

export function EndDialog({ rec, onClose }: { rec: Recurrence; onClose: () => void }) {
  const t = useTranslations("fixed");
  const { run, pending } = useRun();
  const [date, setDate] = useState(todayIso());
  const [error, setError] = useState<string | null>(null);
  return (
    <FormDialog
      open
      width="sm"
      onOpenChange={(open) => !open && onClose()}
      title={t("endTitle")}
      footer={
        <Footer
          onCancel={onClose}
          pending={pending}
          disabled={!date}
          label={t("end")}
          onConfirm={() =>
            void run({ kind: "end", id: rec.id, end_date: date }, t("ended"), onClose).catch((e) =>
              setError(e instanceof ApiError ? (e.fields.end_date?.[0] ?? null) : null)
            )
          }
        />
      }
    >
      <div className="flex flex-col gap-4">
        <p className="text-sm text-text-2">{t("endBody")}</p>
        <FieldShell label={t("lastDay")} required error={error ?? undefined}>
          <Input
            type="date"
            value={date}
            aria-invalid={!!error}
            onChange={(e) => {
              setDate(e.target.value);
              setError(null);
            }}
          />
        </FieldShell>
      </div>
    </FormDialog>
  );
}

/**
 * Delete. When payments exist the API says IN_USE, and the dialog asks what happens to them:
 * delete them too, or keep them as regular entries (ui-behavior §8.3). Ending is offered too.
 */
export function DeleteDialog({
  rec,
  onClose,
  onEnd,
}: {
  rec: Recurrence;
  onClose: () => void;
  onEnd: () => void;
}) {
  const t = useTranslations("fixed");
  const action = useRecurrenceAction();
  const errorMessage = useErrorMessage();
  const [count, setCount] = useState<number | null>(null);
  const [payments, setPayments] = useState<"delete" | "keep">("keep");

  const remove = () =>
    action
      .mutateAsync({ kind: "delete", id: rec.id, payments: count ? payments : undefined })
      .then(() => {
        toast.success(t("deleted"));
        onClose();
      })
      .catch((error) => {
        if (error instanceof ApiError && error.code === "IN_USE")
          setCount(Object.values(error.usage ?? {}).reduce((a, b) => a + b, 0) || 1);
        else toast.error(errorMessage(error));
      });

  const choice = (value: "delete" | "keep", label: string, hint: string) => (
    <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-line p-3 has-[:checked]:border-brand">
      <input
        type="radio"
        name="payments"
        checked={payments === value}
        onChange={() => setPayments(value)}
        className="mt-0.5 size-4 accent-[var(--brand)]"
      />
      <span className="flex flex-col gap-0.5">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-[13px] text-text-muted">{hint}</span>
      </span>
    </label>
  );

  return (
    <FormDialog
      open
      width="sm"
      onOpenChange={(open) => !open && onClose()}
      title={count ? t("deleteWithPaymentsTitle", { count }) : t("deleteTitle")}
      footer={
        <>
          <SecondaryButton onClick={onClose}>{t("cancel")}</SecondaryButton>
          {count !== null && rec.status !== "ENDED" && (
            <SecondaryButton onClick={onEnd}>{t("endInstead")}</SecondaryButton>
          )}
          <PrimaryButton danger disabled={action.isPending} onClick={() => void remove()}>
            {action.isPending && <Loader2 size={16} className="animate-spin" aria-hidden />}
            {t("delete")}
          </PrimaryButton>
        </>
      }
    >
      {count ? (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-text-2">
            {t("deleteWithPaymentsBody", { name: rec.description || "—" })}
          </p>
          <div role="radiogroup" className="flex flex-col gap-2">
            {choice("keep", t("keepPayments"), t("keepPaymentsHint"))}
            {choice("delete", t("deletePayments", { count }), t("deletePaymentsHint"))}
          </div>
        </div>
      ) : (
        <p className="text-sm text-text-2">{t("deleteBody", { name: rec.description || "—" })}</p>
      )}
    </FormDialog>
  );
}

/** Edit the template; registered payments never change (schemas §12.3). */
export function EditRecurrenceDialog({ rec, onClose }: { rec: Recurrence; onClose: () => void }) {
  const t = useTranslations("fixed");
  const tf = useTranslations("entryForm");
  const tm = useTranslations("methods");
  const { run, pending } = useRun();
  const accounts = useAccounts().data ?? [];
  const cards = useCards().data ?? [];
  const categories = useCategories().data ?? [];
  const members = useMembers().data ?? [];
  const isExpense = rec.type === "EXPENSE";

  const [amount, setAmount] = useState(rec.amount);
  const [currency, setCurrency] = useState<Currency>(rec.currency);
  const [categoryId, setCategoryId] = useState(rec.category_id);
  const [personId, setPersonId] = useState(rec.person_id);
  const [description, setDescription] = useState(rec.description ?? "");
  const [method, setMethod] = useState<PaymentMethod>(rec.payment_method);
  const [cardId, setCardId] = useState(rec.card_id ?? "");
  const [accountId, setAccountId] = useState(rec.account_id);
  const [interval, setInterval] = useState(rec.interval_months);
  const [day, setDay] = useState(rec.day_of_month);
  const [start, setStart] = useState(rec.start_date);
  const [end, setEnd] = useState(rec.end_date ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const usesCard = isExpense && CARD_METHODS.includes(method);
  const cardOptions = cards.filter(
    (c) =>
      c.is_active &&
      (method === "CREDIT" ? ["CREDIT", "CREDIT_DEBIT"] : ["DEBIT", "CREDIT_DEBIT"]).includes(
        c.type
      )
  );
  const accountOptions = accounts.filter(
    (a) => a.is_active && a.type === (method === "CASH" ? "CASH" : "BANK")
  );
  const effectiveCard =
    cardId && cardOptions.some((c) => c.id === cardId) ? cardId : (cardOptions[0]?.id ?? "");
  const effectiveAccount = accountOptions.some((a) => a.id === accountId)
    ? accountId
    : (accountOptions[0]?.id ?? "");

  // Credit card fixed expenses follow the card's due day (schemas §12.1).
  const cardDueDay =
    isExpense && method === "CREDIT"
      ? (cards.find((c) => c.id === effectiveCard)?.due_day ?? null)
      : null;

  const body: Record<string, unknown> = {};
  if (amount !== rec.amount) body.amount = amount;
  if (currency !== rec.currency) body.currency = currency;
  if (categoryId !== rec.category_id) body.category_id = categoryId;
  if (personId !== rec.person_id) body.person_id = personId;
  if (description !== (rec.description ?? "")) body.description = description || null;
  if (method !== rec.payment_method) body.payment_method = method;
  if (usesCard && effectiveCard !== rec.card_id) body.card_id = effectiveCard;
  if (!usesCard && effectiveAccount !== rec.account_id) body.account_id = effectiveAccount;
  if (interval !== rec.interval_months) body.interval_months = interval;
  if (!cardDueDay && day !== rec.day_of_month) body.day_of_month = day;
  if (start !== rec.start_date) body.start_date = start;
  if ((end || null) !== rec.end_date) body.end_date = end || null;

  const save = () =>
    run({ kind: "update", id: rec.id, body }, t("saved"), onClose).catch((error) => {
      if (error instanceof ApiError)
        setErrors(Object.fromEntries(Object.entries(error.fields).map(([k, v]) => [k, v[0]])));
    });

  return (
    <FormDialog
      open
      onOpenChange={(open) => !open && onClose()}
      title={isExpense ? t("editExpenseTitle") : t("editIncomeTitle")}
      footer={
        <Footer
          onCancel={onClose}
          pending={pending}
          disabled={Object.keys(body).length === 0}
          label={t("saveChanges")}
          onConfirm={() => void save()}
        />
      }
    >
      <div className="flex flex-col gap-5">
        <p className="flex items-start gap-2 rounded-lg bg-surface-2 px-3 py-2 text-[13px] text-text-2">
          <Info size={15} className="mt-0.5 shrink-0 text-text-muted" aria-hidden />
          {t("futureOnly")}
        </p>
        <div className="flex gap-2">
          <FieldShell label={t("amount")} required error={errors.amount} className="flex-1">
            <MoneyInput
              value={amount}
              onChange={setAmount}
              symbol={symbolOf(currency)}
              aria-label={t("amount")}
            />
          </FieldShell>
          <FieldShell label={tf("currency")}>
            <Select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as Currency)}
              className="w-24"
            >
              {CURRENCIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </Select>
          </FieldShell>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FieldShell label={tf("category")} required error={errors.category_id}>
            <CategoryPicker
              type={rec.type}
              categories={categories}
              value={categoryId}
              onChange={setCategoryId}
            />
          </FieldShell>
          <FieldShell label={isExpense ? tf("spender") : tf("receiver")} error={errors.person_id}>
            <Select value={personId} onChange={(e) => setPersonId(e.target.value)}>
              {!members.some((m) => m.id === personId) && (
                <option value={personId}>{tf("formerMember")}</option>
              )}
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {shortName(m.name)}
                </option>
              ))}
            </Select>
          </FieldShell>
          <FieldShell label={tf("description")} className="sm:col-span-2">
            <Input
              value={description}
              maxLength={200}
              onChange={(e) => setDescription(e.target.value)}
            />
          </FieldShell>
        </div>
        <fieldset className="flex flex-col gap-3 rounded-xl border border-line p-4">
          <legend className="px-1.5 text-[13px] font-medium text-text-2">{tf("payment")}</legend>
          <div role="radiogroup" aria-label={tf("method")} className="flex flex-wrap gap-1.5">
            {PAYMENT_METHODS.map((m) => (
              <button
                key={m}
                type="button"
                role="radio"
                aria-checked={method === m}
                onClick={() => setMethod(m)}
                className={cn(
                  "h-8 rounded-full border px-3 text-[13px]",
                  method === m
                    ? "border-brand bg-brand/10 font-medium text-brand"
                    : "border-line-strong text-text-2 hover:bg-surface-2"
                )}
              >
                {tm(m)}
              </button>
            ))}
          </div>
          {usesCard ? (
            <FieldShell label={tf("card")} required error={errors.card_id}>
              <Select value={effectiveCard} onChange={(e) => setCardId(e.target.value)}>
                {cardOptions.length === 0 && <option value="">—</option>}
                {cardOptions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.alias}
                  </option>
                ))}
              </Select>
            </FieldShell>
          ) : (
            <FieldShell
              label={isExpense ? tf("account") : tf("receivedIn")}
              required
              error={errors.account_id}
            >
              <Select value={effectiveAccount} onChange={(e) => setAccountId(e.target.value)}>
                {accountOptions.length === 0 && <option value="">—</option>}
                {accountOptions.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </Select>
            </FieldShell>
          )}
        </fieldset>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <FieldShell label={tf("every")}>
            <Select value={interval} onChange={(e) => setInterval(Number(e.target.value))}>
              {INTERVALS.map((n) => (
                <option key={n} value={n}>
                  {tf(`interval.${n}` as "interval.1")}
                </option>
              ))}
            </Select>
          </FieldShell>
          <FieldShell
            label={tf("onDay")}
            error={errors.day_of_month}
            hint={cardDueDay ? tf("cardDueDay") : undefined}
          >
            <Input
              type="number"
              min={1}
              max={31}
              value={cardDueDay ?? day}
              disabled={!!cardDueDay}
              onChange={(e) => setDay(Math.min(31, Math.max(1, Number(e.target.value) || 1)))}
            />
          </FieldShell>
          <FieldShell label={t("since")} error={errors.start_date}>
            <Input type="date" value={start} onChange={(e) => setStart(e.target.value)} />
          </FieldShell>
          <FieldShell
            label={tf("until")}
            error={errors.end_date}
            hint={!end ? tf("noEnd") : undefined}
          >
            <Input type="date" value={end} min={start} onChange={(e) => setEnd(e.target.value)} />
          </FieldShell>
        </div>
      </div>
    </FormDialog>
  );
}
