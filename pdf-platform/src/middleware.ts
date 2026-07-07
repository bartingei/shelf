import { NextRequest, NextResponse } from "next/server";

// Better Auth sets a session cookie named "better-auth.session_token" by default.
// This is a lightweight presence check (fast, no DB call) — actual session
// validation still happens server-side wherever you call auth.api.getSession().
const PROTECTED_PATHS = ["/library", "/reader"];
const AUTH_PATHS = ["/login", "/signup"];

export function middleware(req: NextRequest) {
  const sessionCookie = req.cookies.get("better-auth.session_token");
  const { pathname } = req.nextUrl;

  const isProtected = PROTECTED_PATHS.some((p) => pathname.startsWith(p));
  const isAuthPage = AUTH_PATHS.some((p) => pathname.startsWith(p));

  if (isProtected && !sessionCookie) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthPage && sessionCookie) {
    return NextResponse.redirect(new URL("/library", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/library/:path*", "/reader/:path*", "/login", "/signup"],
};
