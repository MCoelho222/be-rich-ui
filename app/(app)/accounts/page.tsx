import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AccountsPage } from "@/components/accounts/AccountsPage";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTranslations("pages"))("accounts") };
}

export default function Page() {
  return <AccountsPage />;
}
