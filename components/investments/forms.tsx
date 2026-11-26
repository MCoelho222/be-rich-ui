"use client";
/** Investment form and delete confirmation (api.md §15). */
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { symbolOf } from "@/components/accounts/forms";
import { FieldShell, Select } from "@/components/entries/pickers";
import { Segmented } from "@/components/preferences/Segmented";
import { FormDialog, PrimaryButton, SecondaryButton } from "@/components/ui/form-dialog";
import { Input } from "@/components/ui/input";
import { MoneyInput } from "@/components/ui/money-input";
import { Switch } from "@/components/ui/switch";
import { ApiError } from "@/lib/api";
import { useMe } from "@/lib/auth";
import { CURRENCIES, type Currency } from "@/lib/entries";
import { useErrorMessage } from "@/lib/errors";
import {
  investmentLabel,
  useInvestmentWrite,
  type Investment,
  type Liquidity,
} from "@/lib/investments";
import { todayIso } from "@/lib/period";

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
  const t = useTranslations("investments");
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

export function InvestmentFormDialog({
  investment,
  onClose,
}: {
  investment?: Investment;
  onClose: () => void;
}) {
  const t = useTranslations("investments");
  const me = useMe();
  const write = useInvestmentWrite();
  const errorMessage = useErrorMessage();
  const [form, setForm] = useState({
    name: investment?.name ?? "",
    bank: investment?.bank ?? "",
    amount: investment?.amount ?? "",
    currency: (investment?.currency ?? "") as Currency | "",
    invested_on: investment?.invested_on ?? todayIso(),
    liquidity: (investment?.liquidity ?? "DAILY") as Liquidity,
    maturity_date: investment?.maturity_date ?? "",
    include_in_balance: investment?.include_in_balance ?? true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const set =
    <K extends keyof typeof form>(key: K) =>
    (value: (typeof form)[K]) =>
      setForm((f) => ({ ...f, [key]: value }));
  const currency = (form.currency || me.data?.household.default_currency || "BRL") as Currency;
  const maturity = form.liquidity === "MATURITY";
  const ready =
    form.bank.trim() &&
    Number(form.amount) > 0 &&
    form.invested_on &&
    (!maturity || form.maturity_date);

  const save = () => {
    if (maturity && form.maturity_date <= form.invested_on) {
      setErrors({ maturity_date: t("maturityAfter") });
      return;
    }
    const values: Record<string, unknown> = {
      name: form.name.trim() || null,
      bank: form.bank.trim(),
      amount: form.amount,
      currency,
      invested_on: form.invested_on,
      liquidity: form.liquidity,
      maturity_date: maturity ? form.maturity_date : null,
      include_in_balance: form.include_in_balance,
    };
    const body = investment
      ? Object.fromEntries(
          Object.entries(values).filter(
            ([k, v]) => v !== (investment as unknown as Record<string, unknown>)[k]
          )
        )
      : values;
    write
      .mutateAsync(
        investment ? { kind: "update", id: investment.id, body } : { kind: "create", body }
      )
      .then(() => {
        toast.success(investment ? t("saved") : t("created"));
        onClose();
      })
      .catch((error) => {
        const fields = fieldErrors(error);
        setErrors(fields);
        if (!Object.keys(fields).length) toast.error(errorMessage(error));
      });
  };

  return (
    <FormDialog
      open
      width="sm"
      onOpenChange={(open) => !open && onClose()}
      title={investment ? t("editTitle") : t("new")}
      footer={
        <Footer
          onCancel={onClose}
          pending={write.isPending}
          disabled={!ready}
          label={t("save")}
          onConfirm={save}
        />
      }
    >
      <div className="flex flex-col gap-4">
        <FieldShell label={t("bank")} required error={errors.bank} hint={t("bankHint")}>
          <Input
            autoFocus
            value={form.bank}
            maxLength={40}
            onChange={(e) => set("bank")(e.target.value)}
            aria-invalid={!!errors.bank}
          />
        </FieldShell>
        <FieldShell label={t("name")} error={errors.name} hint={t("nameHint")}>
          <Input value={form.name} maxLength={40} onChange={(e) => set("name")(e.target.value)} />
        </FieldShell>
        <div className="grid grid-cols-[1fr_auto] gap-3">
          <FieldShell label={t("amount")} required error={errors.amount} hint={t("amountHint")}>
            <MoneyInput
              value={form.amount}
              onChange={set("amount")}
              symbol={symbolOf(currency)}
              aria-invalid={!!errors.amount}
            />
          </FieldShell>
          <FieldShell label={t("currency")}>
            <Select value={currency} onChange={(e) => set("currency")(e.target.value as Currency)}>
              {CURRENCIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </Select>
          </FieldShell>
        </div>
        <FieldShell label={t("investedDate")} required error={errors.invested_on}>
          <Input
            type="date"
            value={form.invested_on}
            onChange={(e) => set("invested_on")(e.target.value)}
          />
        </FieldShell>
        <FieldShell label={t("liquidity")}>
          <Segmented<Liquidity>
            label={t("liquidity")}
            value={form.liquidity}
            onChange={set("liquidity")}
            options={[
              { value: "DAILY", label: t("liquidityDaily") },
              { value: "MATURITY", label: t("liquidityMaturity") },
            ]}
            className="self-start [&_button]:h-8 [&_button]:px-4 [&_button]:text-[13px]"
          />
        </FieldShell>
        {maturity && (
          <FieldShell label={t("maturityDate")} required error={errors.maturity_date}>
            <Input
              type="date"
              value={form.maturity_date}
              min={form.invested_on}
              onChange={(e) => set("maturity_date")(e.target.value)}
              aria-invalid={!!errors.maturity_date}
            />
          </FieldShell>
        )}
        <label className="flex cursor-pointer items-start gap-3">
          <Switch
            className="mt-0.5"
            checked={form.include_in_balance}
            onCheckedChange={set("include_in_balance")}
          />
          <span className="flex flex-col">
            <span className="text-sm font-medium">{t("countInBalance")}</span>
            <span className="text-[13px] text-text-muted">{t("includeHint")}</span>
          </span>
        </label>
      </div>
    </FormDialog>
  );
}

export function DeleteInvestmentDialog({
  investment,
  onClose,
}: {
  investment: Investment;
  onClose: () => void;
}) {
  const t = useTranslations("investments");
  const write = useInvestmentWrite();
  const errorMessage = useErrorMessage();
  const remove = () =>
    write
      .mutateAsync({ kind: "delete", id: investment.id })
      .then(() => {
        toast.success(t("deleted"));
        onClose();
      })
      .catch((error) => toast.error(errorMessage(error)));

  return (
    <FormDialog
      open
      width="sm"
      onOpenChange={(open) => !open && onClose()}
      title={t("deleteTitle", { name: investmentLabel(investment) })}
      footer={
        <Footer
          onCancel={onClose}
          pending={write.isPending}
          danger
          label={t("delete")}
          onConfirm={() => void remove()}
        />
      }
    >
      <p className="text-sm text-text-2">{t("deleteBody")}</p>
    </FormDialog>
  );
}
