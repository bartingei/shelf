"use client";

import { useRouter } from "next/navigation";
import { useSession, signOut } from "@/lib/auth-client";

export function Header() {
  const router = useRouter();
  const { data: session } = useSession();

  async function handleSignOut() {
    await signOut();
    router.push("/login");
  }

  return (
    <header className="flex items-center justify-between border-b border-border bg-card px-8 py-4">
      <span className="text-sm font-semibold tracking-tight">Shelf</span>
      {session?.user && (
        <div className="flex items-center gap-3 text-sm">
          <span className="text-muted">{session.user.name || session.user.email}</span>
          <button
            onClick={handleSignOut}
            className="rounded-md border border-border px-3 py-1.5 text-xs hover:bg-background"
          >
            Sign out
          </button>
        </div>
      )}
    </header>
  );
}
