import { headers } from "next/headers";
import { getSessionCookie } from "better-auth/cookies";
import { auth } from "@/lib/auth";
import { DashboardClient } from "@/components/features/dashboard/dashboard-client";
import { LandingPage } from "@/components/features/marketing/landing-page";
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION } from "@/lib/site";

const structuredData = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: SITE_NAME,
  url: SITE_URL,
  description: SITE_DESCRIPTION,
  applicationCategory: "UtilitiesApplication",
  operatingSystem: "Any (web-based)",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};

export const dynamic = "force-dynamic";

export default async function HomePage() {
  // Skip the DB round-trip entirely for the common case (anonymous visitor,
  // no session cookie) — only hit the database when a cookie is actually
  // present. Uses Better Auth's own getSessionCookie() rather than a
  // hardcoded cookie name: in production (HTTPS) the cookie is prefixed
  // with "__Secure-", which a literal name check silently misses — every
  // signed-in user would see the logged-out landing page here instead of
  // the dashboard (this is what was happening).
  const reqHeaders = await headers();
  const hasSessionCookie = !!getSessionCookie(reqHeaders);
  const session = hasSessionCookie
    ? await auth.api.getSession({ headers: reqHeaders })
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

  return (
    <>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <LandingPage />
    </>
  );
}
