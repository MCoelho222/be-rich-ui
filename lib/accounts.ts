"use client";
/** Accounts and cards: writes and the card preview (api.md §7–§8). */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, type Schemas } from "./api";
import { entriesKey } from "./entries";
import { keys } from "./queries";

export type CardType = Schemas["CardOut"]["type"];
export type CardPreview = Schemas["CardPreviewOut"];

function useInvalidate() {
  const client = useQueryClient();
  return () =>
    Promise.all([
      client.invalidateQueries({ queryKey: keys.reference }),
      client.invalidateQueries({ queryKey: keys.reports }),
      client.invalidateQueries({ queryKey: entriesKey }),
    ]);
}

type Resource = "accounts" | "cards";

/** Create, update, archive, unarchive, delete and (accounts) adjust. */
export function useReferenceWrite<T = unknown>(resource: Resource) {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (
      action:
        | { kind: "create"; body: Record<string, unknown> }
        | { kind: "update"; id: string; body: Record<string, unknown> }
        | { kind: "archive" | "unarchive" | "delete"; id: string }
        | { kind: "adjust"; id: string; balance: string; date: string }
    ): Promise<T> => {
      switch (action.kind) {
        case "create":
          return api.post<T>(resource, action.body);
        case "update":
          return api.patch<T>(`${resource}/${action.id}`, action.body);
        case "archive":
        case "unarchive":
          return api.post<T>(`${resource}/${action.id}/${action.kind}`);
        case "delete":
          return api.delete<T>(`${resource}/${action.id}`);
        case "adjust":
          return api.post<T>(`accounts/${action.id}/adjust`, {
            balance: action.balance,
            date: action.date,
          });
      }
    },
    onSuccess: invalidate,
  });
}

/** "A purchase made today would be due on …" (ui-behavior §5), computed by the server. */
export function useCardPreview(bestBuyDay: number | null, dueDay: number | null) {
  return useQuery({
    queryKey: ["card-preview", bestBuyDay, dueDay],
    queryFn: () =>
      api.post<CardPreview>("cards/preview", { best_buy_day: bestBuyDay, due_day: dueDay }),
    enabled: !!bestBuyDay && !!dueDay,
    staleTime: 60 * 60_000,
  });
}
