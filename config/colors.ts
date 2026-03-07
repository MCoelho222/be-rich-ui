/**
 * Centralized color configuration with semantic naming using Tailwind CSS classes
 * These colors define the visual language of the application
 *
 * Usage:
 * import { colorClasses } from "@/config/colors";
 * <div className={colorClasses.text.primary}>Text</div>
 */

export const colorClasses = {
  // Text colors - for content, labels, and muted text
  text: {
    primary: "text-slate-500", // Main content text
    secondary: "text-slate-400", // Muted/less important text
    label: "text-slate-700", // Form labels and headings
    muted: "text-slate-300", // Placeholder and disabled text
  },

  // Financial data colors - semantic colors for income, expenses, and fixed entries
  financial: {
    income: "text-emerald-500", // Positive/income transactions
    expense: "text-rose-400", // Negative/expense transactions
    fixed: "text-blue-700", // Recurring/fixed entries
  },

  // State colors - for errors, success, warnings, and info messages
  state: {
    error: "text-red-500", // Error messages
    success: "text-emerald-500", // Success states
    warning: "text-amber-500", // Warnings
    info: "text-blue-500", // Informational messages
  },

  // Surface colors - backgrounds, panels, headers, and borders
  surface: {
    background: "bg-white", // Main background
    panel: "bg-slate-50", // Panel/card background
    header: "bg-slate-700", // Table header background
    border: "border-slate-200", // Borders and dividers
  },

  // Interactive states - hover and focus states
  interactive: {
    hover: "hover:bg-slate-800/60", // Hover state for dark backgrounds
    hoverLight: "hover:bg-slate-100/80", // Hover state for light backgrounds
  },
} as const;
