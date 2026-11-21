/**
 * The one way the UI talks to the API (specs/frontend.md §7.2).
 *
 * - Same origin: cookies go with every request; no CORS.
 * - Writes carry the double-submit CSRF header read from the brs_csrf cookie (auth.md §3.2).
 * - Errors become ApiError with the envelope's code, message and field errors (api.md §2).
 * - A 401 on an app page sends the user to /login, keeping where they were.
 */
import type { components } from "./api-types";

export type Schemas = components["schemas"];

export const API_BASE = "/api/v1";
const CSRF_COOKIE = "brs_csrf";
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly fields: Record<string, string[]> = {},
    readonly retryAfter: number | null = null,
    /** IN_USE responses say what uses the record (api.md §2). */
    readonly usage: Record<string, number> | null = null
  ) {
    super(message);
  }
}

type Query = Record<string, string | number | boolean | null | undefined>;

interface RequestOptions {
  query?: Query;
  body?: unknown;
  /** Don't redirect to /login on 401 (public pages and the login form itself). */
  allowUnauthenticated?: boolean;
  signal?: AbortSignal;
}

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.split("; ").find((c) => c.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
}

function buildUrl(path: string, query?: Query): string {
  const url = `${API_BASE}/${path.replace(/^\//, "")}`;
  if (!query) return url;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== "") params.set(key, String(value));
  }
  const qs = params.toString();
  return qs ? `${url}?${qs}` : url;
}

function redirectToLogin() {
  if (typeof window === "undefined" || window.location.pathname === "/login") return;
  const next = window.location.pathname + window.location.search;
  window.location.assign(`/login?next=${encodeURIComponent(next)}`);
}

export async function request<T>(
  method: string,
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (options.body !== undefined) headers["Content-Type"] = "application/json";
  if (!SAFE_METHODS.has(method)) {
    const csrf = readCookie(CSRF_COOKIE);
    if (csrf) headers["X-CSRF-Token"] = csrf;
  }

  let response: Response;
  try {
    response = await fetch(buildUrl(path, options.query), {
      method,
      headers,
      credentials: "same-origin",
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: options.signal,
    });
  } catch (error) {
    if ((error as Error).name === "AbortError") throw error;
    throw new ApiError(0, "NETWORK", "Network error");
  }

  if (response.status === 204 || response.status === 202) {
    return undefined as T;
  }
  const data = await response.json().catch(() => null);
  if (response.ok) return data as T;

  if (response.status === 401 && !options.allowUnauthenticated) redirectToLogin();
  const envelope = data?.error ?? {};
  const retryAfter = Number(response.headers.get("Retry-After")) || null;
  throw new ApiError(
    response.status,
    envelope.code ?? "UNKNOWN",
    envelope.message ?? response.statusText,
    envelope.fields ?? {},
    retryAfter,
    envelope.usage ?? data?.usage ?? null
  );
}

export const api = {
  request,
  get: <T>(path: string, query?: Query, options?: Omit<RequestOptions, "query" | "body">) =>
    request<T>("GET", path, { ...options, query }),
  post: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, "body">) =>
    request<T>("POST", path, { ...options, body }),
  patch: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, "body">) =>
    request<T>("PATCH", path, { ...options, body }),
  delete: <T = void>(path: string, options?: Omit<RequestOptions, "body">) =>
    request<T>("DELETE", path, options),
};
