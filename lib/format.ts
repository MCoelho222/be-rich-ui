/**
 * Display formats (ui-behavior.md §1.1). Numbers and dates are Brazilian in both
 * languages; only words (month and weekday names) follow the language (frontend.md §2).
 *
 * Money arrives from the API as decimal strings ("1234.50"). It's converted to a number
 * only to format it for display: the UI never does money arithmetic (frontend.md §7.4).
 */

const MINUS = "−";
const moneyFormats = new Map<string, Intl.NumberFormat>();

function moneyFormat(currency: string): Intl.NumberFormat {
  let format = moneyFormats.get(currency);
  if (!format) {
    format = new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
    });
    moneyFormats.set(currency, format);
  }
  return format;
}

export interface MoneyOptions {
  /** Prefix "~" for projected amounts. */
  projected?: boolean;
  /** "+" for positive amounts (incomes in lists), "−" for expenses. */
  sign?: "auto" | "plus" | "minus";
}

/** "1234.5" → "R$ 1.234,50"; negatives use a real minus sign: "−R$ 320,00". */
export function formatMoney(
  amount: string | number,
  currency = "BRL",
  options: MoneyOptions = {}
): string {
  const value = Number(amount);
  const body = moneyFormat(currency).format(Math.abs(value)).replace(/ /g, " ");
  let sign = "";
  if (options.sign === "plus" && value !== 0) sign = "+";
  else if (options.sign === "minus" && value !== 0) sign = MINUS;
  else if (value < 0) sign = MINUS;
  // A thin space keeps "~" and "−" from reading as "~~" at small sizes.
  const tilde = options.projected ? (sign ? "~\u2009" : "~") : "";
  return `${tilde}${sign}${body}`;
}

/** Parts for the big-number style: "R$", "5.800", ",00" (frontend.md §1.3). */
export function moneyParts(amount: string | number, currency = "BRL") {
  const value = Number(amount);
  const parts = moneyFormat(currency).formatToParts(Math.abs(value));
  const symbol = parts.find((p) => p.type === "currency")?.value ?? "";
  const integer = parts
    .filter((p) => p.type === "integer" || p.type === "group")
    .map((p) => p.value)
    .join("");
  const fraction = parts.find((p) => p.type === "fraction")?.value ?? "00";
  return { negative: value < 0, symbol, integer, cents: `,${fraction}` };
}

/** "R$ 5,8 mil"-style compact values for chart axes. */
export function formatCompact(value: number, locale: string): string {
  return new Intl.NumberFormat(locale === "pt" ? "pt-BR" : "en", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

// --- Dates (always "YYYY-MM-DD" strings from the API; no time zones) ---------------

function toUtcDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d ?? 1));
}

const stripDot = (s: string) => s.replace(/\.$/, "");

/** "2026-12-05" → "05/12/2026" */
export function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

/** "2026-12-05" → "05/12" */
export function formatDayMonth(iso: string): string {
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
}

/** "2026-12-05" → "Sat, 05/12" or "sáb, 05/12" (lists). */
export function formatWeekdayDate(iso: string, locale: string): string {
  const weekday = new Intl.DateTimeFormat(locale === "pt" ? "pt-BR" : "en", {
    weekday: "short",
    timeZone: "UTC",
  }).format(toUtcDate(iso));
  return `${stripDot(weekday)}, ${formatDayMonth(iso)}`;
}

/** Month name only: "2026-11" → "Nov" / "nov". */
export function formatMonthShort(yearMonth: string, locale: string): string {
  const name = new Intl.DateTimeFormat(locale === "pt" ? "pt-BR" : "en", {
    month: "short",
    timeZone: "UTC",
  }).format(toUtcDate(`${yearMonth}-01`));
  return stripDot(name);
}

/** "2026-11" → "Nov/2026" / "nov/2026" */
export function formatMonth(yearMonth: string, locale: string): string {
  return `${formatMonthShort(yearMonth, locale)}/${yearMonth.slice(0, 4)}`;
}

// --- People ----------------------------------------------------------------------------

/** "Marcelo Coelho" → "Marcelo C."; a one-word name stays as is. */
export function shortName(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length < 2) return parts[0] ?? "";
  return `${parts[0]} ${parts[parts.length - 1][0]?.toUpperCase()}.`;
}

export function initial(name: string): string {
  return name.trim()[0]?.toUpperCase() ?? "?";
}

/** "0.4210" → "42%" */
export function formatShare(share: string | null | undefined): string {
  if (share === null || share === undefined) return "—";
  return `${Math.round(Number(share) * 100)}%`;
}
