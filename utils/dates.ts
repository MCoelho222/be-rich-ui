  export function formatDate(value: Date | string) {
    const d = value instanceof Date ? value : new Date(value);
    return d.toLocaleDateString("pt-BR");
  }

  export function formatWeekday(value: Date | string) {
    const d = value instanceof Date ? value : new Date(value);
    return d.toLocaleDateString("en-US", { weekday: "short" });
  }
