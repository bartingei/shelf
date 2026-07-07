"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Upload } from "lucide-react";
import { BookCard } from "./book-card";
import { UploadModal } from "./upload-modal";
import { Sidebar } from "@/components/ui/sidebar";
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
  const [filter, setFilter] = useState<"ALL" | "EDUCATION" | "NOVEL">("ALL");

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
    const matchesSearch =
      b.title.toLowerCase().includes(q) ||
      (b.author ?? "").toLowerCase().includes(q);
    const matchesFilter = filter === "ALL" || b.category === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar onUpload={() => setShowUpload(true)} />

      <main className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center justify-between border-b border-border px-8 py-4">
          <div>
            <h1 className="text-xl font-bold">Library</h1>
            <p className="text-xs text-muted">{books.length} books</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Filter pills */}
            <div className="flex gap-1 rounded-lg border border-border bg-card p-1">
              {(["ALL", "EDUCATION", "NOVEL"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                    filter === f
                      ? "bg-accent text-white"
                      : "text-muted hover:text-foreground"
                  }`}
                >
                  {f === "ALL" ? "All" : f === "EDUCATION" ? "Education" : "Novels"}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
              />
              <input
                type="search"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-48 rounded-lg border border-border bg-card py-2 pl-8 pr-3 text-sm outline-none focus:border-accent"
              />
            </div>

            <button
              onClick={() => setShowUpload(true)}
              className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90"
            >
              <Upload size={14} /> Upload
            </button>
          </div>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          {loading ? (
            <div className="grid grid-cols-3 gap-6 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-8">
              {Array.from({ length: 16 }).map((_, i) => (
                <div key={i} className="aspect-[2/3] animate-pulse rounded-xl bg-card" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div
              onClick={() => setShowUpload(true)}
              className="flex h-64 cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border hover:border-accent/50"
            >
              <Upload size={32} className="text-muted" />
              <p className="font-medium">No books found</p>
              <p className="text-sm text-muted">Click to upload PDFs</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-6 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-8">
              {filtered.map((book) => (
                <BookCard
                  key={book.id}
                  book={book}
                  onFavoriteToggle={fetchBooks}
                  onDelete={fetchBooks}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {showUpload && (
        <UploadModal
          userId={userId}
          onClose={() => setShowUpload(false)}
          onSuccess={fetchBooks}
        />
      )}
    </div>
  );
}