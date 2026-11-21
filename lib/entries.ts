"use client";
/** Expenses and incomes: list, preview, create, update, delete (api.md §10–§12). */
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, type Schemas } from "./api";
import { keys } from "./queries";

export type EntryKind = "expense" | "income";
export type Expense = Schemas["ExpenseOut"];
export type Income = Schemas["IncomeOut"];
export type Entry = Expense | Income;
export type PaymentMethod = Expense["payment_method"];
export type Currency = Expense["currency"];
export type Scope = "THIS" | "THIS_AND_FOLLOWING" | "ALL";
export type PlannedRow = Schemas["PlannedRowOut"];
export type Preview = Schemas["PreviewOut"];

export const PAYMENT_METHODS: PaymentMethod[] = [
  "CASH",
  "PIX",
  "CREDIT",
  "DEBIT",
  "BOLETO",
  "BANK_TRANSFER",
];
export const CURRENCIES: Currency[] = ["BRL", "USD", "EUR"];
export const CARD_METHODS: PaymentMethod[] = ["CREDIT", "DEBIT"];

export const path = (kind: EntryKind) => (kind === "expense" ? "expenses" : "incomes");
export const personField = (kind: EntryKind) => (kind === "expense" ? "spender_id" : "receiver_id");
export const personOf = (entry: Entry) =>
  "spender_id" in entry ? entry.spender_id : entry.receiver_id;
export const cardOf = (entry: Entry) => ("card_id" in entry ? entry.card_id : null);

export const entriesKey = ["entries"] as const;

export interface EntryFilters {
  from?: string;
  to?: string;
  account_id?: string;
  card_id?: string;
  category_id?: string;
  person_id?: string;
  payment_method?: string;
  fixed_only?: boolean;
  q?: string;
}

interface Page<T> {
  items: T[];
  next_cursor: string | null;
}

export function useEntryList(kind: EntryKind, filters: EntryFilters) {
  const { person_id, ...rest } = filters;
  return useInfiniteQuery({
    queryKey: [...entriesKey, kind, filters],
    queryFn: ({ pageParam }) =>
      api.get<Page<Entry>>(path(kind), {
        ...rest,
        [personField(kind)]: person_id,
        fixed_only: filters.fixed_only || undefined,
        limit: 50,
        cursor: pageParam,
      }),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.next_cursor ?? null,
  });
}

/** Every row of an installment series (for its total and the scope dialog). */
export function useSeries(kind: EntryKind, groupId: string | null | undefined) {
  return useQuery({
    queryKey: [...entriesKey, kind, "series", groupId],
    queryFn: () =>
      api
        .get<Page<Entry>>(path(kind), { installment_group_id: groupId!, limit: 200 })
        .then((p) => p.items),
    enabled: !!groupId,
  });
}

/** After any write, everything derived from entries is stale. */
function useInvalidateAll() {
  const client = useQueryClient();
  return () =>
    Promise.all([
      client.invalidateQueries({ queryKey: entriesKey }),
      client.invalidateQueries({ queryKey: keys.reports }),
      client.invalidateQueries({ queryKey: keys.reference }),
    ]);
}

export interface PartBody {
  payment_method: PaymentMethod;
  card_id?: string | null;
  account_id?: string | null;
  amount?: string;
  installments?: number;
}

export interface CreateBody {
  transaction_date: string;
  currency: Currency;
  category_id: string;
  description?: string | null;
  total_amount: string;
  spender_id?: string;
  receiver_id?: string;
  parts: PartBody[];
}

export function usePreview(kind: EntryKind, body: CreateBody | null) {
  return useQuery({
    queryKey: ["preview", kind, body],
    queryFn: ({ signal }) => api.post<Preview>(`${path(kind)}/preview`, body, { signal }),
    enabled: !!body,
    retry: false,
    staleTime: 60_000,
    placeholderData: (previous) => previous,
  });
}

export function useCreateEntry(kind: EntryKind) {
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: (body: CreateBody) => api.post<{ items: Entry[] }>(path(kind), body),
    onSuccess: invalidate,
  });
}

export interface RecurrenceBody {
  type: "EXPENSE" | "INCOME";
  person_id?: string;
  amount: string;
  currency: Currency;
  payment_method: PaymentMethod;
  card_id?: string | null;
  account_id?: string | null;
  category_id: string;
  description?: string | null;
  interval_months: number;
  day_of_month: number;
  start_date: string;
  end_date?: string | null;
  register_first?: { occurrence_date: string };
}

export function useCreateRecurrence() {
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: (body: RecurrenceBody) => api.post("recurrences", body),
    onSuccess: invalidate,
  });
}

export function useUpdateEntry(kind: EntryKind) {
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: ({
      id,
      scope,
      body,
    }: {
      id: string;
      scope?: Scope;
      body: Record<string, unknown>;
    }) =>
      api.request<{ items: Entry[] }>("PATCH", `${path(kind)}/${id}`, { query: { scope }, body }),
    onSuccess: invalidate,
  });
}

export function useDeleteEntry(kind: EntryKind) {
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: ({ id, scope }: { id: string; scope?: Scope }) =>
      api.request<void>("DELETE", `${path(kind)}/${id}`, { query: { scope } }),
    onSuccess: invalidate,
  });
}

// --- Create on the fly (ui-behavior §1.5) ----------------------------------------------

export function useCreateCategory() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (body: { type: "EXPENSE" | "INCOME"; name: string }) =>
      api.post<Schemas["CategoryOut"]>("categories", body),
    onSuccess: () => client.invalidateQueries({ queryKey: [...keys.reference, "categories"] }),
  });
}

export function useCreateAccount() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string; opening_balance?: string; opening_balance_date?: string }) =>
      api.post<Schemas["AccountOut"]>("accounts", body),
    onSuccess: () => client.invalidateQueries({ queryKey: [...keys.reference, "accounts"] }),
  });
}
