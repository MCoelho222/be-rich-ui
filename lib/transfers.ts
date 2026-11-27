"use client";
/**
 * Transfers between accounts and investments (api.md §16, schemas §21). They move account
 * balances and investment amounts, so writes refresh reports, accounts and investments.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, type Schemas } from "./api";
import { entriesKey } from "./entries";
import { investmentsKey } from "./investments";
import { keys } from "./queries";

export type Transfer = Schemas["TransferOut"];
export type TransferEndKind = Transfer["source"]["kind"];
/** One end of a transfer, as the form picks it. */
export interface TransferEndRef {
  kind: TransferEndKind;
  id: string;
}

const transfersKey = [...entriesKey, "transfers"] as const;

export function useTransfers(params: { from: string; to: string; accountId?: string }) {
  return useQuery({
    queryKey: [...transfersKey, params],
    queryFn: () =>
      api
        .get<{ items: Transfer[] }>("transfers", {
          from: params.from,
          to: params.to,
          account_id: params.accountId,
        })
        .then((r) => r.items),
  });
}

export function useTransferWrite() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (
      action: { kind: "create"; body: Record<string, unknown> } | { kind: "delete"; id: string }
    ): Promise<Transfer | void> =>
      action.kind === "create"
        ? api.post<Transfer>("transfers", action.body)
        : api.delete(`transfers/${action.id}`),
    onSuccess: () =>
      Promise.all([
        client.invalidateQueries({ queryKey: entriesKey }),
        client.invalidateQueries({ queryKey: keys.reports }),
        client.invalidateQueries({ queryKey: [...keys.reference, "accounts"] }),
        client.invalidateQueries({ queryKey: investmentsKey }),
      ]),
  });
}
