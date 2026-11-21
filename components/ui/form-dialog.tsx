"use client";
/** A dialog on larger screens, a full-height bottom sheet on phones (frontend.md §3.3). */
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

export function FormDialog({
  open,
  onOpenChange,
  title,
  description,
  headerExtra,
  footer,
  children,
  width = "md",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  headerExtra?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
  width?: "sm" | "md";
}) {
  const t = useTranslations("common");
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          className={cn(
            "fixed z-50 flex flex-col border border-line bg-surface text-text outline-none",
            // Phones: bottom sheet
            "inset-x-0 bottom-0 max-h-[94dvh] rounded-t-2xl data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom",
            // Larger screens: centered dialog
            "sm:inset-x-auto sm:top-1/2 sm:bottom-auto sm:left-1/2 sm:max-h-[90dvh] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl sm:data-[state=open]:fade-in-0 sm:data-[state=open]:zoom-in-95 sm:data-[state=open]:slide-in-from-bottom-0",
            width === "md" ? "sm:w-[600px]" : "sm:w-[440px]"
          )}
        >
          <header className="flex items-center gap-3 border-b border-line px-5 py-4 sm:px-6">
            <div className="flex-1">
              <DialogPrimitive.Title className="text-lg font-semibold">
                {title}
              </DialogPrimitive.Title>
              <DialogPrimitive.Description
                className={cn("text-sm text-text-muted", !description && "sr-only")}
              >
                {description ?? title}
              </DialogPrimitive.Description>
            </div>
            {headerExtra}
            <DialogPrimitive.Close
              aria-label={t("close")}
              className="flex size-8 items-center justify-center rounded-lg text-text-muted hover:bg-surface-2 hover:text-text"
            >
              <X size={18} aria-hidden />
            </DialogPrimitive.Close>
          </header>
          <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
            {children}
          </div>
          {footer && (
            <footer className="flex justify-end gap-2.5 border-t border-line px-5 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:px-6 sm:pb-4">
              {footer}
            </footer>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

export function SecondaryButton(props: React.ComponentProps<"button">) {
  return (
    <button
      type="button"
      {...props}
      className={cn(
        "h-10 rounded-lg border border-line-strong px-4 text-sm font-medium text-text hover:bg-surface-2 disabled:opacity-50",
        props.className
      )}
    />
  );
}

export function PrimaryButton({
  danger,
  ...props
}: React.ComponentProps<"button"> & { danger?: boolean }) {
  return (
    <button
      type="button"
      {...props}
      className={cn(
        "inline-flex h-10 items-center justify-center gap-2 rounded-lg px-5 text-sm font-semibold disabled:opacity-50",
        danger
          ? "bg-negative text-white hover:opacity-90"
          : "bg-brand text-on-brand hover:bg-brand-hover",
        props.className
      )}
    />
  );
}
