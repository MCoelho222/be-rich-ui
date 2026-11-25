import * as React from "react";

import { cn } from "@/lib/utils";

/** Text input (specs/frontend.md §1.4: 8px corners, 40px tall, themed surface). */
function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-10 w-full min-w-0 rounded-lg border border-line-strong bg-surface-2 px-3 text-[15px] text-text transition-[color,box-shadow,border-color] outline-none",
        "placeholder:text-text-faint selection:bg-brand selection:text-on-brand",
        "focus-visible:border-brand focus-visible:shadow-[0_0_0_3px_var(--ring-color)]",
        "aria-invalid:border-negative aria-invalid:focus-visible:shadow-[0_0_0_3px_var(--negative-soft)]",
        "disabled:cursor-not-allowed disabled:opacity-50 read-only:text-text-muted",
        className
      )}
      {...props}
    />
  );
}

export { Input };
