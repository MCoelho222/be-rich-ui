import * as React from "react";
import { cn } from "@/lib/utils";
import { colorClasses } from "@/config/colors";

interface EditIconProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string;
}

export const EditIcon = React.forwardRef<HTMLButtonElement, EditIconProps>(
  ({ className, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        className={cn(
          "inline-flex items-center justify-center rounded-md p-2 text-sm font-medium transition-colors",
          "hover:bg-accent hover:text-accent-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
          "disabled:pointer-events-none disabled:opacity-50",
          className
        )}
        {...props}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`${colorClasses.text.primary} hover:${colorClasses.text.secondary}`}
        >
          <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
          <path d="m15 5 4 4" />
        </svg>
      </button>
    );
  }
);

EditIcon.displayName = "EditIcon";
