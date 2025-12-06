import { Entry, EntryRead } from "@/types/entryType";

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

export function camelizeKeysShallow(entry: EntryRead): Entry {
  const result: Record<string, any> = {};
  for (const key in entry) {
    const camelKey = snakeToCamel(key);
    result[camelKey] = entry[key as keyof EntryRead];
  }
  return result as Entry;
}
