"use client";
/** "Accounts R$ X · Investments R$ Y" under a total that includes investments (schemas §20.1). */
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Money } from "@/components/money/Money";
import { fromCents, toCents } from "@/lib/money";
import { cn } from "@/lib/utils";

export function BalanceSplit({
  total,
  investments,
  currency,
  className,
}: {
  total: string;
  investments: string;
  currency: string;
  className?: string;
}) {
  const t = useTranslations("dashboard.cards");
  if (toCents(investments) === 0) return null;
  const accounts = fromCents(toCents(total) - toCents(investments));
  return (
    <span className={cn("flex flex-wrap gap-x-1.5 text-[13px] text-text-muted", className)}>
      <span>
        {t.rich("accountsPart", {
          amount: () => <Money amount={accounts} currency={currency} className="text-text-2" />,
        })}
      </span>
      <span aria-hidden>·</span>
      <Link href="/investments" className="hover:text-text hover:underline">
        {t.rich("investmentsPart", {
          amount: () => <Money amount={investments} currency={currency} className="text-text-2" />,
        })}
      </Link>
    </span>
  );
}
