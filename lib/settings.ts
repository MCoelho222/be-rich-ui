"use client";
/** Profile, household, members and invitations (api.md §4–§6, auth.md §4.5). */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, type Schemas } from "./api";
import { meKey } from "./auth";
import { keys } from "./queries";

export type Profile = Schemas["ProfileOut"];
export type Household = Schemas["HouseholdOut"];
export type Invitation = Schemas["InvitationOut"];

const profileKey = ["profile"] as const;
const householdKey = ["household"] as const;
const invitationsKey = ["invitations"] as const;

export function useProfile() {
  return useQuery({ queryKey: profileKey, queryFn: () => api.get<Profile>("me") });
}

export function useUpdateProfile() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) => api.patch<Profile>("me", body),
    onSuccess: (profile) => {
      client.setQueryData(profileKey, profile);
      void client.invalidateQueries({ queryKey: meKey });
      void client.invalidateQueries({ queryKey: [...keys.reference, "members"] });
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (body: { current_password: string; new_password: string }) =>
      api.post<void>("auth/password", body, { allowUnauthenticated: true }),
  });
}

export function useHousehold() {
  return useQuery({ queryKey: householdKey, queryFn: () => api.get<Household>("household") });
}

export function useUpdateHousehold() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) => api.patch<Household>("household", body),
    onSuccess: (household) => {
      client.setQueryData(householdKey, household);
      // The default currency changes every converted total (ui-behavior §3.1).
      void client.invalidateQueries({ queryKey: meKey });
      void client.invalidateQueries({ queryKey: keys.reports });
    },
  });
}

export function useRemoveMember() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => api.delete(`household/members/${userId}`),
    onSuccess: () => client.invalidateQueries({ queryKey: [...keys.reference, "members"] }),
  });
}

/** Leaving moves the user to a new, empty household: reload everything (ui-behavior §3.2). */
export function useLeaveHousehold() {
  return useMutation({
    mutationFn: () => api.post("household/leave"),
    onSuccess: () => window.location.assign("/"),
  });
}

export function useInvitations() {
  return useQuery({
    queryKey: invitationsKey,
    queryFn: () => api.get<{ items: Invitation[] }>("invitations").then((r) => r.items),
  });
}

export function useInvitationAction() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (
      action: { kind: "invite"; email: string } | { kind: "resend" | "revoke"; id: string }
    ) =>
      action.kind === "invite"
        ? api.post<Invitation>("invitations", { email: action.email })
        : api.post(`invitations/${action.id}/${action.kind}`),
    // A failed email (502) still keeps the invitation, so refresh either way.
    onSettled: () => client.invalidateQueries({ queryKey: invitationsKey }),
  });
}
