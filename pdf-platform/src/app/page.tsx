import { cookies, headers } from "next/headers";
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
