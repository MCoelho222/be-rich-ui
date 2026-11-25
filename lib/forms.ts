"use client";
/**
 * Validation helpers. Schema messages are keys under "errors" in messages/*.json, so the
 * same schema shows English or Portuguese messages. API field errors are mapped onto the form.
 */
import { useTranslations } from "next-intl";
import type { FieldValues, Path, UseFormSetError } from "react-hook-form";
import { z } from "zod";
import { ApiError } from "./api";

export const emailField = z.string().trim().min(1, "required").email("invalidEmail");
// auth.md §6: 8 to 128 characters, no composition rules.
export const passwordField = z.string().min(8, "passwordLength").max(128, "passwordLength");
export const requiredText = (max: number) => z.string().trim().min(1, "required").max(max);

/** Translates a schema message key; unknown keys (API messages) are shown as they are. */
export function useFieldError() {
  const t = useTranslations("errors");
  return (message: string | undefined) =>
    message ? (t.has(message as "required") ? t(message as "required") : message) : undefined;
}

/** Puts API field errors (api.md §2) on the matching form fields. Returns true if any matched. */
export function applyFieldErrors<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  fields: Path<T>[]
): boolean {
  if (!(error instanceof ApiError)) return false;
  let matched = false;
  for (const [field, messages] of Object.entries(error.fields)) {
    if ((fields as string[]).includes(field)) {
      setError(field as Path<T>, { message: messages[0] });
      matched = true;
    }
  }
  return matched;
}

/** Only same-site paths are allowed as a post-login destination. */
export function safeNext(next: string | null | undefined): string {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
}
