import { Entry } from "@/types/entryType";

export function formatDate(value: Date | string) {
  const d = value instanceof Date ? value : new Date(value);
  return d.toLocaleDateString("pt-BR");
}

export function formatWeekday(value: Date | string) {
  const d = value instanceof Date ? value : new Date(value);
  return d.toLocaleDateString("en-US", { weekday: "short" });
}

export function sortEntriesByDate(entries: Entry[], desc: boolean = true): Entry[] {
  return [...entries].sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    return desc ? dateB - dateA : dateA - dateB;
  });
}

