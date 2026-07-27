import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { UpgradeClient } from "@/components/features/upgrade/upgrade-client";
import { FREE_PLAN_BOOK_LIMIT } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Upgrade",
  robots: { index: false, follow: false },
};

export default async function UpgradePage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/login");

  return <UpgradeClient freeLimit={FREE_PLAN_BOOK_LIMIT} />;
}
