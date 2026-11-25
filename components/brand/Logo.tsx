/** The Be Rich mark and lockup (specs/frontend.md §1.6). Colors come from the theme tokens. */
import { cn } from "@/lib/utils";

export function LogoMark({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      role="img"
      aria-label="Be Rich"
      className={cn("shrink-0", className)}
    >
      <rect width="32" height="32" rx="9" fill="var(--brand)" />
      <path
        d="M8 21.5l5-5 3.5 3L24 12M19.5 11.5H24.5V16.5"
        fill="none"
        stroke="var(--on-brand)"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Logo({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark size={size} />
      <span className="font-semibold tracking-tight" style={{ fontSize: size * 0.68 }}>
        Be <span className="text-income">Rich</span>
      </span>
    </span>
  );
}
