import { NextRequest, NextResponse } from "next/server";

// Better Auth sets a session cookie named "better-auth.session_token" by default.
// This is a lightweight presence check (fast, no DB call) — actual session
// validation still happens server-side wherever you call auth.api.getSession().
//
// Deliberately one-directional: only redirect away from protected paths when
// the cookie is missing. We do NOT redirect away from /login when a cookie is
// merely present, because "present" doesn't mean "valid" — a stale cookie
// (deleted user, expired session) would pass this check, get bounced to
// /library, fail the real DB-backed session check there, get redirect()'d
// back to /login, and loop forever (ERR_TOO_MANY_REDIRECTS), locking the user
// out of the login form entirely.
const PROTECTED_PATHS = ["/library", "/reader"];

export function middleware(req: NextRequest) {
  const sessionCookie = req.cookies.get("better-auth.session_token");
  const { pathname } = req.nextUrl;

  const isProtected = PROTECTED_PATHS.some((p) => pathname.startsWith(p));

  if (isProtected && !sessionCookie) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/library/:path*", "/reader/:path*"],
};
