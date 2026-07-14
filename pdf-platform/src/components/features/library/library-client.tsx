"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Search } from "lucide-react";
import { BookCard } from "./book-card";
import { UploadModal } from "./upload-modal";
import { TopNav } from "@/components/ui/top-nav";
import { IMAGES } from "@/lib/images";
import { cn } from "@/lib/utils";
import { GENRE_LABELS, type Genre } from "@/types";
import type { Book } from "@/types";

interface LibraryClientProps {
  userId: string;
  userName: string;
}

export function LibraryClient({ userId, userName }: LibraryClientProps) {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"ALL" | Genre>("ALL");

  // Only show genre chips for genres the user actually has books in — no point
  // cluttering the bar with "Biography" when they have zero biographies.
  const genresInLibrary = useMemo(() => {
    const present = new Set(books.map((b) => b.genre));
    return (Object.keys(GENRE_LABELS) as Genre[]).filter((g) => present.has(g));
  }, [books]);

  const fetchBooks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/books");
      const data = await res.json();
      setBooks(data.books ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchBooks(); }, [fetchBooks]);

  const filtered = books.filter((b) => {
    const q = search.toLowerCase();
    const matchesSearch = b.title.toLowerCase().includes(q) || (b.author ?? "").toLowerCase().includes(q);
    const matchesFilter = filter === "ALL" || b.genre === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen bg-background">
      <TopNav onUpload={() => setShowUpload(true)} overHero />

      {/* Cinematic banner */}
      <div className="relative h-[42vh] min-h-[300px] w-full overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={IMAGES.library} alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover object-center brightness-[0.55]" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-black/40" />
        <div className="relative mx-auto flex h-full max-w-[1600px] flex-col justify-end px-6 pb-10 lg:px-10">
          <span className="eyebrow">Your shelf</span>
          <h1 className="mt-3 font-display text-5xl font-semibold tracking-tight md:text-6xl">Library</h1>
          <p className="mt-2 text-sm text-muted">{books.length} book{books.length === 1 ? "" : "s"} · every page, in one place.</p>
        </div>
      </div>

      {/* Sticky filter + search bar */}
      <div className="sticky top-16 z-30 border-b border-border bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3 px-6 py-3 lg:px-10">
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 hidden text-[11px] font-semibold uppercase tracking-[0.18em] text-muted sm:inline">Genres</span>
            <button
              onClick={() => setFilter("ALL")}
              className={cn(
                "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
                filter === "ALL"
                  ? "border-transparent bg-foreground text-background"
                  : "border-border text-muted hover:border-foreground/40 hover:text-foreground"
              )}
            >
              All
            </button>
            {genresInLibrary.map((g) => (
              <button
                key={g}
                onClick={() => setFilter(g)}
                className={cn(
                  "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
                  filter === g
                    ? "border-transparent bg-foreground text-background"
                    : "border-border text-muted hover:border-foreground/40 hover:text-foreground"
                )}
              >
                {GENRE_LABELS[g]}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="search"
              placeholder="Search your library"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-56 rounded-full border border-border bg-card py-2 pl-9 pr-3 text-sm outline-none transition-colors focus:border-gold"
            />
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="mx-auto max-w-[1600px] px-6 py-8 lg:px-10">
        {loading ? (
          <div className="grid grid-cols-3 gap-6 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7">
            {Array.from({ length: 14 }).map((_, i) => (
              <div key={i} className="aspect-[2/3] animate-pulse rounded-xl bg-card" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div
            onClick={() => setShowUpload(true)}
            className="flex h-64 cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border transition-colors hover:border-gold/50"
          >
            <p className="font-display text-xl">Nothing on this shelf yet</p>
            <p className="text-sm text-muted">Click to upload a PDF</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-6 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7">
            {filtered.map((book) => (
              <BookCard key={book.id} book={book} onFavoriteToggle={fetchBooks} onDelete={fetchBooks} />
            ))}
          </div>
        )}
      </div>

      {showUpload && (
        <UploadModal userId={userId} onClose={() => setShowUpload(false)} onSuccess={fetchBooks} />
      )}
    </div>
  );
}
