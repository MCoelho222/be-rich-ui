export function toSnakeCaseKeys<T extends Record<string, any>>(obj: T) {
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [
      k.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`),
      v,
    ])
  ) as any;
}
