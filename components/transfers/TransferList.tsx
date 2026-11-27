"use client";
/**
 * The Entries page's Transfers tab (api.md §16): money moved between accounts and
 * investments. Neither income nor expense; deleting one undoes it.
 */
import { ArrowRight, Loader2, Trash2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { PeriodPicker } from "@/components/dashboard/FilterBar";
import { Skeleton, WidgetError } from "@/components/dashboard/Widget";
import type { EntriesView, useEntriesView } from "@/components/entries/view";
import { Select } from "@/components/entries/pickers";
import { Money } from "@/components/money/Money";
import { FormDialog, PrimaryButton, SecondaryButton } from "@/components/ui/form-dialog";
import { useErrorMessage } from "@/lib/errors";
import { formatWeekdayDate } from "@/lib/format";
import { investmentLabel, useInvestments } from "@/lib/investments";
import { byId, useAccounts } from "@/lib/queries";
import { useTransfers, useTransferWrite, type Transfer } from "@/lib/transfers";

type Update = ReturnType<typeof useEntriesView>["update"];
type End = Transfer["source"];

export function TransferList({ view, update }: { view: EntriesView; update: Update }) {
  const t = useTranslations("transfers");
  const te = useTranslations("entries");
  const locale = useLocale();
  const accountList = useAccounts().data ?? [];
  const accounts = byId(accountList);
  const investments = byId(useInvestments().data);
  const list = useTransfers({
    from: view.range.from,
    to: view.range.to,
    accountId: view.filters.account,
  });
  const [deleting, setDeleting] = useState<Transfer | null>(null);

  const name = (end: End) =>
    end.kind === "ACCOUNT"
      ? (accounts.get(end.account_id!)?.name ?? "—")
      : end.investment_id && investments.get(end.investment_id)
        ? investmentLabel(investments.get(end.investment_id)!)
        : `${end.label ?? "—"} (${t("deletedInvestment")})`;
  const route = (transfer: Transfer) => (
    <span className="flex flex-wrap items-center gap-1.5">
      <span>{name(transfer.source)}</span>
      <ArrowRight size={14} className="text-text-muted" aria-label={t("to")} />
      <span>{name(transfer.target)}</span>
    </span>
  );
  const amount = (transfer: Transfer) => (
    <span className="flex flex-col items-end">
      <Money
        amount={transfer.amount_sent}
        currency={transfer.currency_sent}
        className="font-medium"
      />
      {transfer.currency_received !== transfer.currency_sent && (
        <span className="text-xs text-text-muted">
          {t("receivedAs")}{" "}
          <Money amount={transfer.amount_received} currency={transfer.currency_received} />
        </span>
      )}
    </span>
  );
  const remove = (transfer: Transfer) => (
    <button
      type="button"
      onClick={() => setDeleting(transfer)}
      aria-label={t("delete")}
      title={t("delete")}
      className="flex size-8 items-center justify-center rounded-md text-text-muted hover:bg-surface-2 hover:text-negative"
    >
      <Trash2 size={15} aria-hidden />
    </button>
  );

  let body: React.ReactNode;
  if (list.isPending) {
    body = (
      <div className="flex flex-col gap-2">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-11 w-full" />
        ))}
      </div>
    );
  } else if (list.isError) {
    body = <WidgetError onRetry={() => void list.refetch()} />;
  } else if (list.data.length === 0) {
    body = (
      <p className="rounded-xl border border-dashed border-line-strong px-6 py-14 text-center text-sm text-text-muted">
        {t("empty")}
      </p>
    );
  } else {
    body = (
      <>
        {/* Desktop table */}
        <div className="hidden overflow-hidden rounded-xl border border-line bg-surface sm:block">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-surface-2 text-left text-xs tracking-wide text-text-muted uppercase">
                <th className="px-5 py-2.5 font-semibold">{te("col.date")}</th>
                <th className="px-3 py-2.5 font-semibold">{t("route")}</th>
                <th className="px-3 py-2.5 font-semibold">{te("col.description")}</th>
                <th className="px-3 py-2.5 text-right font-semibold">{te("col.amount")}</th>
                <th className="w-14 px-3 py-2.5" aria-label={te("col.actions")} />
              </tr>
            </thead>
            <tbody>
              {list.data.map((transfer) => (
                <tr key={transfer.id} className="border-t border-line hover:bg-surface-2/60">
                  <td className="num px-5 py-3 whitespace-nowrap text-text-muted">
                    {formatWeekdayDate(transfer.date, locale)}
                  </td>
                  <td className="px-3 py-3">{route(transfer)}</td>
                  <td className="px-3 py-3 text-text-2">{transfer.description ?? "—"}</td>
                  <td className="px-3 py-3 text-right">{amount(transfer)}</td>
                  <td className="px-3 py-3">{remove(transfer)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Phones: two-line items */}
        <ul className="flex flex-col rounded-xl border border-line bg-surface px-4 sm:hidden">
          {list.data.map((transfer) => (
            <li
              key={transfer.id}
              className="flex items-start gap-3 border-t border-line py-3 first:border-t-0"
            >
              <span className="flex min-w-0 flex-1 flex-col gap-1 text-[15px]">
                {route(transfer)}
                <span className="num text-xs text-text-muted">
                  {formatWeekdayDate(transfer.date, locale)}
                  {transfer.description ? ` · ${transfer.description}` : ""}
                </span>
              </span>
              {amount(transfer)}
              {remove(transfer)}
            </li>
          ))}
        </ul>
      </>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <PeriodPicker view={view} update={update} />
        <Select
          value={view.filters.account ?? ""}
          onChange={(e) =>
            update({ filters: { ...view.filters, account: e.target.value || undefined } })
          }
          aria-label={te("filter.account")}
          className="h-9 w-auto"
        >
          <option value="">{t("allAccounts")}</option>
          {accountList.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </Select>
      </div>
      <p className="text-[13px] text-text-muted">{t("listHint")}</p>
      {body}
      {deleting && <DeleteTransferDialog transfer={deleting} onClose={() => setDeleting(null)} />}
    </div>
  );
}

function DeleteTransferDialog({ transfer, onClose }: { transfer: Transfer; onClose: () => void }) {
  const t = useTranslations("transfers");
  const write = useTransferWrite();
  const errorMessage = useErrorMessage();
  const confirm = () =>
    write
      .mutateAsync({ kind: "delete", id: transfer.id })
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
      title={t("deleteTitle")}
      footer={
        <>
          <SecondaryButton onClick={onClose}>{t("cancel")}</SecondaryButton>
          <PrimaryButton danger disabled={write.isPending} onClick={() => void confirm()}>
            {write.isPending && <Loader2 size={16} className="animate-spin" aria-hidden />}
            {t("delete")}
          </PrimaryButton>
        </>
      }
    >
      <p className="text-sm text-text-2">{t("deleteBody")}</p>
    </FormDialog>
  );
}
