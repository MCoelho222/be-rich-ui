import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ComingSoon, PageHeader } from "@/components/shell/PageHeader";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTranslations("pages"))("categories") };
}

export default async function CategoriesPage() {
  const t = await getTranslations("pages");
  return (
    <>
      <PageHeader title={t("categories")} />
      <ComingSoon />
    </>
  );
}
