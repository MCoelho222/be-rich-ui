"use client";
/** Page title, the page's own controls, and the "+ New expense" split button (specs/frontend.md §3). */
import { ChevronDown, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { LogoMark } from "@/components/brand/Logo";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useNewEntry } from "./NewEntry";

export function PageHeader({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <header className="flex flex-wrap items-center gap-3 px-4 pt-5 pb-2 sm:px-8 sm:pt-7">
      <LogoMark size={28} className="sm:hidden" />
      <h1 className="flex-1 text-2xl font-semibold tracking-tight sm:text-[28px]">{title}</h1>
      {children}
      <NewEntryButton />
    </header>
  );
}

function NewEntryButton() {
  const t = useTranslations("nav");
  const { open } = useNewEntry();
  // Phones use the bottom bar's "+" instead.
  return (
    <div className="hidden sm:flex">
      <button
        type="button"
        onClick={() => open("expense")}
        title="N"
        className="flex h-9 items-center gap-1.5 rounded-l-lg bg-brand px-3.5 text-sm font-semibold text-on-brand hover:bg-brand-hover"
      >
        <Plus size={16} strokeWidth={2.4} aria-hidden />
        {t("newExpense")}
      </button>
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label={t("moreNew")}
          className="flex h-9 w-8 items-center justify-center rounded-r-lg border-l border-on-brand/25 bg-brand text-on-brand hover:bg-brand-hover"
        >
          <ChevronDown size={14} strokeWidth={2.4} aria-hidden />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-48">
          <DropdownMenuItem onSelect={() => open("income")}>{t("newIncome")}</DropdownMenuItem>
          <DropdownMenuItem onSelect={() => open("fixed")}>{t("newFixed")}</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

/** A placeholder body for pages that arrive in later steps. */
export function ComingSoon() {
  const t = useTranslations("common");
  return (
    <div className="px-4 py-6 sm:px-8">
      <div className="rounded-xl border border-dashed border-line-strong px-6 py-16 text-center text-sm text-text-muted">{t("comingSoon")}</div>
    </div>
  );
}
