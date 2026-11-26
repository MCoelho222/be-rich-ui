"use client";
/** Account form, Adjust balance, Card form and delete-or-archive (ui-behavior §4–§5, §11.4). */
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { FieldShell, NewAccountInline, Select } from "@/components/entries/pickers";
import { Segmented } from "@/components/preferences/Segmented";
import { FormDialog, PrimaryButton, SecondaryButton } from "@/components/ui/form-dialog";
import { Input } from "@/components/ui/input";
import { SignedMoneyInput } from "@/components/ui/money-input";
import { useCardPreview, useReferenceWrite, type CardType } from "@/lib/accounts";
import { ApiError } from "@/lib/api";
import { useMe } from "@/lib/auth";
import { CURRENCIES, type Currency } from "@/lib/entries";
import { useErrorMessage } from "@/lib/errors";
import { formatDate, formatMoney, shortName } from "@/lib/format";
import { fromCents, toCents } from "@/lib/money";
import { todayIso } from "@/lib/period";
import { useAccounts, useBalances, useMembers, type Account, type Card } from "@/lib/queries";

const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

export function symbolOf(currency: string) {
  return (
    new Intl.NumberFormat("pt-BR", { style: "currency", currency })
      .formatToParts(0)
      .find((p) => p.type === "currency")?.value ?? currency
  );
}

function fieldErrors(error: unknown): Record<string, string> {
  return error instanceof ApiError
    ? Object.fromEntries(Object.entries(error.fields).map(([k, v]) => [k, v[0]]))
    : {};
}

function Footer({
  onCancel,
  label,
  pending,
  disabled,
  onConfirm,
  danger,
}: {
  onCancel: () => void;
  label: string;
  pending: boolean;
  disabled?: boolean;
  onConfirm: () => void;
  danger?: boolean;
}) {
  const t = useTranslations("accounts");
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

// --- Account form (ui-behavior §4.2) ----------------------------------------------

export function AccountFormDialog({
  account,
  onClose,
}: {
  account?: Account;
  onClose: () => void;
}) {
  const t = useTranslations("accounts");
  const me = useMe();
  const write = useReferenceWrite("accounts");
  const errorMessage = useErrorMessage();
  const [type, setType] = useState<"BANK" | "CASH">(account?.type ?? "BANK");
  const [name, setName] = useState(account?.name ?? "");
  const [currency, setCurrency] = useState<Currency | "">(account?.currency ?? "");
  const [balance, setBalance] = useState(account?.opening_balance ?? "");
  const [date, setDate] = useState(account?.opening_balance_date ?? todayIso());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const effectiveCurrency = (currency || me.data?.household.default_currency || "BRL") as Currency;

  const save = () => {
    const values = {
      name: name.trim(),
      currency: effectiveCurrency,
      opening_balance: balance || "0.00",
      opening_balance_date: date,
    };
    const body = account
      ? Object.fromEntries(
          Object.entries(values).filter(
            ([k, v]) => v !== (account as unknown as Record<string, unknown>)[k]
          )
        )
      : { type, ...values };
    write
      .mutateAsync(account ? { kind: "update", id: account.id, body } : { kind: "create", body })
      .then(() => {
        toast.success(account ? t("saved") : t("accountCreated"));
        onClose();
      })
      .catch((error) => {
        setErrors(fieldErrors(error));
        if (!Object.keys(fieldErrors(error)).length) toast.error(errorMessage(error));
      });
  };

  return (
    <FormDialog
      open
      width="sm"
      onOpenChange={(open) => !open && onClose()}
      title={account ? t("editAccount") : t("newAccount")}
      footer={
        <Footer
          onCancel={onClose}
          pending={write.isPending}
          disabled={!name.trim() || !date}
          label={t("save")}
          onConfirm={save}
        />
      }
    >
      <div className="flex flex-col gap-4">
        {!account && (
          <FieldShell label={t("type")}>
            <Segmented<"BANK" | "CASH">
              label={t("type")}
              value={type}
              onChange={setType}
              options={[
                { value: "BANK", label: t("typeBank") },
                { value: "CASH", label: t("typeCash") },
              ]}
              className="self-start [&_button]:h-8 [&_button]:px-4 [&_button]:text-[13px]"
            />
          </FieldShell>
        )}
        <FieldShell label={t("name")} required error={errors.name} hint={t("nameHint")}>
          <Input
            autoFocus
            value={name}
            maxLength={40}
            onChange={(e) => setName(e.target.value)}
            aria-invalid={!!errors.name}
          />
        </FieldShell>
        <FieldShell label={t("currency")}>
          <Select
            value={effectiveCurrency}
            onChange={(e) => setCurrency(e.target.value as Currency)}
          >
            {CURRENCIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </Select>
        </FieldShell>
        <FieldShell label={t("openingBalance")} error={errors.opening_balance}>
          <SignedMoneyInput
            value={balance}
            onChange={setBalance}
            symbol={symbolOf(effectiveCurrency)}
            negativeLabel={t("negative")}
            aria-label={t("openingBalance")}
          />
        </FieldShell>
        <FieldShell
          label={t("balanceOn")}
          required
          error={errors.opening_balance_date}
          hint={t("balanceOnHint")}
        >
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </FieldShell>
      </div>
    </FormDialog>
  );
}

// --- Adjust balance (ui-behavior §4.3) ------------------------------------------------

export function AdjustDialog({ account, onClose }: { account: Account; onClose: () => void }) {
  const t = useTranslations("accounts");
  const write = useReferenceWrite("accounts");
  const errorMessage = useErrorMessage();
  const [date, setDate] = useState(todayIso());
  const [balance, setBalance] = useState("");
  const current = useBalances(date, { accountId: account.id });
  const shown = current.data?.accounts[0]?.balance ?? null;
  const diff = shown !== null && balance ? fromCents(toCents(balance) - toCents(shown)) : null;

  return (
    <FormDialog
      open
      width="sm"
      onOpenChange={(open) => !open && onClose()}
      title={t("adjustTitle", { name: account.name })}
      footer={
        <Footer
          onCancel={onClose}
          pending={write.isPending}
          disabled={!balance || !date}
          label={t("adjust")}
          onConfirm={() =>
            write
              .mutateAsync({ kind: "adjust", id: account.id, balance, date })
              .then(() => {
                toast.success(t("adjusted"));
                onClose();
              })
              .catch((error) => toast.error(errorMessage(error)))
          }
        />
      }
    >
      <div className="flex flex-col gap-4">
        <FieldShell label={t("realBalance")} required>
          <SignedMoneyInput
            value={balance}
            onChange={setBalance}
            symbol={symbolOf(account.currency)}
            negativeLabel={t("negative")}
            autoFocus
            aria-label={t("realBalance")}
          />
        </FieldShell>
        <FieldShell label={t("onDate")} required>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </FieldShell>
        {shown !== null && (
          <p className="rounded-lg bg-surface-2 px-3 py-2.5 text-[13px] text-text-2" role="status">
            {t("adjustShows", { amount: formatMoney(shown, account.currency) })}
            {diff !== null && (
              <>
                {" "}
                {t("adjustTo", { amount: formatMoney(balance, account.currency) })}{" "}
                <span className={toCents(diff) < 0 ? "text-negative" : "text-income"}>
                  (
                  {formatMoney(diff, account.currency, {
                    sign: toCents(diff) > 0 ? "plus" : "auto",
                  })}
                  )
                </span>
              </>
            )}
          </p>
        )}
      </div>
    </FormDialog>
  );
}

// --- Card form (ui-behavior §5) ------------------------------------------------------

export function CardFormDialog({
  card,
  onClose,
  onCreated,
}: {
  card?: Card;
  onClose: () => void;
  onCreated?: (id: string) => void;
}) {
  const t = useTranslations("accounts");
  const me = useMe();
  const members = useMembers().data ?? [];
  const accounts = (useAccounts().data ?? []).filter((a) => a.is_active && a.type === "BANK");
  const write = useReferenceWrite<Card>("cards");
  const errorMessage = useErrorMessage();
  const [ownerId, setOwnerId] = useState(card?.owner_id ?? "");
  const [alias, setAlias] = useState(card?.alias ?? "");
  const [type, setType] = useState<CardType>(card?.type ?? "CREDIT");
  const [accountId, setAccountId] = useState(card?.account_id ?? "");
  const [creatingAccount, setCreatingAccount] = useState(false);
  const [lastFour, setLastFour] = useState(card?.last_four ?? "");
  const [bestBuy, setBestBuy] = useState<number | null>(card?.best_buy_day ?? null);
  const [due, setDue] = useState<number | null>(card?.due_day ?? null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const hasCredit = type !== "DEBIT";
  const preview = useCardPreview(hasCredit ? bestBuy : null, hasCredit ? due : null);
  const effectiveOwner = ownerId || me.data?.user.id || "";
  const effectiveAccount = accountId || accounts[0]?.id || "";

  const save = () => {
    const values: Record<string, unknown> = {
      owner_id: effectiveOwner,
      alias,
      type,
      account_id: effectiveAccount,
      last_four: lastFour || null,
      best_buy_day: hasCredit ? bestBuy : null,
      due_day: hasCredit ? due : null,
    };
    const body = card
      ? Object.fromEntries(
          Object.entries(values).filter(
            ([k, v]) => v !== (card as unknown as Record<string, unknown>)[k]
          )
        )
      : values;
    write
      .mutateAsync(card ? { kind: "update", id: card.id, body } : { kind: "create", body })
      .then((saved) => {
        toast.success(card ? t("saved") : t("cardCreated"));
        if (!card && saved) onCreated?.(saved.id);
        onClose();
      })
      .catch((error) => {
        setErrors(fieldErrors(error));
        if (!Object.keys(fieldErrors(error)).length) toast.error(errorMessage(error));
      });
  };

  const valid =
    alias &&
    effectiveAccount &&
    (!hasCredit || (bestBuy && due)) &&
    (!lastFour || /^\d{4}$/.test(lastFour));

  return (
    <FormDialog
      open
      width="sm"
      onOpenChange={(open) => !open && onClose()}
      title={card ? t("editCard") : t("newCard")}
      footer={
        <Footer
          onCancel={onClose}
          pending={write.isPending}
          disabled={!valid}
          label={t("save")}
          onConfirm={save}
        />
      }
    >
      <div className="flex flex-col gap-4">
        <FieldShell label={t("cardType")}>
          <Segmented<CardType>
            label={t("cardType")}
            value={type}
            onChange={setType}
            options={[
              { value: "CREDIT", label: t("credit") },
              { value: "DEBIT", label: t("debit") },
              { value: "CREDIT_DEBIT", label: t("creditDebit") },
            ]}
            className="self-start [&_button]:h-8 [&_button]:px-3 [&_button]:text-[13px]"
          />
        </FieldShell>
        <div className="grid grid-cols-[1fr_110px] gap-3">
          <FieldShell label={t("alias")} required error={errors.alias} hint={t("aliasHint")}>
            {/* One word: spaces are blocked while typing and removed from pasted text. */}
            <Input
              autoFocus
              value={alias}
              maxLength={20}
              onChange={(e) => setAlias(e.target.value.replace(/\s+/g, ""))}
              aria-invalid={!!errors.alias}
            />
          </FieldShell>
          <FieldShell label={t("lastFour")} error={errors.last_four}>
            <Input
              inputMode="numeric"
              value={lastFour}
              maxLength={4}
              placeholder="0000"
              onChange={(e) => setLastFour(e.target.value.replace(/\D/g, "").slice(0, 4))}
            />
          </FieldShell>
        </div>
        <FieldShell label={t("owner")}>
          <Select value={effectiveOwner} onChange={(e) => setOwnerId(e.target.value)}>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {shortName(m.name)}
              </option>
            ))}
          </Select>
        </FieldShell>
        <FieldShell
          label={t("payingAccount")}
          required
          error={errors.account_id}
          hint={t("payingAccountHint")}
        >
          {creatingAccount ? (
            <NewAccountInline
              onCreated={(id) => {
                setAccountId(id);
                setCreatingAccount(false);
              }}
              onCancel={() => setCreatingAccount(false)}
            />
          ) : (
            <Select
              value={effectiveAccount}
              onChange={(e) =>
                e.target.value === "__new__"
                  ? setCreatingAccount(true)
                  : setAccountId(e.target.value)
              }
            >
              {accounts.length === 0 && <option value="">—</option>}
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
              <option value="__new__">+ {t("newAccountOption")}</option>
            </Select>
          )}
        </FieldShell>
        {hasCredit && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <FieldShell label={t("bestBuyDay")} required error={errors.best_buy_day}>
                <Select
                  value={bestBuy ?? ""}
                  onChange={(e) => setBestBuy(Number(e.target.value) || null)}
                >
                  <option value="">—</option>
                  {DAYS.map((d) => (
                    <option key={d}>{d}</option>
                  ))}
                </Select>
              </FieldShell>
              <FieldShell label={t("dueDay")} required error={errors.due_day}>
                <Select value={due ?? ""} onChange={(e) => setDue(Number(e.target.value) || null)}>
                  <option value="">—</option>
                  {DAYS.map((d) => (
                    <option key={d}>{d}</option>
                  ))}
                </Select>
              </FieldShell>
            </div>
            <p className="text-[13px] text-text-muted">{t("daysHint")}</p>
            {preview.data && (
              <p
                className="rounded-lg bg-surface-2 px-3 py-2.5 text-[13px] text-text-2"
                role="status"
              >
                {t.rich("cardPreview", {
                  date: formatDate(preview.data.payment_date),
                  b: (chunks) => <strong className="text-text">{chunks}</strong>,
                })}
              </p>
            )}
          </>
        )}
      </div>
    </FormDialog>
  );
}

// --- Delete, or archive when in use (ui-behavior §11.4) ------------------------------

export function DeleteDialog({
  resource,
  item,
  name,
  onClose,
}: {
  resource: "accounts" | "cards" | "categories";
  item: { id: string };
  name: string;
  onClose: () => void;
}) {
  const t = useTranslations("accounts");
  const write = useReferenceWrite(resource);
  const errorMessage = useErrorMessage();
  const [inUse, setInUse] = useState<Record<string, number> | null>(null);

  const act = (kind: "delete" | "archive") =>
    write
      .mutateAsync({ kind, id: item.id })
      .then(() => {
        toast.success(kind === "delete" ? t("deleted") : t("archived"));
        onClose();
      })
      .catch((error) => {
        if (error instanceof ApiError && error.code === "IN_USE") setInUse(error.usage ?? {});
        else toast.error(errorMessage(error));
      });

  return (
    <FormDialog
      open
      width="sm"
      onOpenChange={(open) => !open && onClose()}
      title={inUse ? t("inUseTitle") : t("deleteTitle", { name })}
      footer={
        inUse ? (
          <Footer
            onCancel={onClose}
            pending={write.isPending}
            label={t("archive")}
            onConfirm={() => void act("archive")}
          />
        ) : (
          <Footer
            onCancel={onClose}
            pending={write.isPending}
            danger
            label={t("delete")}
            onConfirm={() => void act("delete")}
          />
        )
      }
    >
      <p className="text-sm text-text-2">
        {inUse
          ? t(
              resource === "cards"
                ? "inUseCard"
                : resource === "categories"
                  ? "inUseCategory"
                  : "inUseAccount",
              {
                expenses: inUse.expenses ?? 0,
                incomes: inUse.incomes ?? 0,
                fixed: inUse.recurrences ?? 0,
              }
            )
          : t("deleteBody")}
      </p>
    </FormDialog>
  );
}
