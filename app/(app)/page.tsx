import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { Dashboard } from "@/components/dashboard/Dashboard";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTranslations("pages"))("dashboard") };
}

export default function DashboardPage() {
  // The view lives in the URL's search params, read on the client.
  return (
    <Suspense>
      <Dashboard />
    </Suspense>
  );
}
