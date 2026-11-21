"use client";
/** Pickers used by the entry forms (ui-behavior §1.5, §6.1). */
import { Check, ChevronDown, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useId, useMemo, useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { MoneyInput } from "@/components/ui/money-input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useCreateAccount, useCreateCategory } from "@/lib/entries";
import { useErrorMessage } from "@/lib/errors";
import { type Category } from "@/lib/queries";
import { cn } from "@/lib/utils";

export const fieldLabel = "text-[13px] font-medium text-text-2";

export function FieldShell({
  label,
  required,
  error,
  hint,
  htmlFor,
  children,
  className,
}: {
  label: string;
  required?: boolean;
  error?: string;
  hint?: React.ReactNode;
  htmlFor?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", className)}>
      <label htmlFor={htmlFor} className={fieldLabel}>
        {label}
        {required && <span className="text-negative"> *</span>}
      </label>
      {children}
      {error ? (
        <p className="text-[13px] text-negative">{error}</p>
      ) : hint ? (
        <div className="text-[13px] text-text-muted">{hint}</div>
      ) : null}
    </div>
  );
}

/** A styled native select: accessible and comfortable on phones. */
export function Select({
  className,
  invalid,
  ...props
}: React.ComponentProps<"select"> & { invalid?: boolean }) {
  return (
    <div className="relative">
      <select
        aria-invalid={invalid}
        {...props}
        className={cn(
          "h-10 w-full appearance-none rounded-lg border border-line-strong bg-surface-2 pr-9 pl-3 text-[15px] text-text outline-none",
          "focus-visible:border-brand focus-visible:shadow-[0_0_0_3px_var(--ring-color)] disabled:cursor-not-allowed disabled:opacity-50",
          invalid && "border-negative",
          className
        )}
      />
      <ChevronDown
        size={14}
        aria-hidden
        className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-text-muted"
      />
    </div>
  );
}

/** Searchable category picker that can create the typed name (ui-behavior §1.5). */
export function CategoryPicker({
  id,
  type,
  categories,
  value,
  onChange,
  invalid,
  disabled,
}: {
  id?: string;
  type: "EXPENSE" | "INCOME";
  categories: Category[];
  value: string;
  onChange: (id: string) => void;
  invalid?: boolean;
  disabled?: boolean;
}) {
  const t = useTranslations("entryForm");
  const errorMessage = useErrorMessage();
  const create = useCreateCategory();
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  // Portal into the enclosing dialog, if any (see PopoverContent).
  const [dialogEl, setDialogEl] = useState<HTMLElement | null>(null);

  const options = useMemo(
    () =>
      categories
        .filter((c) => c.type === type && c.is_active)
        .sort((a, b) => a.name.localeCompare(b.name)),
    [categories, type]
  );
  const selected = categories.find((c) => c.id === value);
  const needle = query.trim().toLowerCase();
  const matches = needle ? options.filter((c) => c.name.toLowerCase().includes(needle)) : options;
  const exact = options.some((c) => c.name.toLowerCase() === needle);

  const pick = (categoryId: string) => {
    onChange(categoryId);
    setOpen(false);
    setQuery("");
  };

  const createTyped = () =>
    create
      .mutateAsync({ type, name: query.trim().slice(0, 30) })
      .then((category) => pick(category.id))
      .catch((error) => toast.error(errorMessage(error)));

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        ref={(el) => setDialogEl((current) => current ?? (el?.closest("[role=dialog]") as HTMLElement | null))}
        id={id}
        disabled={disabled}
        aria-invalid={invalid}
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-lg border border-line-strong bg-surface-2 px-3 text-left text-[15px] outline-none",
          "focus-visible:border-brand focus-visible:shadow-[0_0_0_3px_var(--ring-color)] disabled:opacity-50",
          invalid && "border-negative",
          !selected && "text-text-faint"
        )}
      >
        <span className="truncate">
          {selected?.name ?? t("pickCategory")}
          {selected && !selected.is_active && (
            <span className="ml-2 text-xs text-text-muted">({t("archived")})</span>
          )}
        </span>
        <ChevronDown size={14} className="text-text-muted" aria-hidden />
      </PopoverTrigger>
      <PopoverContent container={dialogEl} className="w-[var(--radix-popover-trigger-width)] min-w-64 p-2">
        <Input
          autoFocus
          value={query}
          placeholder={t("searchOrCreate")}
          role="combobox"
          aria-expanded
          aria-controls={listId}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key !== "Enter") return;
            e.preventDefault();
            if (matches[0]) pick(matches[0].id);
            else if (needle) void createTyped();
          }}
          className="h-9"
        />
        <ul id={listId} role="listbox" className="custom-scrollbar mt-2 max-h-60 overflow-y-auto">
          {matches.map((category) => (
            <li key={category.id} role="option" aria-selected={category.id === value}>
              <button
                type="button"
                onClick={() => pick(category.id)}
                className="flex h-9 w-full items-center gap-2 rounded-md px-2 text-left text-sm hover:bg-surface-2"
              >
                <Check
                  size={14}
                  className={cn("text-brand", category.id === value ? "opacity-100" : "opacity-0")}
                  aria-hidden
                />
                {category.name}
              </button>
            </li>
          ))}
          {needle && !exact && (
            <li>
              <button
                type="button"
                disabled={create.isPending}
                onClick={() => void createTyped()}
                className="flex h-9 w-full items-center gap-2 rounded-md px-2 text-left text-sm text-brand hover:bg-surface-2 disabled:opacity-50"
              >
                <Plus size={14} aria-hidden />
                {t("createNamed", { name: query.trim().slice(0, 30) })}
              </button>
            </li>
          )}
          {!needle && matches.length === 0 && (
            <li className="px-2 py-3 text-sm text-text-muted">{t("noCategories")}</li>
          )}
        </ul>
      </PopoverContent>
    </Popover>
  );
}

/** "+ New account" inline: the name, and an optional opening balance and date (ui-behavior §1.5). */
export function NewAccountInline({
  onCreated,
  onCancel,
}: {
  onCreated: (id: string) => void;
  onCancel: () => void;
}) {
  const t = useTranslations("entryForm");
  const errorMessage = useErrorMessage();
  const create = useCreateAccount();
  const [name, setName] = useState("");
  const [balance, setBalance] = useState("");
  const [date, setDate] = useState("");

  return (
    <div className="flex flex-col gap-2.5 rounded-lg border border-line bg-surface-2/50 p-3">
      <Input
        autoFocus
        placeholder={t("accountName")}
        value={name}
        maxLength={40}
        onChange={(e) => setName(e.target.value)}
        aria-label={t("accountName")}
      />
      <div className="grid grid-cols-2 gap-2">
        <MoneyInput
          value={balance}
          onChange={setBalance}
          aria-label={t("openingBalance")}
          placeholder={t("openingBalance")}
        />
        <Input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          aria-label={t("openingDate")}
        />
      </div>
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="h-8 rounded-md px-3 text-sm text-text-muted hover:text-text"
        >
          {t("cancel")}
        </button>
        <button
          type="button"
          disabled={!name.trim() || create.isPending}
          onClick={() =>
            create
              .mutateAsync({
                name: name.trim(),
                opening_balance: balance || undefined,
                opening_balance_date: date || undefined,
              })
              .then((account) => onCreated(account.id))
              .catch((error) => toast.error(errorMessage(error)))
          }
          className="h-8 rounded-md bg-brand px-3 text-sm font-semibold text-on-brand disabled:opacity-50"
        >
          {t("createAccount")}
        </button>
      </div>
    </div>
  );
}
