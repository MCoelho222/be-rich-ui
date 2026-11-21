import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { CategoriesPage } from "@/components/categories/CategoriesPage";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTranslations("pages"))("categories") };
}

export default function Page() {
  return <CategoriesPage />;
}
