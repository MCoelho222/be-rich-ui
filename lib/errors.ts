"use client";
/** Turns API errors into translated messages (specs/frontend.md §2: translate by error code). */
import { useTranslations } from "next-intl";
import { ApiError } from "./api";

const KNOWN_CODES = new Set([
  "INVALID_CREDENTIALS",
  "RATE_LIMITED",
  "EMAIL_TAKEN",
  "TOKEN_INVALID",
  "INVITATION_INVALID",
  "VALIDATION_ERROR",
  "NETWORK",
]);

export function useErrorMessage() {
  const t = useTranslations("errors");
  return (error: unknown): string => {
    if (!(error instanceof ApiError)) return t("UNKNOWN");
    if (error.code === "RATE_LIMITED") {
      return t("RATE_LIMITED", { minutes: Math.max(1, Math.ceil((error.retryAfter ?? 60) / 60)) });
    }
    if (KNOWN_CODES.has(error.code)) return t(error.code as "NETWORK");
    // Unknown codes fall back to the API's own message.
    return error.message || t("UNKNOWN");
  };
}
