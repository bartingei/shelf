"use client";

import { useState } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { TopNav } from "@/components/ui/top-nav";
import { useToast } from "@/components/ui/toast";
import { updateUser } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import type { ReaderThemeName, FontPreferenceName } from "@/types";

interface SettingsClientProps {
  name: string;
  email: string;
  readerTheme: ReaderThemeName;
  fontPreference: FontPreferenceName;
  plan: "FREE" | "PRO";
  bookCount: number;
  bookLimit: number | null;
}

const THEMES: { value: ReaderThemeName; label: string }[] = [
  { value: "DEFAULT", label: "Default" },
  { value: "PAPER", label: "Paper" },
  { value: "NIGHT", label: "Night" },
];

const FONTS: { value: FontPreferenceName; label: string }[] = [
  { value: "SANS", label: "Sans-serif" },
  { value: "SERIF", label: "Serif" },
  { value: "DYSLEXIC", label: "Dyslexic-friendly" },
];

export function SettingsClient({
  name: initialName,
  email,
  readerTheme: initialTheme,
  fontPreference: initialFont,
  plan,
  bookCount,
  bookLimit,
}: SettingsClientProps) {
  const { toast } = useToast();

  const [name, setName] = useState(initialName);
  const [savingProfile, setSavingProfile] = useState(false);

  const [readerTheme, setReaderTheme] = useState(initialTheme);
  const [fontPreference, setFontPreference] = useState(initialFont);
  const [savingDefaults, setSavingDefaults] = useState(false);

  async function saveProfile() {
    setSavingProfile(true);
    const { error } = await updateUser({ name });
    setSavingProfile(false);
    if (error) {
      toast(error.message || "Could not update your profile.", { variant: "error" });
      return;
    }
    toast("Profile updated");
  }

  async function saveReaderDefaults() {
    setSavingDefaults(true);
    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ readerTheme, fontPreference }),
    });
    setSavingDefaults(false);
    if (!res.ok) {
      toast("Could not save your reader defaults.", { variant: "error" });
      return;
    }
    toast("Reader defaults saved");
  }

  return (
    <div className="min-h-screen bg-background">
      <TopNav />

      <div className="mx-auto max-w-2xl px-6 pb-24 pt-32">
        <span className="eyebrow">Your account</span>
        <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight">Settings</h1>

        {/* Profile */}
        <section className="mt-10 rounded-2xl border border-border bg-card p-6">
          <h2 className="font-display text-lg font-semibold">Profile</h2>
          <div className="mt-4 space-y-3">
            <div>
              <label className="mb-1 block text-xs uppercase tracking-wide text-muted">Name</label>
              <input
                type="text" value={name} onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none transition-colors focus:border-gold"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs uppercase tracking-wide text-muted">Email</label>
              <input
                type="email" value={email} disabled
                className="w-full cursor-not-allowed rounded-lg border border-border bg-background/50 px-4 py-2.5 text-sm text-muted"
              />
            </div>
            <button
              onClick={saveProfile}
              disabled={savingProfile || !name.trim()}
              className="rounded-lg bg-gold px-5 py-2 text-sm font-semibold text-black transition-transform hover:scale-[1.02] disabled:opacity-50"
            >
              {savingProfile ? "Saving..." : "Save profile"}
            </button>
          </div>
        </section>

        {/* Reader defaults */}
        <section className="mt-6 rounded-2xl border border-border bg-card p-6">
          <h2 className="font-display text-lg font-semibold">Reader defaults</h2>
          <p className="mt-1 text-sm text-muted">Applied whenever you open a book.</p>

          <div className="mt-4 space-y-4">
            <div>
              <p className="mb-1.5 text-xs uppercase tracking-wide text-muted">Theme</p>
              <div className="flex gap-2">
                {THEMES.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setReaderTheme(t.value)}
                    className={cn(
                      "rounded-lg border px-3 py-1.5 text-xs font-medium",
                      readerTheme === t.value
                        ? "border-gold bg-gold/10 text-gold"
                        : "border-border text-muted hover:text-foreground"
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-1.5 text-xs uppercase tracking-wide text-muted">Font</p>
              <div className="flex gap-2">
                {FONTS.map((f) => (
                  <button
                    key={f.value}
                    onClick={() => setFontPreference(f.value)}
                    className={cn(
                      "rounded-lg border px-3 py-1.5 text-xs font-medium",
                      fontPreference === f.value
                        ? "border-gold bg-gold/10 text-gold"
                        : "border-border text-muted hover:text-foreground"
                    )}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              <p className="mt-1.5 text-xs text-muted">
                Applies to the reader interface — not the PDF's own text, which is fixed by the source file.
              </p>
            </div>

            <button
              onClick={saveReaderDefaults}
              disabled={savingDefaults}
              className="rounded-lg bg-gold px-5 py-2 text-sm font-semibold text-black transition-transform hover:scale-[1.02] disabled:opacity-50"
            >
              {savingDefaults ? "Saving..." : "Save defaults"}
            </button>
          </div>
        </section>

        {/* Plan & billing */}
        <section className="mt-6 rounded-2xl border border-border bg-card p-6">
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
            Plan & billing
            <span className="rounded-full border border-gold/40 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gold">
              Coming soon
            </span>
          </h2>
          <p className="mt-2 flex items-center gap-2 text-sm text-foreground/80">
            <Sparkles size={14} className="text-gold" />
            {plan === "PRO" ? "Pro plan" : "Free plan"}
            {bookLimit !== null && ` · ${bookCount} of ${bookLimit} books`}
          </p>
          <p className="mt-3 text-sm text-muted">
            Billing isn't wired up yet.{" "}
            <Link href="/upgrade" className="text-gold hover:underline">See what Pro will unlock</Link>.
          </p>
        </section>
      </div>
    </div>
  );
}
