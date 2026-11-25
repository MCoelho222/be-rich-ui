import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { SettingsPage } from "@/components/settings/SettingsPage";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTranslations("pages"))("settings") };
}

export default function Page() {
  // The open section lives in the URL (?section=…), read on the client.
  return (
    <Suspense>
      <SettingsPage />
    </Suspense>
  );
}
