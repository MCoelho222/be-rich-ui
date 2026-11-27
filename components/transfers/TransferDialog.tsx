"use client";
/**
 * Move money from an account or investment to another account or investment
 * (api.md §16, schemas §21). Opened from a card's ⋯ menu, so the source is fixed.
 */
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { symbolOf } from "@/components/accounts/forms";
import { FieldShell, Select } from "@/components/entries/pickers";
import { FormDialog, PrimaryButton, SecondaryButton } from "@/components/ui/form-dialog";
import { Input } from "@/components/ui/input";
import { MoneyInput } from "@/components/ui/money-input";
import { ApiError } from "@/lib/api";
import { useErrorMessage } from "@/lib/errors";
import { formatMoney } from "@/lib/format";
import { investmentLabel, useInvestments } from "@/lib/investments";
import { todayIso } from "@/lib/period";
import { useAccounts } from "@/lib/queries";
import { useTransferWrite, type TransferEndRef } from "@/lib/transfers";

interface EndOption extends TransferEndRef {
  label: string;
  currency: string;
  /** What an investment holds; accounts have no limit here. */
  available?: string;
}

const keyOf = (end: TransferEndRef) => `${end.kind}:${end.id}`;

function useEnds(): EndOption[] {
  const accounts = useAccounts().data ?? [];
  const investments = useInvestments().data ?? [];
  return [
    ...accounts
      .filter((a) => a.is_active)
      .map((a) => ({ kind: "ACCOUNT" as const, id: a.id, label: a.name, currency: a.currency })),
    ...investments.map((i) => ({
      kind: "INVESTMENT" as const,
      id: i.id,
      label: investmentLabel(i),
      currency: i.currency,
      available: i.amount,
    })),
  ];
}

export function TransferDialog({
  source,
  onClose,
}: {
  source: TransferEndRef;
  onClose: () => void;
}) {
  const t = useTranslations("transfers");
  const write = useTransferWrite();
  const errorMessage = useErrorMessage();
  const ends = useEnds();
  const from = ends.find((e) => keyOf(e) === keyOf(source));
  const targets = ends.filter((e) => keyOf(e) !== keyOf(source));
  const [form, setForm] = useState({
    target: "",
    amount: "",
    received: "",
    date: todayIso(),
    description: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const set = (key: keyof typeof form) => (value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const to = targets.find((e) => keyOf(e) === form.target);
  const exchange = !!from && !!to && from.currency !== to.currency;
  const ready =
    !!from &&
    !!to &&
    Number(form.amount) > 0 &&
    (!exchange || Number(form.received) > 0) &&
    !!form.date;

  const save = () => {
    if (!from || !to) return;
    write
      .mutateAsync({
        kind: "create",
        body: {
          source: { kind: from.kind, id: from.id },
          target: { kind: to.kind, id: to.id },
          amount: form.amount,
          ...(exchange ? { amount_received: form.received } : {}),
          date: form.date,
          description: form.description.trim() || null,
        },
      })
      .then(() => {
        toast.success(t("created"));
        onClose();
      })
      .catch((error) => {
        const fields =
          error instanceof ApiError
            ? Object.fromEntries(Object.entries(error.fields).map(([k, v]) => [k, v[0]]))
            : {};
        setErrors(fields);
        if (!Object.keys(fields).length) toast.error(errorMessage(error));
      });
  };

  const option = (e: EndOption) => (
    <option key={keyOf(e)} value={keyOf(e)}>
      {e.label} ({e.currency})
    </option>
  );

  return (
    <FormDialog
      open
      width="sm"
      onOpenChange={(open) => !open && onClose()}
      title={t("title")}
      description={from ? t("from", { name: from.label }) : undefined}
      footer={
        <>
          <SecondaryButton onClick={onClose}>{t("cancel")}</SecondaryButton>
          <PrimaryButton disabled={write.isPending || !ready} onClick={save}>
            {write.isPending && <Loader2 size={16} className="animate-spin" aria-hidden />}
            {t("submit")}
          </PrimaryButton>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <FieldShell label={t("to")} required error={errors.target}>
          <Select
            autoFocus
            value={form.target}
            onChange={(e) => set("target")(e.target.value)}
            invalid={!!errors.target}
          >
            <option value="" disabled>
              {t("pick")}
            </option>
            <optgroup label={t("accounts")}>
              {targets.filter((e) => e.kind === "ACCOUNT").map(option)}
            </optgroup>
            {targets.some((e) => e.kind === "INVESTMENT") && (
              <optgroup label={t("investments")}>
                {targets.filter((e) => e.kind === "INVESTMENT").map(option)}
              </optgroup>
            )}
          </Select>
        </FieldShell>
        <FieldShell
          label={exchange ? t("amountSent") : t("amount")}
          required
          error={errors.amount}
          hint={
            from?.available !== undefined
              ? t("available", { amount: formatMoney(from.available, from.currency) })
              : undefined
          }
        >
          <MoneyInput
            value={form.amount}
            onChange={set("amount")}
            symbol={symbolOf(from?.currency ?? "BRL")}
            aria-invalid={!!errors.amount}
          />
        </FieldShell>
        {exchange && to && (
          <FieldShell
            label={t("amountReceived")}
            required
            error={errors.amount_received}
            hint={t("receivedHint", { currency: to.currency })}
          >
            <MoneyInput
              value={form.received}
              onChange={set("received")}
              symbol={symbolOf(to.currency)}
              aria-invalid={!!errors.amount_received}
            />
          </FieldShell>
        )}
        <FieldShell label={t("date")} required error={errors.date}>
          <Input
            type="date"
            value={form.date}
            max={todayIso()}
            onChange={(e) => set("date")(e.target.value)}
            aria-invalid={!!errors.date}
          />
        </FieldShell>
        <FieldShell label={t("description")} error={errors.description}>
          <Input
            value={form.description}
            maxLength={200}
            onChange={(e) => set("description")(e.target.value)}
          />
        </FieldShell>
      </div>
    </FormDialog>
  );
}
