/**
 * Period presets and date arithmetic on "YYYY-MM-DD" strings (dashboard.md §3.1).
 * "Today" is the date in São Paulo, the same as the API's (schemas §1).
 */

export const PRESETS = [
  "this-month",
  "next-month",
  "next-3-months",
  "next-6-months",
  "this-year",
  "custom",
] as const;
export type Preset = (typeof PRESETS)[number];

export interface Range {
  from: string;
  to: string;
}

const pad = (n: number) => String(n).padStart(2, "0");

export function todayIso(): string {
  // en-CA formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
}

export function isIsoDate(value: string | null | undefined): value is string {
  return !!value && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value));
}

function parts(iso: string): [number, number, number] {
  const [y, m, d] = iso.split("-").map(Number);
  return [y, m, d];
}

function make(year: number, month: number, day: number): string {
  // Normalizes month overflow (month 13 → next year).
  const date = new Date(Date.UTC(year, month - 1, day));
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

export function firstOfMonth(iso: string, addMonths = 0): string {
  const [y, m] = parts(iso);
  return make(y, m + addMonths, 1);
}

export function lastOfMonth(iso: string, addMonths = 0): string {
  const [y, m] = parts(iso);
  return make(y, m + addMonths + 1, 0);
}

export function monthsBetween(from: string, to: string): number {
  const [fy, fm] = parts(from);
  const [ty, tm] = parts(to);
  return (ty - fy) * 12 + (tm - fm) + 1;
}

export function presetRange(preset: Exclude<Preset, "custom">, today = todayIso()): Range {
  switch (preset) {
    case "this-month":
      return { from: firstOfMonth(today), to: lastOfMonth(today) };
    case "next-month":
      return { from: firstOfMonth(today, 1), to: lastOfMonth(today, 1) };
    case "next-3-months":
      return { from: firstOfMonth(today), to: lastOfMonth(today, 2) };
    case "next-6-months":
      return { from: firstOfMonth(today), to: lastOfMonth(today, 5) };
    case "this-year":
      return { from: `${today.slice(0, 4)}-01-01`, to: `${today.slice(0, 4)}-12-31` };
  }
}

const MAX_CHART_MONTHS = 36; // api.md §13.4

/**
 * The projection chart covers at least this month and the next 5, stretched to cover the
 * selected period (dashboard.md §4.4).
 */
export function chartRange(period: Range, today = todayIso()): Range {
  const from = [firstOfMonth(period.from), firstOfMonth(today)].sort()[0];
  const to = [lastOfMonth(period.to), lastOfMonth(today, 5)].sort()[1];
  if (monthsBetween(from, to) > MAX_CHART_MONTHS) {
    return { from: firstOfMonth(to, -(MAX_CHART_MONTHS - 1)), to };
  }
  return { from, to };
}

/** Custom ranges are at most 3 years (api.md §13.1). */
export function isValidCustomRange(from: string, to: string): boolean {
  if (!isIsoDate(from) || !isIsoDate(to) || to < from) return false;
  const days = (Date.parse(to) - Date.parse(from)) / 86_400_000 + 1;
  return days <= 1096;
}
