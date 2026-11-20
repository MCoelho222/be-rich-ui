"use client";
/** Form pieces shared by the public pages. */
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { forwardRef, useId, useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface FieldProps extends React.ComponentProps<"input"> {
  label: string;
  error?: string;
  hint?: string;
  /** Rendered at the right of the label (e.g. "Forgot password?"). */
  aside?: React.ReactNode;
  /** Rendered inside the input, at its right edge (e.g. the show-password button). */
  trailing?: React.ReactNode;
}

export const Field = forwardRef<HTMLInputElement, FieldProps>(function Field(
  { label, error, hint, aside, trailing, id, ...props },
  ref
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const describedBy = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined;
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between">
        <label htmlFor={inputId} className="text-[13px] font-medium text-text-2">
          {label}
        </label>
        {aside}
      </div>
      <div className="relative">
        <Input ref={ref} id={inputId} aria-invalid={!!error} aria-describedby={describedBy} {...props} />
        {trailing && <div className="absolute top-1 right-1">{trailing}</div>}
      </div>
      {error ? (
        <p id={`${inputId}-error`} className="text-[13px] text-negative">
          {error}
        </p>
      ) : hint ? (
        <p id={`${inputId}-hint`} className="text-[13px] text-text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
});

export const PasswordField = forwardRef<HTMLInputElement, Omit<FieldProps, "type">>(function PasswordField(
  { className, ...props },
  ref
) {
  const t = useTranslations("common");
  const [visible, setVisible] = useState(false);
  return (
    <Field
      ref={ref}
      type={visible ? "text" : "password"}
      className={cn("pr-11", className)}
      trailing={
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? t("hidePassword") : t("showPassword")}
          aria-pressed={visible}
          className="flex size-8 items-center justify-center rounded-md text-text-muted hover:text-text"
        >
          {visible ? <EyeOff size={18} aria-hidden /> : <Eye size={18} aria-hidden />}
        </button>
      }
      {...props}
    />
  );
});

export function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-lg bg-negative-soft px-3 py-2 text-[13px] text-negative">
      {message}
    </p>
  );
}

export function FormNotice({ children }: { children: React.ReactNode }) {
  return (
    <p role="status" className="rounded-lg bg-surface-2 px-3 py-2.5 text-sm text-text-2">
      {children}
    </p>
  );
}

export function SubmitButton({ pending, children }: { pending: boolean; children: React.ReactNode }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-1 flex h-11 items-center justify-center gap-2 rounded-lg bg-brand text-[15px] font-semibold text-on-brand transition-colors hover:bg-brand-hover disabled:opacity-70"
    >
      {pending && <Loader2 size={16} className="animate-spin" aria-hidden />}
      {children}
    </button>
  );
}
