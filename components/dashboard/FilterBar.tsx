"use client";
/** Period, account and Me/Everyone (dashboard.md §3). A "Filters" sheet on phones. */
import { CalendarDays, Check, ChevronDown, SlidersHorizontal } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { Segmented } from "@/components/preferences/Segmented";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { formatDate, formatMonth } from "@/lib/format";
import { isValidCustomRange, PRESETS, type Preset } from "@/lib/period";
import { useAccounts } from "@/lib/queries";
import { cn } from "@/lib/utils";
import type { DashboardView, useDashboardView } from "./view";

type Update = ReturnType<typeof useDashboardView>["update"];

const controlClass =
  "inline-flex h-9 items-center gap-2 rounded-lg border border-line-strong bg-surface px-3 text-sm text-text hover:bg-surface-2 data-[state=open]:bg-surface-2";

/** "This month · Nov/2026", or the custom dates. */
function usePeriodLabel(view: DashboardView) {
  const t = useTranslations("dashboard.period");
  const locale = useLocale();
  const { from, to } = view.range;
  if (view.preset === "custom")
    return { name: t("custom"), detail: `${formatDate(from)} – ${formatDate(to)}` };
  const sameMonth = from.slice(0, 7) === to.slice(0, 7);
  const detail = sameMonth
    ? formatMonth(from.slice(0, 7), locale)
    : `${formatMonth(from.slice(0, 7), locale)} – ${formatMonth(to.slice(0, 7), locale)}`;
  return { name: t(view.preset), detail };
}

function PeriodPicker({
  view,
  update,
  full,
}: {
  view: DashboardView;
  update: Update;
  full?: boolean;
}) {
  const t = useTranslations("dashboard");
  const label = usePeriodLabel(view);
  const [customOpen, setCustomOpen] = useState(false);
  // When "Custom…" is picked, keep the menu from moving focus back to its trigger,
  // which would close the popover that's opening.
  const openingCustom = useRef(false);
  const [from, setFrom] = useState(view.range.from);
  const [to, setTo] = useState(view.range.to);
  const valid = isValidCustomRange(from, to);

  return (
    <Popover open={customOpen} onOpenChange={setCustomOpen}>
      <DropdownMenu>
        <PopoverAnchor asChild>
          <DropdownMenuTrigger className={cn(controlClass, full && "w-full justify-between")}>
            <CalendarDays size={16} className="text-text-muted" aria-hidden />
            <span className="flex-1 text-left">
              {label.name} <span className="text-text-muted">· {label.detail}</span>
            </span>
            <ChevronDown size={14} className="text-text-muted" aria-hidden />
          </DropdownMenuTrigger>
        </PopoverAnchor>
        <DropdownMenuContent
          align="start"
          onCloseAutoFocus={(event) => {
            if (openingCustom.current) {
              event.preventDefault();
              openingCustom.current = false;
            }
          }}
        >
          {PRESETS.filter((p) => p !== "custom").map((preset) => (
            <DropdownMenuItem key={preset} onSelect={() => update({ preset })}>
              <Check
                className={cn(view.preset === preset ? "opacity-100" : "opacity-0")}
                aria-hidden
              />
              {t(`period.${preset as Exclude<Preset, "custom">}`)}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={() => {
              openingCustom.current = true;
              setFrom(view.range.from);
              setTo(view.range.to);
              setCustomOpen(true);
            }}
          >
            <Check
              className={cn(view.preset === "custom" ? "opacity-100" : "opacity-0")}
              aria-hidden
            />
            {t("period.custom")}…
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <PopoverContent className="w-72">
        <form
          className="flex flex-col gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            if (!valid) return;
            update({ preset: "custom", from, to });
            setCustomOpen(false);
          }}
        >
          <p className="text-sm font-medium">{t("customRange")}</p>
          <label className="flex flex-col gap-1 text-[13px] text-text-2">
            {t("from")}
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} required />
          </label>
          <label className="flex flex-col gap-1 text-[13px] text-text-2">
            {t("to")}
            <Input
              type="date"
              value={to}
              min={from}
              onChange={(e) => setTo(e.target.value)}
              required
            />
          </label>
          {!valid && from && to && <p className="text-[13px] text-negative">{t("invalidRange")}</p>}
          <button
            type="submit"
            disabled={!valid}
            className="h-9 rounded-lg bg-brand text-sm font-semibold text-on-brand hover:bg-brand-hover disabled:opacity-50"
          >
            {t("apply")}
          </button>
        </form>
      </PopoverContent>
    </Popover>
  );
}

function AccountPicker({
  view,
  update,
  full,
}: {
  view: DashboardView;
  update: Update;
  full?: boolean;
}) {
  const t = useTranslations("dashboard");
  const accounts = useAccounts();
  const list = [...(accounts.data ?? [])].sort(
    (a, b) => Number(b.is_active) - Number(a.is_active) || a.name.localeCompare(b.name)
  );
  const selected = list.find((a) => a.id === view.accountId);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={cn(controlClass, full && "w-full justify-between")}>
        <span className="flex-1 truncate text-left">{selected?.name ?? t("allAccounts")}</span>
        <ChevronDown size={14} className="text-text-muted" aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="max-h-80 overflow-y-auto">
        <DropdownMenuItem onSelect={() => update({ accountId: null })}>
          <Check className={cn(view.accountId ? "opacity-0" : "opacity-100")} aria-hidden />
          {t("allAccounts")}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {list.map((account) => (
          <DropdownMenuItem key={account.id} onSelect={() => update({ accountId: account.id })}>
            <Check
              className={cn(view.accountId === account.id ? "opacity-100" : "opacity-0")}
              aria-hidden
            />
            <span className="flex-1 truncate">{account.name}</span>
            {!account.is_active && <span className="text-xs text-text-muted">{t("archived")}</span>}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function MemberToggle({ view, update }: { view: DashboardView; update: Update }) {
  const t = useTranslations("dashboard");
  return (
    <Segmented<"all" | "me">
      label={t("whose")}
      value={view.member ?? "all"}
      onChange={(value) => update({ member: value === "me" ? "me" : null })}
      options={[
        { value: "all", label: t("everyone") },
        { value: "me", label: t("me") },
      ]}
      className="[&_button]:h-8 [&_button]:px-3 [&_button]:text-[13px] [&_button]:font-medium"
    />
  );
}

export function FilterBar({ view, update }: { view: DashboardView; update: Update }) {
  const t = useTranslations("dashboard");
  const label = usePeriodLabel(view);
  const accounts = useAccounts();
  const account = accounts.data?.find((a) => a.id === view.accountId);
  const summary = [
    label.name,
    account?.name ?? t("allAccounts"),
    view.member ? t("me") : t("everyone"),
  ].join(" · ");

  return (
    <>
      <div className="hidden flex-wrap items-center gap-2 sm:flex">
        <PeriodPicker view={view} update={update} />
        <AccountPicker view={view} update={update} />
        <MemberToggle view={view} update={update} />
      </div>
      <Sheet>
        <SheetTrigger className={cn(controlClass, "h-11 w-full basis-full rounded-xl sm:hidden")}>
          <SlidersHorizontal size={17} className="text-text-muted" aria-hidden />
          <span className="flex-1 truncate text-left">{summary}</span>
          <ChevronDown size={14} className="text-text-muted" aria-hidden />
        </SheetTrigger>
        <SheetContent title={t("filters")} className="gap-3">
          <p className="text-sm font-semibold">{t("filters")}</p>
          <PeriodPicker view={view} update={update} full />
          <AccountPicker view={view} update={update} full />
          <MemberToggle view={view} update={update} />
        </SheetContent>
      </Sheet>
    </>
  );
}
