import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { LogoMark } from "@/components/brand/Logo";

export default async function NotFound() {
  const t = await getTranslations("pages");
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-bg px-4 text-center">
      <LogoMark size={44} />
      <h1 className="text-2xl font-semibold">{t("notFound")}</h1>
      <p className="text-sm text-text-muted">{t("notFoundBody")}</p>
      <Link href="/" className="text-sm text-brand hover:text-brand-hover hover:underline">
        {t("goHome")}
      </Link>
    </main>
  );
}
