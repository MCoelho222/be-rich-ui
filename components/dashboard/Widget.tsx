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
  updating = false,
}: {
  title?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  padded?: boolean;
  /** Showing the previous result while new filters load: dimmed, never a skeleton flash. */
  updating?: boolean;
}) {
  return (
    <section
      aria-busy={updating}
      className={cn(
        "flex min-w-0 flex-col gap-4 rounded-xl border border-line bg-surface transition-opacity",
        padded && "p-4 sm:p-5",
        updating && "opacity-60",
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

export interface TypeTab<T extends string> {
  value: T;
  label: string;
  /** The underline follows the meaning: rose for expenses, emerald for incomes (DESIGN.md, Tabs). */
  tone: "brand" | "income" | "expense";
}

const TONE = { brand: "text-brand", income: "text-income", expense: "text-expense" };

/**
 * The Expenses / Incomes switch every widget shares: tabs with a colored underline, arrow-key
 * navigation, and a panel (`panelId`) the caller renders with `role="tabpanel"`.
 */
export function TypeTabs<T extends string>({
  label,
  value,
  options,
  onChange,
  panelId,
}: {
  label: string;
  value: T;
  options: TypeTab<T>[];
  onChange: (value: T) => void;
  panelId: string;
}) {
  const move = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const index = options.findIndex((o) => o.value === value);
    const next =
      event.key === "ArrowRight"
        ? (index + 1) % options.length
        : event.key === "ArrowLeft"
          ? (index - 1 + options.length) % options.length
          : event.key === "Home"
            ? 0
            : event.key === "End"
              ? options.length - 1
              : null;
    if (next === null) return;
    event.preventDefault();
    onChange(options[next].value);
    document.getElementById(tabId(panelId, options[next].value))?.focus();
  };
  return (
    <div role="tablist" aria-label={label} className="flex gap-1" onKeyDown={move}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            id={tabId(panelId, option.value)}
            type="button"
            role="tab"
            aria-selected={active}
            aria-controls={panelId}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(option.value)}
            className={cn(
              "h-10 rounded-sm px-2 text-[13px] font-medium transition-colors sm:h-8",
              active
                ? cn(TONE[option.tone], "shadow-[inset_0_-2px_0_currentColor]")
                : "text-text-muted hover:text-text"
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export function tabId(panelId: string, value: string) {
  return `${panelId}-tab-${value}`;
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
        className="-my-2 inline-flex h-10 items-center gap-1.5 font-medium hover:underline sm:h-8"
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
