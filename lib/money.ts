/**
 * Exact money arithmetic in integer cents, for the few places the UI must add amounts
 * (the split-payment "Remaining" indicator, a series total). Never floats (frontend.md §7.4).
 */

/** "1234.50" → 123450. Accepts up to 2 decimals and an optional sign. */
export function toCents(amount: string): number {
  const match = /^(-?)(\d+)(?:\.(\d{1,2}))?$/.exec(amount.trim());
  if (!match) return NaN;
  const [, sign, whole, frac = ""] = match;
  const cents = Number(whole) * 100 + Number(frac.padEnd(2, "0"));
  return sign ? -cents : cents;
}

/** 123450 → "1234.50" */
export function fromCents(cents: number): string {
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(cents);
  return `${sign}${Math.floor(abs / 100)}.${String(abs % 100).padStart(2, "0")}`;
}

export function sumCents(amounts: string[]): number {
  return amounts.reduce((total, amount) => total + toCents(amount), 0);
}
