"use client";
/**
 * Entry actions available everywhere (specs/frontend.md §3.1): the global "+ Entry",
 * and edit/delete of a row with the scope and confirmation rules of ui-behavior §11.
 */
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { EntryForm, type FormMode } from "@/components/entries/EntryForm";
import { FormDialog, PrimaryButton, SecondaryButton } from "@/components/ui/form-dialog";
import { useDeleteEntry, useSeries, type Entry, type EntryKind, type Scope } from "@/lib/entries";
import { useErrorMessage } from "@/lib/errors";
import { formatMoney } from "@/lib/format";
import { fromCents, sumCents } from "@/lib/money";
import { cn } from "@/lib/utils";

export type NewKind = "expense" | "income" | "fixed";

interface EntryActions {
  open: (kind: NewKind) => void;
  edit: (kind: EntryKind, entry: Entry) => void;
  remove: (kind: EntryKind, entry: Entry) => void;
}

const EntryActionsContext = createContext<EntryActions>({
  open: () => undefined,
  edit: () => undefined,
  remove: () => undefined,
});

type State =
  | { step: "closed" }
  | { step: "form"; kind: EntryKind; mode: FormMode }
  | { step: "scope"; kind: EntryKind; entry: Entry; action: "edit" | "delete" }
  | { step: "confirm"; kind: EntryKind; entry: Entry };

export function NewEntryProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<State>({ step: "closed" });
  const close = useCallback(() => setState({ step: "closed" }), []);

  const actions = useMemo<EntryActions>(
    () => ({
      open: (kind) =>
        setState({
          step: "form",
          kind: kind === "income" ? "income" : "expense",
          mode: { type: "create", repeats: kind === "fixed" },
        }),
      edit: (kind, entry) =>
        setState(
          entry.installment_group_id
            ? { step: "scope", kind, entry, action: "edit" }
            : { step: "form", kind, mode: { type: "edit", entry } }
        ),
      remove: (kind, entry) =>
        setState(
          entry.installment_group_id
            ? { step: "scope", kind, entry, action: "delete" }
            : { step: "confirm", kind, entry }
        ),
    }),
    []
  );

  // Keyboard shortcut N opens a new expense, unless the user is typing or a dialog is open.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (event.key !== "n" || event.metaKey || event.ctrlKey || event.altKey) return;
      if (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))
        return;
      if (document.querySelector("[role=dialog]")) return;
      event.preventDefault();
      actions.open("expense");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [actions]);

  return (
    <EntryActionsContext.Provider value={actions}>
      {children}
      {state.step === "form" && <FormStep kind={state.kind} mode={state.mode} onClose={close} />}
      {state.step === "scope" && (
        <ScopeStep
          kind={state.kind}
          entry={state.entry}
          action={state.action}
          onClose={close}
          onEdit={(scope, seriesTotal) =>
            setState({
              step: "form",
              kind: state.kind,
              mode: { type: "edit", entry: state.entry, scope, seriesTotal },
            })
          }
        />
      )}
      {state.step === "confirm" && (
        <ConfirmDelete kind={state.kind} entry={state.entry} onClose={close} />
      )}
    </EntryActionsContext.Provider>
  );
}

export function useNewEntry() {
  return useContext(EntryActionsContext);
}

// --- Steps ---------------------------------------------------------------------------

function FormStep({
  kind,
  mode,
  onClose,
}: {
  kind: EntryKind;
  mode: FormMode;
  onClose: () => void;
}) {
  const t = useTranslations("entryForm");
  const title =
    mode.type === "edit"
      ? kind === "expense"
        ? t("editExpense")
        : t("editIncome")
      : mode.repeats
        ? kind === "expense"
          ? t("newFixedExpense")
          : t("newFixedIncome")
        : kind === "expense"
          ? t("newExpense")
          : t("newIncome");
  return (
    <FormDialog
      open
      onOpenChange={(open) => !open && onClose()}
      title={title}
      footer={<span data-entry-footer className="contents" />}
    >
      <EntryForm kind={kind} mode={mode} onDone={onClose} />
    </FormDialog>
  );
}

function ScopeStep({
  kind,
  entry,
  action,
  onClose,
  onEdit,
}: {
  kind: EntryKind;
  entry: Entry;
  action: "edit" | "delete";
  onClose: () => void;
  onEdit: (scope: Scope, seriesTotal: string) => void;
}) {
  const t = useTranslations("entryForm");
  const errorMessage = useErrorMessage();
  const series = useSeries(kind, entry.installment_group_id);
  const remove = useDeleteEntry(kind);
  const [scope, setScope] = useState<Scope>("THIS");

  const rows = series.data ?? [];
  const pick = (s: Scope) =>
    rows.filter((r) =>
      s === "THIS"
        ? r.id === entry.id
        : s === "ALL"
          ? true
          : r.installment_number >= entry.installment_number
    );
  const total = (s: Scope) =>
    formatMoney(fromCents(sumCents(pick(s).map((r) => r.amount))), entry.currency);
  const options: { value: Scope; label: string; detail: string }[] = [
    { value: "THIS", label: t("scope.THIS"), detail: formatMoney(entry.amount, entry.currency) },
    {
      value: "THIS_AND_FOLLOWING",
      label: t("scope.THIS_AND_FOLLOWING"),
      detail: t("scopeCount", {
        count: pick("THIS_AND_FOLLOWING").length,
        total: total("THIS_AND_FOLLOWING"),
      }),
    },
    {
      value: "ALL",
      label: t("scope.ALL"),
      detail: t("scopeCount", { count: rows.length, total: total("ALL") }),
    },
  ];

  const confirm = () => {
    if (action === "edit") return onEdit(scope, fromCents(sumCents(rows.map((r) => r.amount))));
    remove
      .mutateAsync({ id: entry.id, scope })
      .then(() => {
        toast.success(t("deleted"));
        onClose();
      })
      .catch((error) => toast.error(errorMessage(error)));
  };

  return (
    <FormDialog
      open
      width="sm"
      onOpenChange={(open) => !open && onClose()}
      title={action === "edit" ? t("editWhich") : t("deleteWhich")}
      description={t("seriesOf", {
        n: entry.installment_number,
        total: entry.installment_total,
        kind: kind === "expense" ? t("anExpense") : t("anIncome"),
      })}
      footer={
        <>
          <SecondaryButton onClick={onClose}>{t("cancel")}</SecondaryButton>
          <PrimaryButton
            danger={action === "delete"}
            disabled={series.isPending || remove.isPending}
            onClick={confirm}
          >
            {remove.isPending && <Loader2 size={16} className="animate-spin" aria-hidden />}
            {action === "edit" ? t("continue") : t("delete")}
          </PrimaryButton>
        </>
      }
    >
      <div role="radiogroup" className="flex flex-col gap-2">
        {options.map((option) => (
          <label
            key={option.value}
            className={cn(
              "flex cursor-pointer items-center gap-3 rounded-lg border px-3.5 py-3 transition-colors",
              scope === option.value ? "border-brand bg-brand/5" : "border-line hover:bg-surface-2"
            )}
          >
            <input
              type="radio"
              name="scope"
              value={option.value}
              checked={scope === option.value}
              onChange={() => setScope(option.value)}
              className="accent-[var(--brand)]"
            />
            <span className="flex-1 text-sm font-medium">{option.label}</span>
            <span className="num text-[13px] text-text-muted">
              {series.isPending && option.value !== "THIS" ? "…" : option.detail}
            </span>
          </label>
        ))}
      </div>
    </FormDialog>
  );
}

function ConfirmDelete({
  kind,
  entry,
  onClose,
}: {
  kind: EntryKind;
  entry: Entry;
  onClose: () => void;
}) {
  const t = useTranslations("entryForm");
  const errorMessage = useErrorMessage();
  const remove = useDeleteEntry(kind);
  const amount = formatMoney(entry.amount, entry.currency);
  return (
    <FormDialog
      open
      width="sm"
      onOpenChange={(open) => !open && onClose()}
      title={
        entry.recurrence_id
          ? t("deletePaymentTitle")
          : kind === "expense"
            ? t("deleteExpenseTitle")
            : t("deleteIncomeTitle")
      }
      footer={
        <>
          <SecondaryButton onClick={onClose}>{t("cancel")}</SecondaryButton>
          <PrimaryButton
            danger
            disabled={remove.isPending}
            onClick={() =>
              remove
                .mutateAsync({ id: entry.id })
                .then(() => {
                  toast.success(t("deleted"));
                  onClose();
                })
                .catch((error) => toast.error(errorMessage(error)))
            }
          >
            {remove.isPending && <Loader2 size={16} className="animate-spin" aria-hidden />}
            {t("delete")}
          </PrimaryButton>
        </>
      }
    >
      <p className="text-sm text-text-2">
        {entry.recurrence_id
          ? t("deletePaymentBody")
          : t("deleteBody", { description: entry.description || "—", amount })}
      </p>
    </FormDialog>
  );
}
