import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { DashboardClient } from "@/components/features/dashboard/dashboard-client";

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/login");

  return (
    <DashboardClient
      userName={session.user.name ?? session.user.email ?? ""}
      userId={session.user.id}
    />
  );
}