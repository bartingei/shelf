"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookCard } from "@/components/features/library/book-card";
import { Sidebar } from "@/components/ui/sidebar";
import { UploadModal } from "@/components/features/library/upload-modal";
import type { Book } from "@/types";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
}

function BookRail({ title, books, onRefresh }: { title: string; books: Book[]; onRefresh: () => void }) {
  if (books.length === 0) return null;
  return (
    <section className="mb-10">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">{title}</h2>
        <Link href="/library" className="text-xs text-muted hover:text-accent">
          See all →
        </Link>
      </div>
      <div className="flex gap-5 overflow-x-auto pb-2">
        {books.map((book) => (
          <div key={book.id} className="w-36 shrink-0">
            <BookCard book={book} onFavoriteToggle={onRefresh} onDelete={onRefresh} />
          </div>
        ))}
      </div>
    </section>
  );
}

export function DashboardClient({ userName, userId }: { userName: string; userId: string }) {
  const [continueReading, setContinueReading] = useState<Book[]>([]);
  const [recentlyAdded, setRecentlyAdded] = useState<Book[]>([]);
  const [favorites, setFavorites] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);

  const fetchAll = async () => {
    const [lastRead, recent, fav] = await Promise.all([
      fetch("/api/books?sort=lastRead&limit=10").then((r) => r.json()),
      fetch("/api/books?sort=recent&limit=10").then((r) => r.json()),
      fetch("/api/books?favorite=true&limit=10").then((r) => r.json()),
    ]);
    setContinueReading(lastRead.books ?? []);
    setRecentlyAdded(recent.books ?? []);
    setFavorites(fav.books ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const firstName = userName.split(" ")[0];
  const isEmpty = !loading && continueReading.length === 0 && recentlyAdded.length === 0;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar onUpload={() => setShowUpload(true)} />

      <main className="flex flex-1 flex-col overflow-y-auto">
        {/* Hero */}
        <div className="bg-gradient-to-b from-accent/10 to-transparent px-10 py-12">
          <p className="text-sm font-medium text-muted">{getGreeting()}</p>
          <h1 className="mt-1 text-4xl font-bold">
            {firstName ? `Welcome back, ${firstName}` : "Welcome back"}
          </h1>
          {isEmpty && (
            <button
              onClick={() => setShowUpload(true)}
              className="mt-6 rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-white hover:opacity-90"
            >
              Upload your first PDF →
            </button>
          )}
        </div>

        {/* Rails */}
        <div className="px-10 py-6">
          {loading ? (
            <div className="space-y-10">
              {["Continue Reading", "Recently Added"].map((label) => (
                <section key={label}>
                  <h2 className="mb-4 text-lg font-semibold">{label}</h2>
                  <div className="flex gap-5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="h-52 w-36 animate-pulse rounded-xl bg-card" />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          ) : (
            <>
              <BookRail title="Continue Reading" books={continueReading} onRefresh={fetchAll} />
              <BookRail title="Recently Added" books={recentlyAdded} onRefresh={fetchAll} />
              <BookRail title="Favorites" books={favorites} onRefresh={fetchAll} />
            </>
          )}
        </div>
      </main>

      {showUpload && (
        <UploadModal
          userId={userId}
          onClose={() => setShowUpload(false)}
          onSuccess={fetchAll}
        />
      )}
    </div>
  );
}