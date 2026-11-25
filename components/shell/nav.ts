import {
  ArrowDownUp,
  CreditCard,
  LayoutDashboard,
  Repeat,
  Settings,
  Tag,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  key: "dashboard" | "entries" | "fixed" | "accounts" | "categories" | "settings";
  icon: LucideIcon;
}

/** Sidebar order (specs/frontend.md §3.1); settings sits apart at the bottom. */
export const MAIN_NAV: NavItem[] = [
  { href: "/", key: "dashboard", icon: LayoutDashboard },
  { href: "/entries", key: "entries", icon: ArrowDownUp },
  { href: "/fixed", key: "fixed", icon: Repeat },
  { href: "/accounts", key: "accounts", icon: CreditCard },
  { href: "/categories", key: "categories", icon: Tag },
];

export const SETTINGS_NAV: NavItem = { href: "/settings", key: "settings", icon: Settings };

export function isActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}
