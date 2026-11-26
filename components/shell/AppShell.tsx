"use client";
/** The logged-in frame: sidebar on desktop and tablet, top title + bottom tab bar on phones (specs/frontend.md §3). */
import { ChevronsLeft, ChevronsRight, LogOut, MoreHorizontal, Plus, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Logo, LogoMark } from "@/components/brand/Logo";
import { LanguageToggle, ThemeToggle } from "@/components/preferences/Toggles";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetClose, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useLogout, useMe } from "@/lib/auth";
import { shortName } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Avatar } from "./Avatar";
import { NewEntryProvider, useNewEntry } from "./NewEntry";
import { isActive, MAIN_NAV, SETTINGS_NAV, type NavItem } from "./nav";

const COLLAPSED_KEY = "brs_sidebar_collapsed";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <NewEntryProvider>
      <div className="flex min-h-dvh bg-bg">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col pb-[calc(76px+env(safe-area-inset-bottom))] sm:pb-0">
          {children}
        </div>
        <BottomBar />
      </div>
    </NewEntryProvider>
  );
}

// --- Sidebar (≥ 640px) -----------------------------------------------------------------

function Sidebar() {
  const t = useTranslations("common");
  const tn = useTranslations("nav");
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    // A remembered choice; read after mount so server and client render the same first.
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCollapsed(localStorage.getItem(COLLAPSED_KEY) === "1");
    } catch {
      /* storage unavailable: keep the default */
    }
  }, []);

  const toggle = () => {
    setCollapsed((value) => {
      try {
        localStorage.setItem(COLLAPSED_KEY, value ? "0" : "1");
      } catch {
        /* ignore */
      }
      return !value;
    });
  };

  // Tablets (640–1023px) always show icons only; desktops follow the user's choice.
  const wide = !collapsed;
  return (
    <nav
      aria-label={tn("main")}
      className={cn(
        "sticky top-0 hidden h-dvh shrink-0 flex-col gap-1 border-r border-line bg-surface px-3 py-5 sm:flex",
        wide ? "w-16 lg:w-[232px]" : "w-16"
      )}
    >
      <Link href="/" className="mb-5 flex h-9 items-center px-1.5">
        <LogoMark size={30} className={cn(wide && "lg:hidden")} />
        <Logo size={30} className={cn("hidden", wide && "lg:inline-flex")} />
      </Link>
      {MAIN_NAV.map((item) => (
        <SidebarLink key={item.href} item={item} wide={wide} />
      ))}
      <div className="min-h-6 flex-1" />
      <SidebarLink item={SETTINGS_NAV} wide={wide} />
      <button
        type="button"
        onClick={toggle}
        aria-label={collapsed ? t("expand") : t("collapse")}
        title={collapsed ? t("expand") : t("collapse")}
        className="hidden h-9 items-center gap-3 rounded-lg px-2.5 text-text-muted hover:bg-surface-2 hover:text-text lg:flex"
      >
        {collapsed ? (
          <ChevronsRight size={18} aria-hidden />
        ) : (
          <ChevronsLeft size={18} aria-hidden />
        )}
      </button>
      <div className="mt-2 border-t border-line pt-3">
        <UserMenu wide={wide} />
      </div>
    </nav>
  );
}

function SidebarLink({ item, wide }: { item: NavItem; wide: boolean }) {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const active = isActive(pathname, item.href);
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      title={t(item.key)}
      className={cn(
        "flex h-10 items-center gap-3 rounded-lg px-2.5 text-sm font-medium transition-colors",
        active
          ? "bg-surface-2 text-text shadow-[inset_3px_0_0_var(--brand)]"
          : "text-text-muted hover:bg-surface-2 hover:text-text"
      )}
    >
      <Icon size={20} aria-hidden className="shrink-0" />
      <span className={cn("hidden truncate", wide && "lg:inline")}>{t(item.key)}</span>
    </Link>
  );
}

function UserMenu({ wide }: { wide: boolean }) {
  const t = useTranslations("common");
  const me = useMe();
  const logout = useLogout();
  const name = me.data?.user.name ?? "";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex h-10 w-full items-center gap-2.5 rounded-lg px-1.5 text-left hover:bg-surface-2">
        <Avatar name={name} src={me.data?.user.avatar} size={32} />
        <span
          className={cn("hidden min-w-0 flex-1 truncate text-sm font-medium", wide && "lg:block")}
        >
          {name ? shortName(name) : ""}
        </span>
        <span className="sr-only">{t("profile")}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="start" className="w-64">
        <DropdownMenuLabel>
          <span className="block truncate text-sm font-medium text-text">{name}</span>
          <span className="block truncate">{me.data?.household.name}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/settings?section=profile">
            <User aria-hidden />
            {t("profile")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <PreferenceRows />
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => logout.mutate()}>
          <LogOut aria-hidden />
          {t("logout")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** The theme and language toggles, as rows in the user menu and the phone's "More" sheet. */
function PreferenceRows() {
  const t = useTranslations("common");
  return (
    <div className="flex flex-col gap-2 px-2.5 py-1.5">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-text-muted">{t("theme")}</span>
        <ThemeToggle size="sm" />
      </div>
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-text-muted">{t("language")}</span>
        <LanguageToggle size="sm" saveToProfile />
      </div>
    </div>
  );
}

// --- Bottom tab bar (< 640px) ----------------------------------------------------------

function BottomBar() {
  const t = useTranslations("nav");
  const tc = useTranslations("common");
  const pathname = usePathname();
  const { open } = useNewEntry();
  const logout = useLogout();
  const [dashboard, entries, fixed] = MAIN_NAV;
  const moreItems = [MAIN_NAV[3], MAIN_NAV[4], SETTINGS_NAV];
  const moreActive = moreItems.some((item) => isActive(pathname, item.href));

  const tab = (item: NavItem) => {
    const Icon = item.icon;
    const active = isActive(pathname, item.href);
    return (
      <Link
        href={item.href}
        aria-current={active ? "page" : undefined}
        className={cn(
          "flex flex-col items-center gap-1 text-[11px] font-medium",
          active ? "text-brand" : "text-text-muted"
        )}
      >
        <Icon size={22} aria-hidden />
        <span className="max-w-full truncate">{t(item.key)}</span>
      </Link>
    );
  };

  return (
    <nav
      aria-label={t("main")}
      className="fixed inset-x-0 bottom-0 z-40 grid h-[calc(68px+env(safe-area-inset-bottom))] grid-cols-5 items-center border-t border-line bg-surface/95 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur sm:hidden"
    >
      {tab(dashboard)}
      {tab(entries)}
      <div className="flex justify-center">
        <Sheet>
          <SheetTrigger
            aria-label={t("newEntry")}
            className="-mt-6 flex size-14 items-center justify-center rounded-full border-4 border-bg bg-brand text-on-brand shadow-lg"
          >
            <Plus size={24} strokeWidth={2.4} aria-hidden />
          </SheetTrigger>
          <SheetContent title={t("newEntry")}>
            {(["expense", "income", "fixed"] as const).map((kind) => (
              <SheetClose key={kind} asChild>
                <button
                  type="button"
                  onClick={() => open(kind)}
                  className="flex h-12 items-center rounded-lg px-3 text-left text-[15px] hover:bg-surface-2"
                >
                  {t(
                    kind === "expense" ? "newExpense" : kind === "income" ? "newIncome" : "newFixed"
                  )}
                </button>
              </SheetClose>
            ))}
          </SheetContent>
        </Sheet>
      </div>
      {tab(fixed)}
      <Sheet>
        <SheetTrigger
          className={cn(
            "flex flex-col items-center gap-1 text-[11px] font-medium",
            moreActive ? "text-brand" : "text-text-muted"
          )}
        >
          <MoreHorizontal size={22} aria-hidden />
          {t("more")}
        </SheetTrigger>
        <SheetContent title={t("more")}>
          {moreItems.map((item) => {
            const Icon = item.icon;
            return (
              <SheetClose key={item.href} asChild>
                <Link
                  href={item.href}
                  className="flex h-12 items-center gap-3 rounded-lg px-3 text-[15px] hover:bg-surface-2"
                >
                  <Icon size={20} aria-hidden className="text-text-muted" />
                  {t(item.key)}
                </Link>
              </SheetClose>
            );
          })}
          <div className="my-2 h-px bg-line" />
          <PreferenceRows />
          <div className="my-2 h-px bg-line" />
          <button
            type="button"
            onClick={() => logout.mutate()}
            className="flex h-12 items-center gap-3 rounded-lg px-3 text-left text-[15px] hover:bg-surface-2"
          >
            <LogOut size={20} aria-hidden className="text-text-muted" />
            {tc("logout")}
          </button>
        </SheetContent>
      </Sheet>
    </nav>
  );
}
