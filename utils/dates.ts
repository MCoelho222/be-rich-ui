import { Entry, EntryRead } from "@/types/entryType";

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

export function filterEntriesByPeriod(
  entries: Entry[],
  startDate: Date | string,
  endDate: Date | string
): Entry[] {
  const start = startDate instanceof Date ? startDate : new Date(startDate);
  const end = endDate instanceof Date ? endDate : new Date(endDate);

  // Set start to beginning of day and end to end of day for inclusive filtering
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  return entries.filter((entry) => {
    const entryDate = new Date(entry.createdAt);
    return entryDate >= start && entryDate <= end;
  });
}
