/**
 * Route guard (specs/frontend.md §4). The session cookie's presence is only a hint:
 * the API still decides, and a 401 from any call also returns to /login (lib/api.ts).
 */
import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE = "brs_session";
// Pages a logged-in user has no reason to see.
const GUEST_ONLY = ["/login", "/signup", "/forgot-password"];
// Pages anyone can open: links from emails work whether or not someone is logged in.
const PUBLIC_PREFIXES = ["/reset-password/", "/invite/"];

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const loggedIn = request.cookies.has(SESSION_COOKIE);

  if (PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return NextResponse.next();

  if (GUEST_ONLY.includes(pathname)) {
    return loggedIn ? NextResponse.redirect(new URL("/", request.url)) : NextResponse.next();
  }

  if (!loggedIn) {
    const login = new URL("/login", request.url);
    if (pathname !== "/") login.searchParams.set("next", pathname + search);
    return NextResponse.redirect(login);
  }
  return NextResponse.next();
}

export const config = {
  // Everything except the API, Next internals and files with an extension (icons, images).
  matcher: ["/((?!api/|_next/|.*\\..*).*)"],
};
