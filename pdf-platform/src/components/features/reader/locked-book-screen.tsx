import Link from "next/link";
import { Lock } from "lucide-react";
import { TopNav } from "@/components/ui/top-nav";

interface LockedBookScreenProps {
  title: string;
}

export function LockedBookScreen({ title }: LockedBookScreenProps) {
  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      <div className="mx-auto flex max-w-md flex-col items-center px-6 pb-24 pt-40 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gold/10 text-gold">
          <Lock size={22} />
        </div>
        <h1 className="mt-6 font-display text-2xl font-semibold tracking-tight">
          &ldquo;{title}&rdquo; is locked
        </h1>
        <p className="mt-3 text-sm text-muted">
          Your Free plan only keeps your earliest books unlocked. Upgrade to Shelf Pro to read this one again.
        </p>
        <Link
          href="/upgrade"
          className="mt-8 rounded-full bg-gold px-6 py-3 text-sm font-semibold text-black transition-transform hover:scale-[1.03]"
        >
          Upgrade to Shelf Pro
        </Link>
        <Link href="/library" className="mt-4 text-sm text-muted hover:text-foreground hover:underline">
          Back to your library
        </Link>
      </div>
    </div>
  );
}
