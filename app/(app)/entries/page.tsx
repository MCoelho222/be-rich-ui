import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { EntriesPage } from "@/components/entries/EntriesPage";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTranslations("pages"))("entries") };
}

export default function Page() {
  // The tab, period and filters live in the URL's search params, read on the client.
  return (
    <Suspense>
      <EntriesPage />
    </Suspense>
  );
}
