"use client";
/**
 * Currency input with pt-BR separators (ui-behavior §6.1). The user types digits only and
 * they fill from the cents: "3", "30", "300", "3000" → "0,03", "0,30", "3,00", "30,00".
 * The value is the API's decimal string ("30.00"), or "" when empty.
 */
import { forwardRef, useState } from "react";
import { fromCents, toCents } from "@/lib/money";
import { cn } from "@/lib/utils";

const MAX_DIGITS = 12; // up to 9.999.999.999,99 (decimal(12,2))

function display(value: string): string {
  if (!value) return "";
  const cents = toCents(value);
  if (Number.isNaN(cents)) return "";
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

interface MoneyInputProps
  extends Omit<React.ComponentProps<"input">, "value" | "onChange" | "size"> {
  value: string;
  onChange: (value: string) => void;
  symbol?: string;
  size?: "md" | "lg";
}

export const MoneyInput = forwardRef<HTMLInputElement, MoneyInputProps>(function MoneyInput(
  { value, onChange, symbol = "R$", size = "md", className, ...props },
  ref
) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-lg border border-line-strong bg-surface-2 px-3 transition-[box-shadow,border-color]",
        "focus-within:border-brand focus-within:shadow-[0_0_0_3px_var(--ring-color)]",
        "has-[[aria-invalid=true]]:border-negative",
        size === "lg" ? "h-14" : "h-10",
        className
      )}
    >
      <span className={cn("text-text-muted", size === "lg" ? "text-lg" : "text-sm")}>{symbol}</span>
      <input
        ref={ref}
        inputMode="numeric"
        autoComplete="off"
        value={display(value)}
        placeholder="0,00"
        onChange={(event) => {
          const digits = event.target.value
            .replace(/\D/g, "")
            .replace(/^0+/, "")
            .slice(0, MAX_DIGITS);
          onChange(digits ? fromCents(Number(digits)) : "");
        }}
        className={cn(
          "num min-w-0 flex-1 bg-transparent text-text outline-none placeholder:text-text-faint",
          size === "lg" ? "text-[28px] font-semibold tracking-tight" : "text-[15px]"
        )}
        {...props}
      />
    </div>
  );
});

/** A money input that also accepts negative values, with a −/+ toggle (ui-behavior §4.2). */
export function SignedMoneyInput({
  value,
  onChange,
  symbol,
  negativeLabel,
  ...props
}: Omit<MoneyInputProps, "value" | "onChange"> & {
  value: string;
  onChange: (value: string) => void;
  /** Accessible name of the sign toggle. */
  negativeLabel: string;
}) {
  // The sign is its own state: it must survive while the amount is still empty.
  const [negative, setNegative] = useState(value.startsWith("-"));
  const magnitude = value.startsWith("-") ? value.slice(1) : value;
  const emit = (next: string, isNegative: boolean) => {
    setNegative(isNegative);
    onChange(next && isNegative ? `-${next}` : next);
  };
  return (
    <div className="flex gap-2">
      <button
        type="button"
        aria-pressed={negative}
        aria-label={negativeLabel}
        title={negativeLabel}
        onClick={() => emit(magnitude, !negative)}
        className={cn(
          "h-10 w-10 shrink-0 rounded-lg border text-lg font-semibold",
          negative
            ? "border-negative text-negative"
            : "border-line-strong text-text-muted hover:text-text"
        )}
      >
        {negative ? "−" : "+"}
      </button>
      <MoneyInput
        value={magnitude}
        onChange={(next) => emit(next, negative)}
        symbol={symbol}
        className="flex-1"
        {...props}
      />
    </div>
  );
}
