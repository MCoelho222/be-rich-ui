import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { cookies } from "next/headers";
import { NextIntlClientProvider } from "next-intl";
import { getLocale } from "next-intl/server";
import { THEME_COOKIE, isTheme } from "@/i18n/config";
import { Providers } from "./providers";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "Be Rich", template: "%s · Be Rich" },
  description: "Household finances: entries, fixed expenses, balances and projections.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f7f9" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1120" },
  ],
};

// Resolves the "system" theme before the first paint, so there is no flash (frontend.md §1.2).
const systemThemeScript = `(function(){try{var d=window.matchMedia('(prefers-color-scheme: dark)').matches;var c=document.documentElement.classList;c.add(d?'dark':'light');}catch(e){}})();`;

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const saved = (await cookies()).get(THEME_COOKIE)?.value;
  const theme = isTheme(saved) ? saved : "system";
  const locale = await getLocale();

  return (
    <html
      lang={locale === "pt" ? "pt-BR" : "en"}
      className={theme === "system" ? undefined : theme}
      suppressHydrationWarning
    >
      <head>{theme === "system" && <script dangerouslySetInnerHTML={{ __html: systemThemeScript }} />}</head>
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans`}>
        <NextIntlClientProvider>
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
