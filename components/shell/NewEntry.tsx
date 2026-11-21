"use client";
/**
 * The global "+ Entry" action (specs/frontend.md §3.1). Any page can open the expense,
 * income or fixed-entry form. The forms arrive with the Entries step; until then the
 * action explains that it's coming.
 */
import { useTranslations } from "next-intl";
import { createContext, useCallback, useContext, useEffect, useMemo } from "react";
import { toast } from "sonner";

export type EntryKind = "expense" | "income" | "fixed";

const NewEntryContext = createContext<{ open: (kind: EntryKind) => void }>({
  open: () => undefined,
});

export function NewEntryProvider({ children }: { children: React.ReactNode }) {
  const t = useTranslations("common");
  const open = useCallback(
    (kind: EntryKind) => {
      void kind;
      toast(t("comingSoon"));
    },
    [t]
  );

  // Keyboard shortcut N opens a new expense, unless the user is typing.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (event.key !== "n" || event.metaKey || event.ctrlKey || event.altKey) return;
      if (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))
        return;
      event.preventDefault();
      open("expense");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const value = useMemo(() => ({ open }), [open]);
  return <NewEntryContext.Provider value={value}>{children}</NewEntryContext.Provider>;
}

export function useNewEntry() {
  return useContext(NewEntryContext);
}
