"use client";
/**
 * Query keys and hooks (specs/frontend.md §7.3). Each dashboard widget has its own query,
 * so it loads, fails and retries on its own (dashboard.md §5). Every read model shares the
 * "reports" prefix: one invalidation refreshes them all after a change (dashboard.md §4.9).
 */
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, type Schemas } from "./api";

export type Account = Schemas["AccountOut"];
export type Card = Schemas["CardOut"];
export type Category = Schemas["CategoryOut"];
export type Member = Schemas["MemberOut"];
export type Recurrence = Schemas["RecurrenceOut"];
export type Balances = Schemas["BalancesOut"];
export type Summary = Schemas["SummaryOut"];
export type Projection = Schemas["ProjectionOut"];
export type CategoryBreakdown = Schemas["CategoriesOut"];
export type CardBills = Schemas["CardBillsOut"];
export type ProjectionItems = Schemas["ProjectionItemsOut"];
export type ProjectionItem = Schemas["ProjectionItemOut"];
export type Overdue = Schemas["OverdueOut"];

interface Items<T> {
  items: T[];
}

export const keys = {
  reports: ["reports"] as const,
  reference: ["reference"] as const,
};

/** Filters every read model shares (api.md §13.1). */
export interface ReportFilters {
  accountId?: string | null;
  memberId?: string | null;
}

const filterQuery = (f: ReportFilters) => ({ account_id: f.accountId, member_id: f.memberId });

// --- Reference lists (archived included: old rows still need their names) ---------------

const REFERENCE_STALE = 5 * 60_000;

export function useAccounts() {
  return useQuery({
    queryKey: [...keys.reference, "accounts"],
    queryFn: () =>
      api.get<Items<Account>>("accounts", { include_archived: true }).then((r) => r.items),
    staleTime: REFERENCE_STALE,
  });
}

export function useCards() {
  return useQuery({
    queryKey: [...keys.reference, "cards"],
    queryFn: () => api.get<Items<Card>>("cards", { include_archived: true }).then((r) => r.items),
    staleTime: REFERENCE_STALE,
  });
}

export function useCategories() {
  return useQuery({
    queryKey: [...keys.reference, "categories"],
    // The endpoint lists one type at a time (api.md §9).
    queryFn: () =>
      Promise.all(
        (["EXPENSE", "INCOME"] as const).map((type) =>
          api.get<Items<Category>>("categories", { type, include_archived: true })
        )
      ).then(([expense, income]) => [...expense.items, ...income.items]),
    staleTime: REFERENCE_STALE,
  });
}

export function useMembers() {
  return useQuery({
    queryKey: [...keys.reference, "members"],
    queryFn: () => api.get<Items<Member>>("household/members").then((r) => r.items),
    staleTime: REFERENCE_STALE,
  });
}

export function useRecurrences() {
  return useQuery({
    queryKey: [...keys.reference, "recurrences"],
    queryFn: () =>
      api.get<Items<Recurrence>>("recurrences", { status: "all" }).then((r) => r.items),
    staleTime: REFERENCE_STALE,
  });
}

/** Id → item, for name lookups in lists. */
export function byId<T extends { id: string }>(items: T[] | undefined): Map<string, T> {
  return new Map((items ?? []).map((item) => [item.id, item]));
}

// --- Read models (api.md §13) ------------------------------------------------------

export function useBalances(date: string, filters: ReportFilters) {
  return useQuery({
    queryKey: [...keys.reports, "balances", date, filters.accountId],
    queryFn: () => api.get<Balances>("balances", { date, account_id: filters.accountId }),
  });
}

export function useSummary(from: string, to: string, filters: ReportFilters) {
  return useQuery({
    queryKey: [...keys.reports, "summary", from, to, filters],
    queryFn: () => api.get<Summary>("dashboard/summary", { from, to, ...filterQuery(filters) }),
  });
}

export function useProjection(from: string, to: string, filters: ReportFilters) {
  return useQuery({
    queryKey: [...keys.reports, "projection", from, to, filters],
    queryFn: () => api.get<Projection>("projection", { from, to, ...filterQuery(filters) }),
  });
}

export function useCategoryBreakdown(
  from: string,
  to: string,
  type: "EXPENSE" | "INCOME",
  filters: ReportFilters
) {
  return useQuery({
    queryKey: [...keys.reports, "categories", from, to, type, filters],
    queryFn: () =>
      api.get<CategoryBreakdown>("dashboard/categories", {
        from,
        to,
        type,
        ...filterQuery(filters),
      }),
  });
}

export function useCardBills(filters: ReportFilters) {
  return useQuery({
    queryKey: [...keys.reports, "bills", filters],
    queryFn: () => api.get<CardBills>("cards/bills", filterQuery(filters)),
  });
}

export function useProjectionItems(
  from: string,
  to: string,
  type: "EXPENSE" | "INCOME" | null,
  filters: ReportFilters
) {
  return useInfiniteQuery({
    queryKey: [...keys.reports, "items", from, to, type, filters],
    queryFn: ({ pageParam }) =>
      api.get<ProjectionItems>("projection/items", {
        from,
        to,
        type,
        limit: 50,
        cursor: pageParam,
        ...filterQuery(filters),
      }),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.next_cursor ?? null,
  });
}

export function useOverdue() {
  return useQuery({
    queryKey: [...keys.reports, "overdue"],
    queryFn: () => api.get<Items<Overdue>>("occurrences/overdue").then((r) => r.items),
  });
}

// --- Occurrence actions (api.md §12.3) ------------------------------------------------

/** Register or skip an occurrence, then refresh everything that depends on it. */
export function useOccurrenceAction() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      action,
      recurrenceId,
      occurrenceDate,
    }: {
      action: "register" | "skip";
      recurrenceId: string;
      occurrenceDate: string;
    }) =>
      api.post(
        `recurrences/${recurrenceId}/occurrences/${occurrenceDate}/${action}`,
        action === "register" ? {} : undefined
      ),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: keys.reports });
      void client.invalidateQueries({ queryKey: [...keys.reference, "recurrences"] });
    },
  });
}
