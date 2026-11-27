"use client";
/** Marks a row paid on or before its account's opening balance: it doesn't move the balance. */
import { useTranslations } from "next-intl";
import { paidBeforeOpening } from "@/lib/accounts";
import { formatDate } from "@/lib/format";
import type { Account } from "@/lib/queries";

export function BeforeOpeningPill({
  paymentDate,
  account,
}: {
  paymentDate: string;
  account?: Account;
}) {
  const t = useTranslations("entries");
  if (!account || !paidBeforeOpening(paymentDate, account)) return null;
  const hint = t("beforeOpeningHint", {
    account: account.name,
    date: formatDate(account.opening_balance_date),
  });
  return (
    <span
      title={hint}
      aria-label={hint}
      className="rounded-full border border-line-strong px-2 py-px text-[11px] font-semibold whitespace-nowrap text-text-muted"
    >
      {t("beforeOpening")}
    </span>
  );
}
