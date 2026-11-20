import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ComingSoon, PageHeader } from "@/components/shell/PageHeader";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTranslations("pages"))("dashboard") };
}

// The dashboard itself (dashboard.md) is the next step.
export default async function DashboardPage() {
  const t = await getTranslations("pages");
  return (
    <>
      <PageHeader title={t("dashboard")} />
      <ComingSoon />
    </>
  );
}
