import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ComingSoon, PageHeader } from "@/components/shell/PageHeader";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTranslations("pages"))("accounts") };
}

export default async function AccountsPage() {
  const t = await getTranslations("pages");
  return (
    <>
      <PageHeader title={t("accounts")} />
      <ComingSoon />
    </>
  );
}
