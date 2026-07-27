"use client";

import Link from "next/link";
import { Check, Sparkles } from "lucide-react";
import { TopNav } from "@/components/ui/top-nav";

interface UpgradeClientProps {
  freeLimit: number;
}

export function UpgradeClient({ freeLimit }: UpgradeClientProps) {
  return (
    <div className="min-h-screen bg-background">
      <TopNav />

      <div className="mx-auto max-w-3xl px-6 pb-24 pt-32 text-center">
        <span className="eyebrow">Plans</span>
        <h1 className="mt-4 font-display text-5xl font-semibold tracking-tight">
          More room for your <span className="italic text-gold">library</span>.
        </h1>
        <p className="mx-auto mt-4 max-w-md text-muted">
          Shelf Pro isn't billed yet — this page is a preview of what it will unlock.
        </p>

        <div className="mt-14 grid grid-cols-1 gap-6 text-left sm:grid-cols-2">
          {/* Free */}
          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="font-display text-xl font-semibold">Free</h2>
            <p className="mt-1 text-sm text-muted">What you're on today.</p>
            <p className="mt-6 font-display text-3xl font-semibold">$0</p>
            <ul className="mt-6 space-y-3 text-sm text-foreground/80">
              <li className="flex items-center gap-2"><Check size={15} className="text-gold" /> Up to {freeLimit} books</li>
              <li className="flex items-center gap-2"><Check size={15} className="text-gold" /> Full reader with highlights, notes, bookmarks</li>
              <li className="flex items-center gap-2"><Check size={15} className="text-gold" /> AI genre classification</li>
            </ul>
          </div>

          {/* Pro */}
          <div className="rounded-2xl border border-gold/40 bg-gold/5 p-6">
            <h2 className="flex items-center gap-2 font-display text-xl font-semibold text-gold">
              <Sparkles size={16} /> Pro
            </h2>
            <p className="mt-1 text-sm text-muted">For growing collections.</p>
            <p className="mt-6 font-display text-3xl font-semibold">Coming soon</p>
            <ul className="mt-6 space-y-3 text-sm text-foreground/80">
              <li className="flex items-center gap-2"><Check size={15} className="text-gold" /> Unlimited books</li>
              <li className="flex items-center gap-2"><Check size={15} className="text-gold" /> Everything in Free</li>
              <li className="flex items-center gap-2"><Check size={15} className="text-gold" /> Priority AI processing</li>
            </ul>
            <button
              disabled
              className="mt-6 w-full cursor-not-allowed rounded-lg bg-gold/40 py-3 text-sm font-semibold text-black/60"
            >
              Not available yet
            </button>
          </div>
        </div>

        <p className="mt-10 text-sm text-muted">
          <Link href="/library" className="text-gold hover:underline">Back to your library</Link>
        </p>
      </div>
    </div>
  );
}
