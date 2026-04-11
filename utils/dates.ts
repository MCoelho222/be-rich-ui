import { IncomeCamel, ExpenseCamel } from "@/types/entryType";

export function formatDate(value: Date | string) {
  const d = value instanceof Date ? value : new Date(value);
  return d.toLocaleDateString("pt-BR");
}

export function formatWeekday(value: Date | string) {
  const d = value instanceof Date ? value : new Date(value);
  return d.toLocaleDateString("en-US", { weekday: "short" });
}

export function sortEntriesByDate(entries: IncomeCamel[] | ExpenseCamel[], desc: boolean = true): IncomeCamel[] | ExpenseCamel[] {
  return [...entries].sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    return desc ? dateB - dateA : dateA - dateB;
  });
}

export const getFisrtDayDateString = () => {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  const firstDayString = firstDay.toISOString().split('T')[0];

  return firstDayString
}

export const getLastDayDateString = () => {
  const now = new Date();
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const lastDayString = lastDay.toISOString().split('T')[0];

  return lastDayString
}