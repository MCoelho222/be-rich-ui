"use client";
/** Investments (api.md §15, schemas §20): what's invested, where, and when it can be redeemed. */
import { MoreHorizontal, PiggyBank, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { Skeleton, WidgetError } from "@/components/dashboard/Widget";
import { BigMoney } from "@/components/money/Money";
import { PageHeader } from "@/components/shell/PageHeader";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { useErrorMessage } from "@/lib/errors";
import { formatDate } from "@/lib/format";
import {
  investmentLabel,
  useInvestments,
  useInvestmentWrite,
  type Investment,
} from "@/lib/investments";
import { todayIso } from "@/lib/period";
import { useBalances } from "@/lib/queries";
import { cn } from "@/lib/utils";
import { TransferDialog } from "@/components/transfers/TransferDialog";
import { DeleteInvestmentDialog, InvestmentFormDialog } from "./forms";

type Dialog =
  | { type: "form"; investment?: Investment }
  | { type: "delete"; investment: Investment }
  | { type: "transfer"; investment: Investment };

export function InvestmentsPage() {
  const t = useTranslations("investments");
  const investments = useInvestments();
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const close = () => setDialog(null);
  const add = () => setDialog({ type: "form" });

  return (
    <>
      <PageHeader title={t("title")}>
        <button
          type="button"
          onClick={add}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-line-strong bg-surface px-3 text-sm hover:bg-surface-2"
        >
          <Plus size={15} aria-hidden />
          {t("add")}
        </button>
      </PageHeader>
      <div className="flex flex-col gap-8 px-4 pt-3 pb-10 sm:px-8">
        {investments.isPending ? (
          <>
            <Skeleton className="h-24 w-full rounded-xl" />
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-44 w-full rounded-xl" />
              ))}
            </div>
          </>
        ) : investments.isError ? (
          <WidgetError onRetry={() => void investments.refetch()} />
        ) : investments.data.length === 0 ? (
          <EmptyState onAdd={add} />
        ) : (
          <>
            <Summary investments={investments.data} />
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {investments.data.map((investment) => (
                <InvestmentTile key={investment.id} investment={investment} onAction={setDialog} />
              ))}
            </div>
          </>
        )}
      </div>

      {dialog?.type === "form" && (
        <InvestmentFormDialog investment={dialog.investment} onClose={close} />
      )}
      {dialog?.type === "transfer" && (
        <TransferDialog source={{ kind: "INVESTMENT", id: dialog.investment.id }} onClose={close} />
      )}
      {dialog?.type === "delete" && (
        <DeleteInvestmentDialog investment={dialog.investment} onClose={close} />
      )}
    </>
  );
}

/** The counted total comes from the server, converted to the household currency. */
function Summary({ investments }: { investments: Investment[] }) {
  const t = useTranslations("investments");
  const now = useBalances(todayIso(), {});
  const excluded = investments.filter((i) => !i.include_in_balance).length;
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 rounded-xl border border-line bg-surface p-5">
      <div className="flex flex-col gap-2">
        <span className="text-[13px] font-medium text-text-muted">{t("inBalance")}</span>
        {now.isPending ? (
          <Skeleton className="h-9 w-44" />
        ) : now.isError ? (
          <span className="text-sm text-text-muted">—</span>
        ) : (
          <BigMoney amount={now.data.investments} currency={now.data.currency} />
        )}
        <span className="text-[13px] text-text-muted">{t("inBalanceHint")}</span>
      </div>
      <span className="text-[13px] text-text-muted">
        {t("summary", { count: investments.length })}
        {excluded > 0 && <> · {t("excluded", { count: excluded })}</>}
      </span>
    </div>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  const t = useTranslations("investments");
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-line-strong px-6 py-14 text-center">
      <span className="flex size-11 items-center justify-center rounded-full bg-surface-2 text-text-muted">
        <PiggyBank size={22} aria-hidden />
      </span>
      <h2 className="text-base font-semibold">{t("emptyTitle")}</h2>
      <p className="max-w-sm text-sm text-text-muted">{t("emptyBody")}</p>
      <button
        type="button"
        onClick={onAdd}
        className="mt-2 inline-flex h-10 items-center gap-1.5 rounded-lg bg-brand px-4 text-sm font-semibold text-on-brand hover:bg-brand-hover"
      >
        <Plus size={16} aria-hidden />
        {t("add")}
      </button>
    </div>
  );
}

function InvestmentTile({
  investment,
  onAction,
}: {
  investment: Investment;
  onAction: (d: Dialog) => void;
}) {
  const t = useTranslations("investments");
  const write = useInvestmentWrite();
  const errorMessage = useErrorMessage();
  const label = investmentLabel(investment);
  const due = investment.maturity_date;
  const matured = due !== null && due <= todayIso();
  const redeemed = Number(investment.amount) === 0;

  const toggle = (on: boolean) =>
    write
      .mutateAsync({ kind: "update", id: investment.id, body: { include_in_balance: on } })
      .catch((error) => toast.error(errorMessage(error)));

  return (
    <article
      className={cn(
        "flex flex-col gap-3 rounded-xl border border-line bg-surface p-5",
        !investment.include_in_balance && "bg-bg"
      )}
    >
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="flex items-center gap-2 font-medium" title={label}>
            <span className="truncate">{label}</span>
            {redeemed && (
              <span className="shrink-0 rounded-full bg-surface-2 px-2 py-0.5 text-[11px] font-medium text-text-muted">
                {t("redeemed")}
              </span>
            )}
          </h3>
          <p className="truncate text-xs text-text-muted">
            {investment.name ? `${investment.bank} · ` : ""}
            {investment.currency}
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label={t("actionsFor", { name: label })}
            className="flex size-8 items-center justify-center rounded-md text-text-muted hover:bg-surface-2 hover:text-text"
          >
            <MoreHorizontal size={18} aria-hidden />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-40">
            <DropdownMenuItem onSelect={() => onAction({ type: "form", investment })}>
              {t("edit")}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onAction({ type: "transfer", investment })}>
              {t("transfer")}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => onAction({ type: "delete", investment })}
              className="text-negative"
            >
              {t("delete")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <BigMoney amount={investment.amount} currency={investment.currency} size="md" />
      <div className="flex flex-col gap-0.5 text-[13px] text-text-muted">
        <span className={cn(matured && "font-medium text-warning")}>
          {due === null
            ? t("daily")
            : matured
              ? t("matured", { date: formatDate(due) })
              : t("dueOn", { date: formatDate(due) })}
        </span>
        <span>{t("investedOn", { date: formatDate(investment.invested_on) })}</span>
      </div>
      <label className="mt-auto flex cursor-pointer items-center justify-between gap-3 border-t border-line pt-3 text-sm">
        {t("countInBalance")}
        <Switch
          checked={investment.include_in_balance}
          disabled={write.isPending}
          onCheckedChange={(on) => void toggle(on)}
        />
      </label>
    </article>
  );
}
