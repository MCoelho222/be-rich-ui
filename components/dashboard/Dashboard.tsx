"use client";
/** The home screen (dashboard.md). Each widget loads on its own. */
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { PageHeader } from "@/components/shell/PageHeader";
import { useMe } from "@/lib/auth";
import { useAccounts, type ReportFilters } from "@/lib/queries";
import { CardBills } from "./CardBills";
import { CategoryBreakdown } from "./CategoryBreakdown";
import { EntryList } from "./EntryList";
import { FilterBar } from "./FilterBar";
import { OverduePanel } from "./OverduePanel";
import { ProjectionChart } from "./ProjectionChart";
import { SummaryCards } from "./SummaryCards";
import { useDashboardView } from "./view";
import { Skeleton } from "./Widget";

export function Dashboard() {
  const t = useTranslations("pages");
  const { view, update, clearMissingAccount, today } = useDashboardView();
  const me = useMe();
  const accounts = useAccounts();

  // A remembered account that no longer exists falls back to "All accounts" (dashboard.md §3.3).
  const missingAccount =
    !!view.accountId && accounts.isSuccess && !accounts.data.some((a) => a.id === view.accountId);
  useEffect(() => {
    if (missingAccount) clearMissingAccount();
  }, [missingAccount, clearMissingAccount]);

  // "Me" needs the signed-in user's id before anything is fetched.
  const ready = !view.member || me.isSuccess;
  const filters: ReportFilters = {
    accountId: view.accountId,
    memberId: view.member ? me.data?.user.id : null,
  };

  return (
    <>
      <PageHeader title={t("dashboard")}>
        <FilterBar view={view} update={update} />
      </PageHeader>
      <div className="flex flex-col gap-4 px-4 pt-3 pb-10 sm:gap-6 sm:px-8">
        <OverduePanel />
        {ready ? (
          <>
            <SummaryCards view={view} filters={filters} today={today} />
            <ProjectionChart view={view} filters={filters} />
            <div className="grid gap-4 sm:gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
              <CategoryBreakdown view={view} update={update} filters={filters} />
              <CardBills filters={filters} />
            </div>
            <EntryList view={view} filters={filters} />
          </>
        ) : (
          <Skeleton className="h-[480px] w-full rounded-xl" />
        )}
      </div>
    </>
  );
}
