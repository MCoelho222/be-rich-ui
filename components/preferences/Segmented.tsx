"use client";
/** A small segmented control: the shape of the language and theme toggles. */
import { cn } from "@/lib/utils";

export interface SegmentOption<T extends string> {
  value: T;
  label: React.ReactNode;
  /** Accessible name when the label is an icon. */
  title?: string;
}

interface SegmentedProps<T extends string> {
  label: string;
  value: T;
  options: SegmentOption<T>[];
  onChange: (value: T) => void;
  size?: "sm" | "md";
  className?: string;
}

export function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
  size = "md",
  className,
}: SegmentedProps<T>) {
  // A radio group is one Tab stop; the arrow keys move the choice (WAI-ARIA radio group).
  const move = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const step =
      event.key === "ArrowRight" || event.key === "ArrowDown"
        ? 1
        : event.key === "ArrowLeft" || event.key === "ArrowUp"
          ? -1
          : 0;
    if (!step) return;
    event.preventDefault();
    const index = options.findIndex((o) => o.value === value);
    const next = (index + step + options.length) % options.length;
    onChange(options[next].value);
    const buttons = event.currentTarget.querySelectorAll<HTMLButtonElement>("[role=radio]");
    buttons[next]?.focus();
  };

  return (
    <div
      role="radiogroup"
      aria-label={label}
      onKeyDown={move}
      className={cn(
        "inline-flex gap-0.5 rounded-lg border border-line bg-surface p-0.5",
        className
      )}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            tabIndex={active || !options.some((o) => o.value === value) ? 0 : -1}
            aria-label={option.title}
            title={option.title}
            onClick={() => onChange(option.value)}
            className={cn(
              "inline-flex items-center justify-center rounded-md font-semibold transition-colors",
              size === "sm"
                ? "h-6 min-w-7 px-1.5 text-[11px]"
                : "h-9 min-w-10 px-2 text-xs sm:h-7 sm:min-w-9",
              active ? "bg-surface-2 text-text" : "text-text-muted hover:text-text"
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
