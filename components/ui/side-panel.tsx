"use client";
/** A panel from the right on larger screens, a bottom sheet on phones (frontend.md §6.3). */
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

export function SidePanel({
  open,
  onOpenChange,
  title,
  subtitle,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
}) {
  const t = useTranslations("common");
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-black/50 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          className={cn(
            "fixed z-40 flex flex-col border-line bg-surface text-text outline-none",
            "inset-x-0 bottom-0 max-h-[90dvh] rounded-t-2xl border-t data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom",
            "sm:inset-y-0 sm:right-0 sm:left-auto sm:max-h-none sm:w-[460px] sm:rounded-none sm:border-t-0 sm:border-l sm:data-[state=open]:slide-in-from-right sm:data-[state=open]:slide-in-from-bottom-0"
          )}
        >
          <header className="flex items-start gap-3 border-b border-line px-5 py-4">
            <div className="min-w-0 flex-1">
              <DialogPrimitive.Title className="truncate text-lg font-semibold">
                {title}
              </DialogPrimitive.Title>
              <DialogPrimitive.Description
                className={cn("text-sm text-text-muted", !subtitle && "sr-only")}
              >
                {subtitle ?? title}
              </DialogPrimitive.Description>
            </div>
            <DialogPrimitive.Close
              aria-label={t("close")}
              className="flex size-8 items-center justify-center rounded-lg text-text-muted hover:bg-surface-2 hover:text-text"
            >
              <X size={18} aria-hidden />
            </DialogPrimitive.Close>
          </header>
          <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto px-5 py-4">
            {children}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
