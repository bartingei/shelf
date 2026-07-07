import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { LibraryClient } from "@/components/features/library/library-client";

export default async function LibraryPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/login");

  return <LibraryClient userId={session.user.id} userName={session.user.name ?? ""} />;
}
