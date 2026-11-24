/**
 * Credit card statements (schemas §10.3), mirroring the API's app/domain/credit.py. Used to
 * place a credit card fixed expense on its bills (schemas §12.1): its occurrences are the
 * card's due dates, and a payment is registered with a purchase date inside that bill.
 * Dates are ISO strings (YYYY-MM-DD); "nominal" means before the business-day shift.
 */

interface Cycle {
  best_buy_day: number | null;
  due_day: number | null;
}

const pad = (n: number) => String(n).padStart(2, "0");

function clamp(year: number, month: number, day: number): string {
  const last = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return `${year}-${pad(month)}-${pad(Math.min(day, last))}`;
}

function shift(year: number, month: number, months: number): [number, number] {
  const index = year * 12 + (month - 1) + months;
  return [Math.floor(index / 12), (index % 12) + 1];
}

function parts(iso: string): [number, number, number] {
  const [y, m, d] = iso.split("-").map(Number);
  return [y, m, d];
}

function dayBefore(iso: string): string {
  const [y, m, d] = parts(iso);
  const date = new Date(Date.UTC(y, m - 1, d - 1));
  return date.toISOString().slice(0, 10);
}

function closingIn(year: number, month: number, cycle: Required<{ [K in keyof Cycle]: number }>) {
  const closing = clamp(year, month, cycle.best_buy_day);
  const [dy, dm] = cycle.due_day > cycle.best_buy_day ? [year, month] : shift(year, month, 1);
  return { closing, due: clamp(dy, dm, cycle.due_day) };
}

function complete(card: Cycle) {
  return card.best_buy_day && card.due_day
    ? { best_buy_day: card.best_buy_day, due_day: card.due_day }
    : null;
}

/** A purchase date inside the bill due on `due`: today while it is open, else its nearest day. */
export function purchaseDateFor(due: string, card: Cycle, today: string): string | null {
  const cycle = complete(card);
  if (!cycle) return null;
  const [y, m] = parts(due);
  const [cy, cm] = cycle.due_day > cycle.best_buy_day ? [y, m] : shift(y, m, -1);
  const { closing } = closingIn(cy, cm, cycle);
  const [py, pm] = shift(cy, cm, -1);
  const first = clamp(py, pm, cycle.best_buy_day);
  const last = dayBefore(closing);
  return today < first ? first : today > last ? last : today;
}
