import { cookies, headers } from "next/headers";
import { auth } from "@/lib/auth";
import { DashboardClient } from "@/components/features/dashboard/dashboard-client";
import { LandingPage } from "@/components/features/marketing/landing-page";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  // Skip the DB round-trip entirely for the common case (anonymous visitor,
  // no session cookie) — only hit the database when a cookie is actually present.
  const hasSessionCookie = (await cookies()).has("better-auth.session_token");
  const session = hasSessionCookie
    ? await auth.api.getSession({ headers: await headers() })
    : null;

  // Authenticated → the app dashboard; otherwise the marketing landing page.
  if (session?.user) {
    return (
      <DashboardClient
        userName={session.user.name ?? session.user.email ?? ""}
        userId={session.user.id}
      />
    );
  }

  return <LandingPage />;
}
