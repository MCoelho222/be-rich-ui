/** Brazilian masks and checks for the profile form (ui-behavior §1.2, §2). Mirrors the API's app/domain/br.py. */

export const UFS =
  "AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO".split(" ");

export const digits = (value: string) => value.replace(/\D/g, "");

/** "12345678909" → "123.456.789-09", applied as the user types. */
export function maskCpf(value: string): string {
  const d = digits(value).slice(0, 11);
  return d
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d{1,2})$/, ".$1-$2");
}

/** 11 digits with valid check digits; one repeated digit is rejected. */
export function isValidCpf(value: string): boolean {
  const cpf = digits(value);
  if (!/^\d{11}$/.test(cpf) || new Set(cpf).size === 1) return false;
  for (const length of [9, 10]) {
    let total = 0;
    for (let i = 0; i < length; i++) total += Number(cpf[i]) * (length + 1 - i);
    if (((total * 10) % 11) % 10 !== Number(cpf[length])) return false;
  }
  return true;
}

/** "88303575" → "88303-575" */
export function maskCep(value: string): string {
  return digits(value)
    .slice(0, 8)
    .replace(/^(\d{5})(\d)/, "$1-$2");
}

export interface Country {
  code: string;
  dial: string;
  name: string;
}

/** The phone country selector (Brazil first, the default). Codes, not flag emoji: Windows shows flags as letters. */
export const COUNTRIES: Country[] = [
  { code: "BR", dial: "55", name: "Brasil" },
  { code: "PT", dial: "351", name: "Portugal" },
  { code: "US", dial: "1", name: "United States" },
  { code: "AR", dial: "54", name: "Argentina" },
  { code: "UY", dial: "598", name: "Uruguay" },
  { code: "ES", dial: "34", name: "España" },
  { code: "IT", dial: "39", name: "Italia" },
  { code: "DE", dial: "49", name: "Deutschland" },
  { code: "FR", dial: "33", name: "France" },
  { code: "GB", dial: "44", name: "United Kingdom" },
];

/** Splits "+5548999999999" into its country and national number (longest dial code wins). */
export function splitPhone(e164: string | null | undefined): {
  country: Country;
  national: string;
} {
  const all = digits(e164 ?? "");
  const match = [...COUNTRIES]
    .sort((a, b) => b.dial.length - a.dial.length)
    .find((c) => all.startsWith(c.dial));
  return match
    ? { country: match, national: all.slice(match.dial.length) }
    : { country: COUNTRIES[0], national: all };
}

/** Brazilian numbers are shown as (48) 99999-9999 or (48) 3333-4444; others as digits. */
export function formatNational(country: Country, national: string): string {
  const d = digits(national).slice(0, 15);
  if (country.code !== "BR") return d;
  const short = d.slice(0, 11);
  if (short.length <= 2) return short ? `(${short}` : "";
  const area = short.slice(0, 2);
  const rest = short.slice(2);
  const split = rest.length > 8 ? 5 : 4;
  return rest.length > split
    ? `(${area}) ${rest.slice(0, split)}-${rest.slice(split)}`
    : `(${area}) ${rest}`;
}
