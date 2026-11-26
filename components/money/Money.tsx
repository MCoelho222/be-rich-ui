/** Money display (ui-behavior §1.1, frontend.md §1.3). */
import { formatMoney, moneyParts, type MoneyOptions } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Inline amount. Projected amounts are "~", italic and muted. */
export function Money({
  amount,
  currency = "BRL",
  className,
  ...options
}: { amount: string | number; currency?: string; className?: string } & MoneyOptions) {
  return (
    <span
      className={cn("num whitespace-nowrap", options.projected && "text-text-2 italic", className)}
    >
      {formatMoney(amount, currency, options)}
    </span>
  );
}

/**
 * The big number: a large integer part with small cents. Projected amounts keep the
 * projected treatment at any size: "~", italic, muted (DESIGN.md, Big money figure).
 */
export function BigMoney({
  amount,
  currency = "BRL",
  tone = "default",
  size = "lg",
  projected = false,
}: {
  amount: string | number;
  currency?: string;
  tone?: "default" | "income" | "expense";
  size?: "md" | "lg";
  projected?: boolean;
}) {
  const { negative, symbol, integer, cents } = moneyParts(amount, currency);
  const color = projected
    ? "text-text-2 italic"
    : negative
      ? "text-negative"
      : tone === "income"
        ? "text-income"
        : tone === "expense"
          ? "text-expense"
          : "text-text";
  return (
    <span className={cn("num inline-flex items-baseline", color)}>
      <span
        className={cn(
          "mr-1 opacity-80",
          size === "lg" ? "text-[15px]" : "text-sm",
          tone === "default" && !negative && !projected && "text-text-muted"
        )}
      >
        {projected ? "~ " : ""}
        {negative ? "−" : ""}
        {symbol}
      </span>
      <span
        className={cn(
          "leading-none font-semibold tracking-tight",
          size === "lg" ? "text-[32px] sm:text-[36px]" : "text-[26px]"
        )}
      >
        {integer}
      </span>
      <span
        className={cn(
          size === "lg" ? "text-base" : "text-sm",
          tone === "default" && !negative && "text-text-2"
        )}
      >
        {cents}
      </span>
    </span>
  );
}
