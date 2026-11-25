import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { FixedPage } from "@/components/fixed/FixedPage";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTranslations("pages"))("fixed") };
}

export default function Page() {
  // The tab, status and the open entry live in the URL, read on the client.
  return (
    <Suspense>
      <FixedPage />
    </Suspense>
  );
}
