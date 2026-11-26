/**
 * The projection's verdict for the household: how far ahead the balance stays positive and
 * where it bottoms out (dashboard.md §1, question 4). Shared by the balance card and the chart.
 */
import type { Projection } from "@/lib/queries";

export interface Outlook {
  /** First month whose end balance is below zero, or null. */
  negativeFrom: string | null;
  /** Last month the projection covers. */
  through: string;
  /** The month with the lowest end balance, from this month on. */
  low: { month: string; balance: string; projected: boolean };
}

/** Null when the projection has no balances from this month on (no accounts yet). */
export function projectionOutlook(data: Projection, today: string): Outlook | null {
  const thisMonth = today.slice(0, 7);
  const ahead = data.months.filter((m) => m.month >= thisMonth && m.end_balance !== null);
  if (ahead.length === 0) return null;
  // Comparison only: amounts are converted to numbers to pick the lowest, never summed.
  const low = ahead.reduce((a, b) => (Number(b.end_balance) < Number(a.end_balance) ? b : a));
  return {
    negativeFrom: data.first_negative_month,
    through: ahead[ahead.length - 1].month,
    low: { month: low.month, balance: low.end_balance!, projected: low.end_balance_projected },
  };
}
