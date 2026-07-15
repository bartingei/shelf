"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Play, Info, ChevronLeft, ChevronRight } from "lucide-react";
import { BookCard } from "@/components/features/library/book-card";
import { BookDetailModal } from "@/components/features/library/book-detail-modal";
import { TopNav } from "@/components/ui/top-nav";
import { UploadModal } from "@/components/features/library/upload-modal";
import { IMAGES } from "@/lib/images";
import type { Book } from "@/types";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

/* -------------------------------------------------------------------------- */
/* Billboard hero — the featured book, cinematic                              */
/* -------------------------------------------------------------------------- */
function Billboard({ book, onDetails }: { book: Book; onDetails: () => void }) {
  const percent = (book as any).progress?.percentComplete ?? 0;

  return (
    <div className="relative h-[80vh] min-h-[540px] w-full overflow-hidden">
      {/* Backdrop — the book's cover, or a warm library fallback */}
      {book.coverUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={book.coverUrl} alt="" aria-hidden className="absolute inset-0 h-full w-full scale-110 object-cover object-top blur-[3px] brightness-[0.5]" />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={IMAGES.stack} alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover brightness-[0.5]" />
      )}

      {/* Scrims for legibility + blend into page */}
      <div className="absolute inset-0 bg-gradient-to-r from-background via-background/75 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/10 to-black/40" />

      {/* Content */}
      <div className="relative mx-auto flex h-full max-w-[1600px] flex-col justify-end gap-5 px-6 pb-20 lg:px-10">
        <span className="eyebrow">{percent > 0 ? "Continue reading" : "Featured in your library"}</span>
        <h1 className="max-w-3xl font-display text-5xl font-semibold leading-[1.02] tracking-tight drop-shadow-lg md:text-7xl">
          {book.title}
        </h1>
        {book.author && <p className="text-lg text-foreground/70">{book.author}</p>}

        {percent > 0 && (
          <div className="flex items-center gap-3">
            <div className="h-1.5 w-56 overflow-hidden rounded-full bg-white/20">
              <div className="h-full rounded-full bg-gold" style={{ width: `${percent}%` }} />
            </div>
            <span className="text-xs font-medium text-foreground/70">{percent}% read</span>
          </div>
        )}

        <div className="mt-2 flex items-center gap-3">
          <Link
            href={`/reader/${book.id}`}
            className="flex items-center gap-2 rounded-full bg-white px-8 py-3.5 text-sm font-semibold text-black transition-transform hover:scale-[1.03]"
          >
            <Play size={16} fill="black" />
            {percent > 0 ? "Resume" : "Read now"}
          </Link>
          <button
            onClick={onDetails}
            className="flex items-center gap-2 rounded-full bg-white/10 px-7 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/20"
          >
            <Info size={16} />
            Details
          </button>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Horizontal rail with edge fades + hover scroll arrows                      */
/* -------------------------------------------------------------------------- */
function BookRail({ title, subtitle, books, onRefresh }: { title: string; subtitle?: string; books: Book[]; onRefresh: () => void }) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const updateArrows = () => {
    const el = scrollerRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 8);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
  };

  useEffect(() => {
    updateArrows();
    const el = scrollerRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateArrows, { passive: true });
    window.addEventListener("resize", updateArrows);
    return () => {
      el.removeEventListener("scroll", updateArrows);
      window.removeEventListener("resize", updateArrows);
    };
  }, [books]);

  const scrollBy = (dir: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: "smooth" });
  };

  if (books.length === 0) return null;

  return (
    <section className="group/rail relative mb-12">
      <div className="mb-4 flex items-end justify-between px-6 lg:px-10">
        <div>
          <h2 className="font-display text-2xl font-semibold tracking-tight">{title}</h2>
          {subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}
        </div>
        <Link href="/library" className="shrink-0 border-b border-transparent text-xs font-medium text-muted transition-colors hover:border-gold hover:text-gold">
          View entire library →
        </Link>
      </div>

      <div className="relative">
        {canLeft && (
          <>
            <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-background to-transparent" />
            <button onClick={() => scrollBy(-1)} aria-label="Scroll left" className="absolute left-3 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-white opacity-0 backdrop-blur-sm transition-opacity hover:bg-black/80 group-hover/rail:opacity-100">
              <ChevronLeft size={20} />
            </button>
          </>
        )}

        <div ref={scrollerRef} className="no-scrollbar flex gap-5 overflow-x-auto scroll-smooth px-6 pb-2 lg:px-10">
          {books.map((book) => (
            <div key={book.id} className="w-[160px] shrink-0">
              <BookCard book={book} onFavoriteToggle={onRefresh} onDelete={onRefresh} />
            </div>
          ))}
        </div>

        {canRight && (
          <>
            <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-background to-transparent" />
            <button onClick={() => scrollBy(1)} aria-label="Scroll right" className="absolute right-3 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-white opacity-0 backdrop-blur-sm transition-opacity hover:bg-black/80 group-hover/rail:opacity-100">
              <ChevronRight size={20} />
            </button>
          </>
        )}
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */

export function DashboardClient({ userName, userId }: { userName: string; userId: string }) {
  const [continueReading, setContinueReading] = useState<Book[]>([]);
  const [recentlyAdded, setRecentlyAdded] = useState<Book[]>([]);
  const [favorites, setFavorites] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [allBooks, setAllBooks] = useState<Book[]>([]);
  const [detailBook, setDetailBook] = useState<Book | null>(null);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [lastRead, recent, fav, all] = await Promise.all([
        fetch("/api/books?sort=lastRead&limit=10").then((r) => r.json()),
        fetch("/api/books?sort=recent&limit=10").then((r) => r.json()),
        fetch("/api/books?favorite=true&limit=10").then((r) => r.json()),
        fetch("/api/books?limit=1000").then((r) => r.json()),
      ]);
      setContinueReading(lastRead.books ?? []);
      setRecentlyAdded(recent.books ?? []);
      setFavorites(fav.books ?? []);
      setAllBooks(all.books ?? []);
    } catch (error) {
      console.error("Failed to fetch books:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const firstName = userName.split(" ")[0];
  const isEmpty = !loading && allBooks.length === 0;
  const featured = continueReading[0] ?? recentlyAdded[0] ?? null;
  const inProgress = allBooks.filter((b: any) => b.progress && b.progress.percentComplete > 0).length;
  const completed = allBooks.filter((b: any) => b.progress && b.progress.percentComplete === 100).length;

  return (
    <div className="min-h-screen bg-background">
      <TopNav onUpload={() => setShowUpload(true)} overHero={!loading && !isEmpty && !!featured} />

      {loading ? (
        <div className="space-y-10 px-6 pt-24 lg:px-10">
          <div className="h-[60vh] min-h-[380px] w-full animate-pulse rounded-3xl bg-card" />
          {["Continue Reading", "Recently Added"].map((label) => (
            <section key={label}>
              <h2 className="mb-4 font-display text-2xl font-semibold">{label}</h2>
              <div className="flex gap-5">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-60 w-[160px] animate-pulse rounded-xl bg-card" />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : isEmpty ? (
        /* Empty state with warm imagery */
        <div className="relative flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={IMAGES.stack} alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover opacity-20" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/60" />
          <div className="relative flex flex-col items-center gap-6">
            <span className="eyebrow">Welcome to Shelf</span>
            <h1 className="max-w-xl font-display text-5xl font-semibold leading-tight">
              Your shelf is <span className="italic text-gold">waiting</span>, {firstName || "reader"}.
            </h1>
            <p className="max-w-md text-sm text-muted">Upload your first PDF and it becomes a beautiful, readable book — cover, chapters and all.</p>
            <button onClick={() => setShowUpload(true)} className="rounded-full bg-gold px-7 py-3.5 text-sm font-semibold text-black transition-transform hover:scale-[1.03]">
              Upload your first book →
            </button>
          </div>
        </div>
      ) : (
        <>
          {featured && <Billboard book={featured} onDetails={() => setDetailBook(featured)} />}

          {/* Greeting + stat strip, lifted over the billboard fade */}
          <div className="relative z-10 -mt-8 mb-6 flex flex-wrap items-center justify-between gap-4 px-6 lg:px-10">
            <div>
              <p className="text-sm text-muted">{getGreeting()},</p>
              <p className="font-display text-2xl font-semibold">{firstName || "reader"}</p>
            </div>
            <div className="flex items-center gap-6 rounded-2xl border border-border bg-card/70 px-6 py-3 backdrop-blur-sm">
              {[
                { label: "In library", value: allBooks.length },
                { label: "Reading", value: inProgress },
                { label: "Finished", value: completed },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <p className="font-display text-2xl font-semibold leading-none text-gold">{s.value}</p>
                  <p className="mt-1 text-[10px] uppercase tracking-wide text-muted">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="pb-16 pt-2">
            <BookRail title="Continue Reading" subtitle="Pick up right where you left off." books={continueReading} onRefresh={fetchAll} />
            <BookRail title="Recently Added" books={recentlyAdded} onRefresh={fetchAll} />
            <BookRail title="Favorites" books={favorites} onRefresh={fetchAll} />
          </div>
        </>
      )}

      {showUpload && (
        <UploadModal userId={userId} onClose={() => setShowUpload(false)} onSuccess={fetchAll} />
      )}

      {detailBook && (
        <BookDetailModal
          book={detailBook}
          onClose={() => setDetailBook(null)}
          onUpdate={() => fetchAll()}
          onDelete={() => { setDetailBook(null); fetchAll(); }}
        />
      )}
    </div>
  );
}
