"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Upload, Play, Layers, Highlighter, Moon, Bookmark, Flame, Cloud, Quote,
} from "lucide-react";
import { IMAGES } from "@/lib/images";
import { cn } from "@/lib/utils";

/* -- Marketing nav ---------------------------------------------------------- */
function MarketingNav() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={cn(
      "fixed inset-x-0 top-0 z-50 transition-colors duration-300",
      scrolled ? "border-b border-border bg-background/85 backdrop-blur-md" : "border-b border-transparent"
    )}>
      <div className="mx-auto flex h-[70px] max-w-[1240px] items-center justify-between px-6">
        <Link href="/" className="font-display text-2xl italic tracking-tight">
          Shelf<span className="text-gold">.</span>
        </Link>
        <nav className="hidden items-center gap-8 text-sm text-muted md:flex">
          <a href="#reader" className="transition-colors hover:text-foreground">Reader</a>
          <a href="#features" className="transition-colors hover:text-foreground">Features</a>
          <a href="#stats" className="transition-colors hover:text-foreground">Why Shelf</a>
        </nav>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm text-muted transition-colors hover:text-foreground">Sign in</Link>
          <Link href="/signup" className="rounded-full bg-foreground px-5 py-2 text-sm font-semibold text-background transition-transform hover:scale-[1.03]">
            Get Started
          </Link>
        </div>
      </div>
    </header>
  );
}

/* -- Hero -------------------------------------------------------------------- */
function Hero() {
  return (
    <section className="relative mx-auto grid max-w-[1240px] grid-cols-1 items-center gap-12 px-6 pb-20 pt-36 lg:grid-cols-2 lg:pt-44">
      {/* Left copy */}
      <div>
        <span className="inline-flex items-center rounded-full border border-gold/40 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">
          Premium reading experience
        </span>
        <h1 className="mt-7 font-display text-6xl font-semibold leading-[1.02] tracking-tight md:text-7xl">
          The <span className="italic text-gold">cinema</span> of long reads.
        </h1>
        <p className="mt-7 max-w-md text-lg leading-relaxed text-muted">
          Upload your whole collection, organize it by genre, highlight the
          lines that matter, and lose yourself in a reader made for focus, not feeds.
        </p>
        <div className="mt-9 flex flex-wrap items-center gap-4">
          <Link href="/signup" className="flex items-center gap-2 rounded-lg bg-gold px-7 py-3.5 text-sm font-semibold text-black transition-transform hover:scale-[1.03]">
            <Upload size={16} /> Upload your first book
          </Link>
          <a href="#reader" className="flex items-center gap-2 rounded-lg bg-white/10 px-7 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/20">
            <Play size={16} /> Watch demo
          </a>
        </div>
        <div className="mt-10 flex items-center gap-3">
          <div className="flex -space-x-2">
            {["#c9a97e", "#8a6f4e", "#6b4f8f"].map((c) => (
              <span key={c} className="h-8 w-8 rounded-full border-2 border-background" style={{ background: c }} />
            ))}
          </div>
          <p className="text-sm text-muted">Joined by <span className="text-foreground">50,000+</span> readers this year</p>
        </div>
      </div>

      {/* Right image with floating cards */}
      <div className="relative">
        <div className="relative overflow-hidden rounded-2xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={IMAGES.heroBook} alt="An open book in warm light" fetchPriority="high" decoding="async" className="h-[520px] w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent" />
        </div>

        {/* Next chapter card */}
        <div className="absolute -right-2 top-6 rounded-xl border border-border bg-card/90 px-5 py-4 shadow-2xl backdrop-blur-md">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">Next chapter</p>
          <p className="mt-1 font-display text-lg">V. The Architecture of Silence</p>
        </div>

        {/* Live annotation card */}
        <div className="absolute -bottom-6 left-2 w-64 rounded-xl border border-border bg-card/90 p-5 shadow-2xl backdrop-blur-md">
          <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-gold">
            <span className="h-1.5 w-1.5 rounded-full bg-gold" /> Live annotation
          </p>
          <p className="mt-3 flex gap-2 font-display text-sm italic leading-relaxed text-foreground/90">
            <Quote size={14} className="mt-0.5 shrink-0 text-gold" />
            The secret of a good life is to have the right loyalties held in the right scale of values.
          </p>
          <p className="mt-3 text-[11px] text-muted">CH. IV, PG. 87</p>
        </div>
      </div>
    </section>
  );
}

/* -- Reader showcase --------------------------------------------------------- */
function ReaderShowcase() {
  const chapters = ["I. Preludes", "II. The Room", "III. Slow Fires", "IV. The Void", "V. Silence", "VI. Coda"];
  return (
    <section id="reader" className="mx-auto grid max-w-[1240px] grid-cols-1 items-center gap-14 px-6 py-28 lg:grid-cols-2">
      <div>
        <span className="eyebrow">The reader</span>
        <h2 className="mt-4 font-display text-5xl font-semibold leading-[1.05] tracking-tight">
          Built for the long <span className="italic text-gold">read</span>.
        </h2>
        <p className="mt-6 max-w-md text-lg leading-relaxed text-muted">
          The interface fades when you start. What remains is the text, the margin,
          and a quiet toolbar that appears only when you reach for it.
        </p>
        <ul className="mt-8 space-y-4">
          {[
            { icon: Highlighter, label: "Six colors for meaningful highlights" },
            { icon: Bookmark, label: "Bookmarks anchored to the passage" },
            { icon: Layers, label: "Instant chapter jumps and a full table of contents" },
          ].map((f) => (
            <li key={f.label} className="flex items-center gap-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/15 text-gold">
                <f.icon size={18} />
              </span>
              <span className="text-sm text-foreground/90">{f.label}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Mock reader panel */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
          <span className="ml-3 text-[11px] uppercase tracking-wide text-muted">The Quiet Hours · Chapter IV</span>
          <span className="ml-auto text-[11px] text-muted">46%</span>
        </div>
        <div className="grid grid-cols-[140px_1fr]">
          <div className="border-r border-border p-4">
            <p className="mb-3 text-[10px] uppercase tracking-wide text-muted">Chapters</p>
            <ul className="space-y-2 text-[12px]">
              {chapters.map((c, i) => (
                <li key={c} className={cn("rounded px-2 py-1", i === 3 ? "bg-gold/15 text-gold" : "text-muted")}>{c}</li>
              ))}
            </ul>
          </div>
          <div className="p-6">
            <h3 className="font-display text-xl">The Architecture of Silence</h3>
            <p className="mt-4 text-sm leading-relaxed text-foreground/80">
              In the space between words, we find the resonance of meaning. Design is not the
              filling of a container, but the{" "}
              <span className="rounded bg-gold/30 px-0.5 underline decoration-gold/60 underline-offset-2">sculpting of the void that surrounds it</span>.
            </p>
            <p className="mt-4 text-sm leading-relaxed text-foreground/60">
              Every margin is a breath. Every typeface is a voice. When we read, we
              aren't just consuming data. We're stepping into a room built by another mind.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* -- Features grid ----------------------------------------------------------- */
const FEATURES = [
  { icon: Layers, title: "Intelligent Curation", body: "Drop in a PDF and Shelf sorts it into Novels, Educational, or Technical shelves. Covers, metadata, and chapters get picked up automatically." },
  { icon: Highlighter, title: "Deep Annotation", body: "Highlight in scholarly colors, leave marginalia, and select real text right on the page. Every note syncs to your account." },
  { icon: Moon, title: "Cinematic Focus", body: "A reader interface that dissolves when you start reading. Sepia, paper, or midnight themes for any hour of the night." },
  { icon: Bookmark, title: "Anywhere Bookmarks", body: "Save the passage, not just the page. Bookmarks travel with the sentence, so you never lose the thread." },
  { icon: Flame, title: "Reading Streaks", body: "Gentle stats celebrate the habit. Pages read, books finished, shelves completed. Never a leaderboard." },
  { icon: Cloud, title: "Everywhere Sync", body: "Start on your desktop, continue on your phone. Progress, notes, and bookmarks stay perfectly aligned." },
];

function Features() {
  return (
    <section id="features" className="mx-auto max-w-[1240px] px-6 py-28">
      <span className="eyebrow">Everything you'd expect, nothing you wouldn't</span>
      <h2 className="mt-5 max-w-2xl font-display text-5xl font-semibold leading-[1.05] tracking-tight">
        Made for readers who <span className="italic text-gold">finish</span> books.
      </h2>
      <div className="mt-16 grid grid-cols-1 gap-x-10 gap-y-14 md:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f) => (
          <div key={f.title}>
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gold/15 text-gold">
              <f.icon size={20} />
            </span>
            <h3 className="mt-5 font-display text-xl font-semibold">{f.title}</h3>
            <p className="mt-3 text-sm leading-relaxed text-muted">{f.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* -- Stats + CTA ------------------------------------------------------------- */
function StatsAndCta() {
  const stats = [
    { value: "50k+", label: "Active readers" },
    { value: "2.4M", label: "Books uploaded" },
    { value: "18M", label: "Highlights saved" },
    { value: "142", label: "Avg pages / week" },
  ];
  return (
    <>
      <section id="stats" className="mx-auto max-w-[1240px] border-y border-border px-6 py-16">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label}>
              <p className="font-display text-5xl font-semibold text-gold">{s.value}</p>
              <p className="mt-2 text-[11px] uppercase tracking-[0.15em] text-muted">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="relative overflow-hidden px-6 py-32 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={IMAGES.shelves} alt="" aria-hidden loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover opacity-[0.12]" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/90 to-background" />
        <div className="relative mx-auto max-w-2xl">
          <h2 className="font-display text-5xl font-semibold tracking-tight md:text-6xl">
            Your library, <span className="italic text-gold">elevated</span>.
          </h2>
          <p className="mx-auto mt-6 max-w-md text-muted">
            Join 50,000+ readers who've already moved their whole collection to Shelf.
            Your first 10 books are free, no card needed.
          </p>
          <Link href="/signup" className="mt-10 inline-flex rounded-lg bg-foreground px-8 py-4 text-sm font-semibold text-background transition-transform hover:scale-[1.03]">
            Create your collection
          </Link>
        </div>
      </section>
    </>
  );
}

/* -- Footer ------------------------------------------------------------------ */
function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-[1240px] flex-col items-center justify-between gap-4 px-6 py-10 text-sm text-muted sm:flex-row">
        <Link href="/" className="font-display text-xl italic text-foreground">Shelf<span className="text-gold">.</span></Link>
        <p>© {new Date().getFullYear()} Shelf. A cinematic home for long reads.</p>
        <div className="flex gap-6">
          <Link href="/faq" className="hover:text-foreground">FAQ</Link>
          <Link href="/login" className="hover:text-foreground">Sign in</Link>
          <Link href="/signup" className="hover:text-foreground">Get started</Link>
        </div>
      </div>
    </footer>
  );
}

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <MarketingNav />
      <Hero />
      <ReaderShowcase />
      <Features />
      <StatsAndCta />
      <Footer />
    </div>
  );
}
