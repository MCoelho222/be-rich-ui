import { cookies, headers } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import { LANG_COOKIE, isLocale, localeFromAcceptLanguage } from "./config";

// No locale in the URL: the brs_lang cookie decides, then the browser's language.
export default getRequestConfig(async () => {
  const saved = (await cookies()).get(LANG_COOKIE)?.value;
  const locale = isLocale(saved) ? saved : localeFromAcceptLanguage((await headers()).get("accept-language"));
  return {
    locale,
    timeZone: "America/Sao_Paulo",
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
