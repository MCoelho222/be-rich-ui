"use client";
/** Fixed entries: occurrences and actions (api.md §12, ui-behavior §8). */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, type Schemas } from "./api";
import { entriesKey } from "./entries";
import { keys, type Recurrence } from "./queries";

export type Occurrence = Schemas["OccurrenceOut"];

export function useOccurrences(recurrenceId: string | null, from?: string, to?: string) {
  return useQuery({
    queryKey: [...keys.reports, "occurrences", recurrenceId, from, to],
    queryFn: () =>
      api
        .get<{ items: Occurrence[] }>(`recurrences/${recurrenceId}/occurrences`, { from, to })
        .then((r) => r.items),
    enabled: !!recurrenceId,
  });
}

/** Every change to a fixed entry affects projections, lists and the reference list. */
function useInvalidate() {
  const client = useQueryClient();
  return () =>
    Promise.all([
      client.invalidateQueries({ queryKey: keys.reports }),
      client.invalidateQueries({ queryKey: [...keys.reference, "recurrences"] }),
      client.invalidateQueries({ queryKey: entriesKey }),
    ]);
}

type Action =
  | { kind: "pause" | "resume"; id: string }
  | { kind: "end"; id: string; end_date: string }
  | { kind: "change-amount"; id: string; effective_date: string; amount: string }
  | { kind: "delete"; id: string }
  | { kind: "update"; id: string; body: Record<string, unknown> }
  | { kind: "register"; id: string; occurrence: string; body: Record<string, unknown> }
  | { kind: "skip" | "unskip"; id: string; occurrence: string };

export function useRecurrenceAction() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (action: Action): Promise<unknown> => {
      const base = `recurrences/${action.id}`;
      switch (action.kind) {
        case "pause":
        case "resume":
          return api.post<Recurrence>(`${base}/${action.kind}`);
        case "end":
          return api.post<Recurrence>(`${base}/end`, { end_date: action.end_date });
        case "change-amount":
          return api.post(`${base}/change-amount`, {
            effective_date: action.effective_date,
            amount: action.amount,
          });
        case "delete":
          return api.delete(base);
        case "update":
          return api.patch<Recurrence>(base, action.body);
        case "register":
          return api.post(`${base}/occurrences/${action.occurrence}/register`, action.body);
        case "skip":
          return api.post(`${base}/occurrences/${action.occurrence}/skip`);
        case "unskip":
          return api.delete(`${base}/occurrences/${action.occurrence}/skip`);
      }
    },
    onSuccess: invalidate,
  });
}
