import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { InviteForm } from "@/components/auth/forms";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTranslations("auth.invite"))("submit") };
}

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <InviteForm token={token} />;
}
