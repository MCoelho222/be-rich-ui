/** The single centered card every public page uses (specs/frontend.md §5). */
import { Logo } from "@/components/brand/Logo";
import { LanguageToggle, ThemeToggle } from "@/components/preferences/Toggles";
import { getTranslations } from "next-intl/server";

export async function AuthLayout({ children }: { children: React.ReactNode }) {
  const t = await getTranslations("common");
  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-bg px-4 py-16">
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-1/2 size-[560px] -translate-x-1/2 -translate-y-[58%] rounded-full"
        style={{ background: "radial-gradient(circle, var(--glow) 0%, transparent 70%)" }}
      />
      <div className="absolute top-4 right-4 flex gap-2 sm:top-6 sm:right-6">
        <ThemeToggle />
        <LanguageToggle />
      </div>
      <main className="relative w-full max-w-[400px]">
        <div className="mb-7 flex flex-col items-center gap-3">
          <Logo size={40} />
          <p className="text-sm text-text-muted">{t("tagline")}</p>
        </div>
        {children}
      </main>
    </div>
  );
}

export function AuthCard({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-6 rounded-2xl border border-line bg-surface px-6 py-8 sm:px-9">
      {title && <h1 className="text-center text-lg font-semibold">{title}</h1>}
      {children}
    </section>
  );
}
