"use client";
/** Categories (frontend.md §6.5): two lists, with add, rename, archive and delete. */
import {
  Archive,
  ArchiveRestore,
  Check,
  ChevronRight,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { DeleteDialog } from "@/components/accounts/forms";
import { Skeleton, WidgetError } from "@/components/dashboard/Widget";
import { PageHeader } from "@/components/shell/PageHeader";
import { Input } from "@/components/ui/input";
import { useReferenceWrite } from "@/lib/accounts";
import { useErrorMessage } from "@/lib/errors";
import { useCategories, type Category } from "@/lib/queries";
import { cn } from "@/lib/utils";

type Type = "EXPENSE" | "INCOME";

export function CategoriesPage() {
  const t = useTranslations("categories");
  const categories = useCategories();
  const [tab, setTab] = useState<Type>("EXPENSE");
  const [deleting, setDeleting] = useState<Category | null>(null);

  const tabButton = (value: Type, label: string, color: string) => (
    <button
      type="button"
      role="tab"
      aria-selected={tab === value}
      onClick={() => setTab(value)}
      className={cn("h-11 px-4 text-[15px] font-medium", tab === value ? color : "text-text-muted")}
      style={tab === value ? { boxShadow: "inset 0 -2px 0 currentColor" } : undefined}
    >
      {label}
    </button>
  );

  return (
    <>
      <PageHeader title={t("title")} />
      <div className="flex flex-col gap-4 px-4 pt-2 pb-10 sm:px-8">
        {/* Phones: tabs; larger screens: both columns side by side */}
        <div role="tablist" className="flex border-b border-line lg:hidden">
          {tabButton("EXPENSE", t("expenses"), "text-expense")}
          {tabButton("INCOME", t("incomes"), "text-income")}
        </div>
        {categories.isPending ? (
          <Skeleton className="h-96 w-full rounded-xl" />
        ) : categories.isError ? (
          <WidgetError onRetry={() => void categories.refetch()} />
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            {(["EXPENSE", "INCOME"] as const).map((type) => (
              <div key={type} className={cn(type !== tab && "hidden lg:block")}>
                <CategoryColumn
                  type={type}
                  categories={categories.data.filter((c) => c.type === type)}
                  onDelete={setDeleting}
                />
              </div>
            ))}
          </div>
        )}
      </div>
      {deleting && (
        <DeleteDialog
          resource="categories"
          item={deleting}
          name={deleting.name}
          onClose={() => setDeleting(null)}
        />
      )}
    </>
  );
}

function CategoryColumn({
  type,
  categories,
  onDelete,
}: {
  type: Type;
  categories: Category[];
  onDelete: (c: Category) => void;
}) {
  const t = useTranslations("categories");
  const write = useReferenceWrite("categories");
  const errorMessage = useErrorMessage();
  const [name, setName] = useState("");
  const [editing, setEditing] = useState<{ id: string; name: string } | null>(null);
  const active = categories.filter((c) => c.is_active).sort((a, b) => a.name.localeCompare(b.name));
  const archived = categories
    .filter((c) => !c.is_active)
    .sort((a, b) => a.name.localeCompare(b.name));
  const tab = type === "EXPENSE" ? "expenses" : "incomes";

  const run = (action: Parameters<typeof write.mutateAsync>[0], success: string) =>
    write
      .mutateAsync(action)
      .then(() => {
        toast.success(success);
        return true;
      })
      .catch((error) => {
        toast.error(errorMessage(error));
        return false;
      });

  const add = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;
    if (await run({ kind: "create", body: { type, name: name.trim() } }, t("created"))) setName("");
  };

  const rename = async () => {
    if (!editing?.name.trim()) return;
    if (
      await run(
        { kind: "update", id: editing.id, body: { name: editing.name.trim() } },
        t("renamed")
      )
    )
      setEditing(null);
  };

  const iconButton =
    "flex size-8 items-center justify-center rounded-md text-text-muted hover:bg-surface-2 hover:text-text";

  const row = (category: Category) => (
    <li
      key={category.id}
      className="group flex items-center gap-2 border-t border-line px-4 py-2 first:border-t-0"
    >
      {editing?.id === category.id ? (
        <form
          className="flex flex-1 items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void rename();
          }}
        >
          <Input
            autoFocus
            value={editing.name}
            maxLength={30}
            onChange={(e) => setEditing({ ...editing, name: e.target.value })}
            onKeyDown={(e) => e.key === "Escape" && setEditing(null)}
            aria-label={t("rename")}
            className="h-9"
          />
          <button type="submit" aria-label={t("save")} className={iconButton}>
            <Check size={16} aria-hidden />
          </button>
          <button
            type="button"
            aria-label={t("cancel")}
            onClick={() => setEditing(null)}
            className={iconButton}
          >
            <X size={16} aria-hidden />
          </button>
        </form>
      ) : (
        <>
          <Link
            href={`/entries?tab=${tab}&category=${category.id}&period=this-year`}
            className="min-w-0 flex-1 truncate py-1.5 text-sm hover:underline"
          >
            {category.name}
          </Link>
          <span className="flex gap-0.5 opacity-100 sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100">
            <button
              type="button"
              aria-label={t("renameNamed", { name: category.name })}
              title={t("rename")}
              onClick={() => setEditing({ id: category.id, name: category.name })}
              className={iconButton}
            >
              <Pencil size={15} aria-hidden />
            </button>
            {category.is_active ? (
              <button
                type="button"
                aria-label={t("archiveNamed", { name: category.name })}
                title={t("archive")}
                onClick={() => void run({ kind: "archive", id: category.id }, t("archived"))}
                className={iconButton}
              >
                <Archive size={15} aria-hidden />
              </button>
            ) : (
              <button
                type="button"
                aria-label={t("unarchiveNamed", { name: category.name })}
                title={t("unarchive")}
                onClick={() => void run({ kind: "unarchive", id: category.id }, t("unarchived"))}
                className={iconButton}
              >
                <ArchiveRestore size={15} aria-hidden />
              </button>
            )}
            <button
              type="button"
              aria-label={t("deleteNamed", { name: category.name })}
              title={t("delete")}
              onClick={() => onDelete(category)}
              className={cn(iconButton, "hover:text-negative")}
            >
              <Trash2 size={15} aria-hidden />
            </button>
          </span>
        </>
      )}
    </li>
  );

  return (
    <section className="flex flex-col gap-3">
      <h2 className="hidden text-base font-semibold lg:block">
        {type === "EXPENSE" ? t("expenses") : t("incomes")}{" "}
        <span className="font-normal text-text-muted">· {active.length}</span>
      </h2>
      <form onSubmit={add} className="flex gap-2">
        <Input
          value={name}
          maxLength={30}
          onChange={(e) => setName(e.target.value)}
          placeholder={type === "EXPENSE" ? t("newExpenseCategory") : t("newIncomeCategory")}
          aria-label={type === "EXPENSE" ? t("newExpenseCategory") : t("newIncomeCategory")}
        />
        <button
          type="submit"
          disabled={!name.trim() || write.isPending}
          className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-lg bg-brand px-3.5 text-sm font-semibold text-on-brand hover:bg-brand-hover disabled:opacity-50"
        >
          <Plus size={16} aria-hidden />
          {t("add")}
        </button>
      </form>
      {active.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line-strong px-4 py-8 text-center text-sm text-text-muted">
          {t("empty")}
        </p>
      ) : (
        <ul className="rounded-xl border border-line bg-surface">{active.map(row)}</ul>
      )}
      {archived.length > 0 && (
        <details className="group/archived">
          <summary className="flex cursor-pointer list-none items-center gap-1.5 text-sm text-text-muted hover:text-text">
            <ChevronRight
              size={15}
              className="transition-transform group-open/archived:rotate-90"
              aria-hidden
            />
            {t("archivedCount", { count: archived.length })}
          </summary>
          <ul className="mt-3 rounded-xl border border-line bg-surface opacity-80">
            {archived.map(row)}
          </ul>
        </details>
      )}
    </section>
  );
}
