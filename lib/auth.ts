"use client";
/** Session queries and mutations (auth.md §4). */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, type Schemas } from "./api";

export type Me = Schemas["MeOut"];

export const meKey = ["auth", "me"] as const;

export function useMe() {
  return useQuery({ queryKey: meKey, queryFn: () => api.get<Me>("auth/me"), staleTime: 5 * 60_000 });
}

export function useLogout() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: () => api.post<void>("auth/logout", undefined, { allowUnauthenticated: true }),
    onSettled: () => {
      client.clear();
      window.location.assign("/login");
    },
  });
}
