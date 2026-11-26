import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { InvestmentsPage } from "@/components/investments/InvestmentsPage";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTranslations("pages"))("investments") };
}

export default function Page() {
  return <InvestmentsPage />;
}
