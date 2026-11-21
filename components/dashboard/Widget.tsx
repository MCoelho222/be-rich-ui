"use client";
/** The card every widget sits in, with its loading and error states (dashboard.md §4.9). */
import { AlertTriangle, RotateCw } from "lucide-react";
import { useTranslations } from "next-intl";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

export function WidgetCard({
  title,
  actions,
  children,
  className,
  padded = true,
}: {
  title?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <section
      className={cn(
        "flex min-w-0 flex-col gap-4 rounded-xl border border-line bg-surface",
        padded && "p-4 sm:p-5",
        className
      )}
    >
      {(title || actions) && (
        <div className={cn("flex flex-wrap items-center gap-3", !padded && "px-4 pt-4 sm:px-5")}>
          {title && <h2 className="flex-1 text-base font-semibold">{title}</h2>}
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn("animate-pulse rounded-md bg-surface-2", className)} />;
}

export function WidgetError({ onRetry }: { onRetry: () => void }) {
  const t = useTranslations("dashboard");
  return (
    <div
      role="alert"
      className="flex flex-wrap items-center gap-3 rounded-lg bg-negative-soft px-3 py-2.5 text-sm text-negative"
    >
      <AlertTriangle size={16} aria-hidden />
      <span className="flex-1">{t("loadError")}</span>
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex items-center gap-1.5 font-medium hover:underline"
      >
        <RotateCw size={14} aria-hidden />
        {t("retry")}
      </button>
    </div>
  );
}

interface Converted {
  currency: string;
  rates_as_of?: string | null;
  unconverted: { currency: string; amount: string }[];
}

/** Footnote and warning about converted totals (ui-behavior §1.7). Renders nothing when no conversion happened. */
export function CurrencyNote({ data }: { data: Converted | undefined }) {
  const t = useTranslations("dashboard");
  if (!data) return null;
  const missing = [...new Set(data.unconverted.map((u) => u.currency))];
  return (
    <>
      {missing.length > 0 && (
        <p
          role="status"
          className="flex items-start gap-2 rounded-lg bg-warning-soft px-3 py-2 text-[13px] text-warning"
        >
          <AlertTriangle size={15} className="mt-px shrink-0" aria-hidden />
          {t("unconverted", { currencies: missing.join(", ") })}
        </p>
      )}
      {data.rates_as_of && (
        <p className="text-xs text-text-muted">
          {t("converted", { currency: data.currency, date: formatDate(data.rates_as_of) })}
        </p>
      )}
    </>
  );
}
