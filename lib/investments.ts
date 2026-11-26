"use client";
/** Investments (api.md §15). They feed the household balance, so writes refresh every report. */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, type Schemas } from "./api";
import { keys } from "./queries";

export type Investment = Schemas["InvestmentOut"];
export type Liquidity = Investment["liquidity"];

/** The name when there is one, else the bank. */
export const investmentLabel = (i: Investment) => i.name ?? i.bank;

const investmentsKey = ["investments"] as const;

export function useInvestments() {
  return useQuery({
    queryKey: investmentsKey,
    queryFn: () => api.get<{ items: Investment[] }>("investments").then((r) => r.items),
  });
}

export function useInvestmentWrite() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (
      action:
        | { kind: "create"; body: Record<string, unknown> }
        | { kind: "update"; id: string; body: Record<string, unknown> }
        | { kind: "delete"; id: string }
    ): Promise<Investment | void> => {
      switch (action.kind) {
        case "create":
          return api.post<Investment>("investments", action.body);
        case "update":
          return api.patch<Investment>(`investments/${action.id}`, action.body);
        case "delete":
          return api.delete(`investments/${action.id}`);
      }
    },
    onSuccess: () =>
      Promise.all([
        client.invalidateQueries({ queryKey: investmentsKey }),
        client.invalidateQueries({ queryKey: keys.reports }),
      ]),
  });
}
