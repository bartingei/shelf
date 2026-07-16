import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SettingsClient } from "@/components/features/settings/settings-client";
import { FREE_PLAN_BOOK_LIMIT } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Settings",
  robots: { index: false, follow: false },
};

export default async function SettingsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/login");

  const [settings, user, bookCount] = await Promise.all([
    prisma.userSettings.findUnique({ where: { userId: session.user.id } }),
    prisma.user.findUnique({ where: { id: session.user.id }, select: { plan: true } }),
    prisma.book.count({ where: { userId: session.user.id } }),
  ]);

  return (
    <SettingsClient
      name={session.user.name ?? ""}
      email={session.user.email}
      readerTheme={settings?.readerTheme ?? "DEFAULT"}
      fontPreference={settings?.fontPreference ?? "SANS"}
      plan={user?.plan ?? "FREE"}
      bookCount={bookCount}
      bookLimit={user?.plan === "PRO" ? null : FREE_PLAN_BOOK_LIMIT}
    />
  );
}
