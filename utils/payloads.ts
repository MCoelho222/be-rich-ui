import { IncomeEntry, ExpenseEntry, IncomeRead, ExpenseRead } from "@/types/entryType";

export function toSnakeCaseKeys<T extends Record<string, any>>(obj: T) {
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [
      k.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`),
      v,
    ])
  ) as any;
}

function snakeToCamel(str: string) {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

export function camelizeKeysIncome(entry: IncomeRead): IncomeEntry {
  const result: Record<string, any> = {};
  for (const key in entry) {
    const camelKey = snakeToCamel(key);
    result[camelKey] = entry[key as keyof IncomeRead];
  }
  return result as IncomeEntry;
}

export function camelizeKeysExpense(entry: ExpenseRead): ExpenseEntry {
  const result: Record<string, any> = {};
  for (const key in entry) {
    const camelKey = snakeToCamel(key);
    result[camelKey] = entry[key as keyof ExpenseRead];
  }
  return result as ExpenseEntry;
}
