import { IncomeCamel, ExpenseCamel } from "@/types/entryType";

type Entry = IncomeCamel | ExpenseCamel;

/**
 * Extract all values from a specific key across all entries
 *
 * @param entries - Array of entries
 * @param key - The key to extract values from
 * @returns Array of values for the specified key
 *
 * @example
 * const amounts = getValuesFromKey(entries, "amount") // [100, 50, 200, ...]
 * const sources = getValuesFromKey(entries, "source") // ["Bank", "Cash", ...]
 */
export function getValuesFromKey<T extends Entry, K extends keyof T>(entries: T[], key: K): T[K][] {
  return entries.map((entry) => entry[key]);
}

/**
 * Filter entries by exact match on a key
 */
export function filterByExactMatch<T extends Entry, K extends keyof T>(
  entries: T[],
  key: K,
  value: T[K]
): T[] {
  return entries.filter((entry) => entry[key] === value);
}

/**
 * Filter entries by date range
 */
export function filterByDateRange<T extends Entry>(
  entries: T[],
  options: {
    startDate?: Date | string;
    endDate?: Date | string;
  }
): T[] {
  const { startDate, endDate } = options;

  if (!startDate && !endDate) {
    return entries;
  }

  return entries.filter((entry) => {
    const entryDate = new Date(entry.createdAt);

    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      if (entryDate < start) return false;
    }

    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      if (entryDate > end) return false;
    }

    return true;
  });
}

/**
 * Filter entries by amount range
 */
export function filterByAmountRange<T extends Entry>(
  entries: T[],
  options: {
    minAmount?: number;
    maxAmount?: number;
  }
): T[] {
  const { minAmount, maxAmount } = options;

  return entries.filter((entry) => {
    if (minAmount !== undefined && entry.amount < minAmount) return false;
    if (maxAmount !== undefined && entry.amount > maxAmount) return false;
    return true;
  });
}

/**
 * Filter entries by text search in description
 */
export function filterByDescription<T extends Entry>(entries: T[], searchTerm: string): T[] {
  if (!searchTerm) return entries;

  const term = searchTerm.toLowerCase();
  return entries.filter(
    (entry) => entry.description && entry.description.toLowerCase().includes(term)
  );
}

/**
 * Filter entries by multiple criteria (compound filter)
 *
 * @param entries - Array of entries to filter
 * @param filters - Filter criteria
 * @param selectKeys - Optional array of keys to include in results. If true, returns only specified keys.
 * @returns Filtered entries (full objects or partial based on selectKeys)
 *
 * @example
 * // Returns full Entry objects
 * filterEntries(entries, { startDate: "2026-01-01" })
 *
 * @example
 * // Returns objects with only createdAt and amount
 * filterEntries(entries, { startDate: "2026-01-01" }, ["createdAt", "amount"])
 */
export function filterEntries<T extends Entry>(
  entries: T[],
  filters: {
    category?: ExpenseCamel["category"];
    source?: Entry["source"];
    paymentMethod?: ExpenseCamel["paymentMethod"];
    fixed?: boolean;
    minAmount?: number;
    maxAmount?: number;
    startDate?: Date | string;
    endDate?: Date | string;
    searchTerm?: string;
  },
  selectKeys?: (keyof Entry)[]
): T[] | Partial<T>[] {
  let result = entries;

  // Apply exact match filters
  if (filters.category !== undefined) {
    result = result.filter(
      (entry) => "category" in entry && entry.category === filters.category
    ) as T[];
  }
  if (filters.source !== undefined) {
    result = filterByExactMatch(result, "source", filters.source);
  }
  if (filters.paymentMethod !== undefined) {
    result = result.filter(
      (entry) => "paymentMethod" in entry && entry.paymentMethod === filters.paymentMethod
    ) as T[];
  }
  if (filters.fixed !== undefined) {
    result = filterByExactMatch(result, "fixed", filters.fixed);
  }

  // Apply range filters
  if (filters.minAmount !== undefined || filters.maxAmount !== undefined) {
    result = filterByAmountRange(result, {
      minAmount: filters.minAmount,
      maxAmount: filters.maxAmount,
    });
  }

  if (filters.startDate || filters.endDate) {
    result = filterByDateRange(result, {
      startDate: filters.startDate,
      endDate: filters.endDate,
    });
  }

  // Apply text search
  if (filters.searchTerm) {
    result = filterByDescription(result, filters.searchTerm);
  }

  // Project to selected keys if specified
  if (selectKeys && selectKeys.length > 0) {
    return result.map((entry) => {
      const projected: Partial<T> = {};
      selectKeys.forEach((key) => {
        (projected as any)[key] = entry[key as keyof T];
      });
      return projected;
    });
  }

  return result;
}

/**
 * Find all related installment entries for a given entry id
 *
 * @param id - The id of the entry to check
 * @param entries - Array of entries to search through
 * @returns Array of ids for all related installments, or just the original id if not an installment
 *
 * @example
 * // Entry with id "123" has installment "1/3"
 * // Returns ["123", "456", "789"] if all related installments are found
 * const ids = findRelatedInstallments("123", entries)
 *
 * @example
 * // Entry with id "999" has no installment field
 * // Returns ["999"]
 * const ids = findRelatedInstallments("999", entries)
 */
export function findRelatedInstallments<T extends Entry>(id: string, entries: T[]): string[] {
  // Find the entry with the given id
  const targetEntry = entries.find((entry) => entry.id === id);

  if (!targetEntry) {
    return [];
  }

  // If no installment field or it's empty, return just this id
  if (!targetEntry.installment || targetEntry.installment.trim() === "") {
    return [id];
  }

  // Parse installment field (e.g., "1/3" -> current: 1, total: 3)
  const installmentMatch = targetEntry.installment.match(/^(\d+)\/(\d+)$/);

  if (!installmentMatch) {
    // Invalid installment format, return just this id
    return [id];
  }

  const totalInstallments = parseInt(installmentMatch[2], 10);

  // Find all entries that match amount, source, and description
  const relatedEntries = entries.filter(
    (entry) =>
      entry.amount === targetEntry.amount &&
      entry.source === targetEntry.source &&
      entry.description === targetEntry.description &&
      entry.installment &&
      entry.installment.trim() !== ""
  );

  // Extract and validate all installment numbers
  const installmentMap = new Map<number, string>();

  for (const entry of relatedEntries) {
    const match = entry.installment.match(/^(\d+)\/(\d+)$/);
    if (match) {
      const currentNum = parseInt(match[1], 10);
      const total = parseInt(match[2], 10);

      // Verify the total matches
      if (total === totalInstallments) {
        installmentMap.set(currentNum, entry.id);
      }
    }
  }

  // Verify all installments from 1 to totalInstallments are present
  const allFound = Array.from({ length: totalInstallments }, (_, i) => i + 1).every((num) =>
    installmentMap.has(num)
  );

  if (!allFound) {
    // Not all installments found, return just the original id
    return [id];
  }

  // Return ids in installment order (1/3, 2/3, 3/3)
  return Array.from({ length: totalInstallments }, (_, i) => i + 1).map(
    (num) => installmentMap.get(num)!
  );
}
