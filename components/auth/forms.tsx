"use client";
/** The public pages' forms (specs/frontend.md §5, auth.md §4). */
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { api, ApiError } from "@/lib/api";
import type { Me } from "@/lib/auth";
import { useErrorMessage } from "@/lib/errors";
import {
  applyFieldErrors,
  emailField,
  passwordField,
  requiredText,
  safeNext,
  useFieldError,
} from "@/lib/forms";
import { LANG_COOKIE, ONE_YEAR } from "@/i18n/config";
import { AuthCard } from "./AuthCard";
import { Field, FormError, FormNotice, PasswordField, SubmitButton } from "./fields";

const linkClass = "text-brand hover:text-brand-hover hover:underline underline-offset-4";

/** After login or signup: adopt the user's saved language, then load the app with fresh server state. */
function enterApp(me: Me, next: string) {
  document.cookie = `${LANG_COOKIE}=${me.user.language}; path=/; max-age=${ONE_YEAR}; samesite=lax`;
  window.location.assign(safeNext(next));
}

// --- Login ---------------------------------------------------------------------------

const loginSchema = z.object({ email: emailField, password: z.string().min(1, "required") });

export function LoginForm({ next }: { next?: string }) {
  const t = useTranslations("auth");
  const fieldError = useFieldError();
  const errorMessage = useErrorMessage();
  const form = useForm<z.infer<typeof loginSchema>>({ resolver: zodResolver(loginSchema) });
  const login = useMutation({
    mutationFn: (body: z.infer<typeof loginSchema>) =>
      api.post<Me>("auth/login", body, { allowUnauthenticated: true }),
    onSuccess: (me) => enterApp(me, next ?? "/"),
  });
  const { errors } = form.formState;

  return (
    <div className="flex flex-col gap-5">
      <AuthCard>
        <form
          noValidate
          onSubmit={form.handleSubmit((values) => login.mutate(values))}
          className="flex flex-col gap-[18px]"
        >
          <Field
            label={t("email")}
            type="email"
            autoComplete="email"
            autoFocus
            error={fieldError(errors.email?.message)}
            {...form.register("email")}
          />
          <PasswordField
            label={t("password")}
            autoComplete="current-password"
            error={fieldError(errors.password?.message)}
            aside={
              <Link href="/forgot-password" className={`text-[13px] ${linkClass}`}>
                {t("login.forgot")}
              </Link>
            }
            {...form.register("password")}
          />
          <FormError message={login.isError ? errorMessage(login.error) : null} />
          <SubmitButton pending={login.isPending || login.isSuccess}>
            {t("login.submit")}
          </SubmitButton>
        </form>
      </AuthCard>
      <p className="text-center text-sm text-text-muted">
        {t("login.newHere")}{" "}
        <Link href="/signup" className={linkClass}>
          {t("login.create")}
        </Link>
      </p>
    </div>
  );
}

// --- Signup (also used to accept an invitation) --------------------------------------

const signupSchema = z.object({
  name: requiredText(100),
  email: emailField,
  password: passwordField,
});
type SignupValues = z.infer<typeof signupSchema>;

function SignupFields({
  invitationToken,
  lockedEmail,
  submitLabel,
}: {
  invitationToken?: string;
  lockedEmail?: string;
  submitLabel: string;
}) {
  const t = useTranslations("auth");
  const locale = useLocale();
  const fieldError = useFieldError();
  const errorMessage = useErrorMessage();
  const form = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: { email: lockedEmail ?? "" },
  });
  const signup = useMutation({
    mutationFn: (values: SignupValues) =>
      api.post<Me>(
        "auth/signup",
        { ...values, language: locale, invitation_token: invitationToken },
        { allowUnauthenticated: true }
      ),
    onSuccess: (me) => enterApp(me, "/"),
    onError: (error) => applyFieldErrors(error, form.setError, ["name", "email", "password"]),
  });
  const { errors } = form.formState;
  const fieldErrorsShown =
    signup.error instanceof ApiError && Object.keys(signup.error.fields).length > 0;

  return (
    <form
      noValidate
      onSubmit={form.handleSubmit((values) => signup.mutate(values))}
      className="flex flex-col gap-[18px]"
    >
      <Field
        label={t("name")}
        autoComplete="name"
        autoFocus
        error={fieldError(errors.name?.message)}
        {...form.register("name")}
      />
      <Field
        label={t("email")}
        type="email"
        autoComplete="email"
        readOnly={!!lockedEmail}
        error={fieldError(errors.email?.message)}
        {...form.register("email")}
      />
      <PasswordField
        label={t("password")}
        autoComplete="new-password"
        hint={t("signup.passwordHint")}
        error={fieldError(errors.password?.message)}
        {...form.register("password")}
      />
      <FormError
        message={signup.isError && !fieldErrorsShown ? errorMessage(signup.error) : null}
      />
      <SubmitButton pending={signup.isPending || signup.isSuccess}>{submitLabel}</SubmitButton>
    </form>
  );
}

export function SignupForm() {
  const t = useTranslations("auth");
  return (
    <div className="flex flex-col gap-5">
      <AuthCard title={t("signup.title")}>
        <SignupFields submitLabel={t("signup.submit")} />
      </AuthCard>
      <p className="text-center text-sm text-text-muted">
        {t("signup.haveAccount")}{" "}
        <Link href="/login" className={linkClass}>
          {t("signup.login")}
        </Link>
      </p>
    </div>
  );
}

// --- Invitation ------------------------------------------------------------------------

interface InvitationLookup {
  household_name: string;
  email: string;
  invited_by_name: string;
}

export function InviteForm({ token }: { token: string }) {
  const t = useTranslations("auth");
  const lookup = useQuery({
    queryKey: ["invitation", token],
    queryFn: () =>
      api.get<InvitationLookup>("invitations/lookup", { token }, { allowUnauthenticated: true }),
    retry: false,
  });

  if (lookup.isPending) {
    return (
      <AuthCard>
        <p className="text-center text-sm text-text-muted">{t("invite.checking")}</p>
      </AuthCard>
    );
  }
  if (lookup.isError) {
    return (
      <AuthCard>
        <FormNotice>{t("invite.invalid")}</FormNotice>
        <Link href="/login" className={`text-center text-sm ${linkClass}`}>
          {t("forgot.backToLogin")}
        </Link>
      </AuthCard>
    );
  }
  const { household_name: household, invited_by_name: inviter, email } = lookup.data;
  return (
    <AuthCard title={t("invite.title", { household })}>
      <p className="-mt-2 text-center text-sm text-text-muted">
        {t("invite.intro", { inviter, household })}
      </p>
      <SignupFields invitationToken={token} lockedEmail={email} submitLabel={t("invite.submit")} />
    </AuthCard>
  );
}

// --- Forgot password -------------------------------------------------------------------

const forgotSchema = z.object({ email: emailField });

export function ForgotPasswordForm() {
  const t = useTranslations("auth");
  const fieldError = useFieldError();
  const errorMessage = useErrorMessage();
  const form = useForm<z.infer<typeof forgotSchema>>({ resolver: zodResolver(forgotSchema) });
  const send = useMutation({
    mutationFn: (body: z.infer<typeof forgotSchema>) =>
      api.post<void>("auth/password-reset/request", body, { allowUnauthenticated: true }),
  });

  return (
    <div className="flex flex-col gap-5">
      <AuthCard title={t("forgot.title")}>
        {send.isSuccess ? (
          <FormNotice>{t("forgot.sent")}</FormNotice>
        ) : (
          <form
            noValidate
            onSubmit={form.handleSubmit((values) => send.mutate(values))}
            className="flex flex-col gap-[18px]"
          >
            <p className="-mt-2 text-center text-sm text-text-muted">{t("forgot.intro")}</p>
            <Field
              label={t("email")}
              type="email"
              autoComplete="email"
              autoFocus
              error={fieldError(form.formState.errors.email?.message)}
              {...form.register("email")}
            />
            <FormError message={send.isError ? errorMessage(send.error) : null} />
            <SubmitButton pending={send.isPending}>{t("forgot.submit")}</SubmitButton>
          </form>
        )}
      </AuthCard>
      <p className="text-center text-sm">
        <Link href="/login" className={linkClass}>
          {t("forgot.backToLogin")}
        </Link>
      </p>
    </div>
  );
}

// --- Reset password --------------------------------------------------------------------

const resetSchema = z
  .object({ password: passwordField, confirm: z.string() })
  .refine((v) => v.password === v.confirm, { path: ["confirm"], message: "mismatch" });

export function ResetPasswordForm({ token }: { token: string }) {
  const t = useTranslations("auth");
  const fieldError = useFieldError();
  const errorMessage = useErrorMessage();
  const [done, setDone] = useState(false);
  const form = useForm<z.infer<typeof resetSchema>>({ resolver: zodResolver(resetSchema) });
  const reset = useMutation({
    mutationFn: (values: z.infer<typeof resetSchema>) =>
      api.post<void>(
        "auth/password-reset/confirm",
        { token, new_password: values.password },
        { allowUnauthenticated: true }
      ),
    onSuccess: () => setDone(true),
  });
  const { errors } = form.formState;
  const confirmError =
    errors.confirm?.message === "mismatch"
      ? t("reset.mismatch")
      : fieldError(errors.confirm?.message);

  return (
    <AuthCard title={t("reset.title")}>
      {done ? (
        <>
          <FormNotice>{t("reset.done")}</FormNotice>
          <Link href="/login" className={`text-center text-sm ${linkClass}`}>
            {t("login.submit")}
          </Link>
        </>
      ) : (
        <form
          noValidate
          onSubmit={form.handleSubmit((values) => reset.mutate(values))}
          className="flex flex-col gap-[18px]"
        >
          <PasswordField
            label={t("newPassword")}
            autoComplete="new-password"
            autoFocus
            hint={t("signup.passwordHint")}
            error={fieldError(errors.password?.message)}
            {...form.register("password")}
          />
          <PasswordField
            label={t("confirmPassword")}
            autoComplete="new-password"
            error={confirmError}
            {...form.register("confirm")}
          />
          <FormError message={reset.isError ? errorMessage(reset.error) : null} />
          <SubmitButton pending={reset.isPending}>{t("reset.submit")}</SubmitButton>
        </form>
      )}
    </AuthCard>
  );
}
