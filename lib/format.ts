/** Display formats (ui-behavior.md §1.1). Brazilian formats in both languages (frontend.md §2). */

/** "Marcelo Coelho" → "Marcelo C."; a one-word name stays as is. */
export function shortName(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length < 2) return parts[0] ?? "";
  return `${parts[0]} ${parts[parts.length - 1][0]?.toUpperCase()}.`;
}

export function initial(name: string): string {
  return name.trim()[0]?.toUpperCase() ?? "?";
}
