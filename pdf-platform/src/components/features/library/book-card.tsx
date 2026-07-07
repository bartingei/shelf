"use client";

import Link from "next/link";
import { useState } from "react";
import { Star, Play, MoreVertical } from "lucide-react";
import { BookDetailModal } from "./book-detail-modal";
import type { Book } from "@/types";
import { cn } from "@/lib/utils";

interface BookCardProps {
  book: Book;
  onFavoriteToggle?: () => void;
  onDelete?: () => void;
}

export function BookCard({ book, onFavoriteToggle, onDelete }: BookCardProps) {
  const [hovered, setHovered] = useState(false);
  const [favoriting, setFavoriting] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [currentBook, setCurrentBook] = useState(book);

  async function toggleFavorite(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (favoriting) return;
    setFavoriting(true);
    await fetch(`/api/books/${book.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isFavorite: !currentBook.isFavorite }),
    });
    onFavoriteToggle?.();
    setFavoriting(false);
  }

  const progress = (currentBook as any).progress;
  const percent = progress?.percentComplete ?? 0;

  return (
    <>
      <div
        className="group relative w-full"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Card */}
        <div
          className={cn(
            "relative aspect-[2/3] overflow-hidden rounded-xl shadow-lg transition-transform duration-200",
            hovered && "scale-105 shadow-2xl shadow-black/50"
          )}
        >
          {currentBook.coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={currentBook.coverUrl}
              alt={currentBook.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-gradient-to-br from-accent/30 via-accent/10 to-transparent p-4 text-center">
              <span className="text-4xl">📖</span>
              <span className="line-clamp-3 text-xs font-medium leading-tight text-foreground/80">
                {currentBook.title}
              </span>
            </div>
          )}

          {/* Progress bar */}
          {percent > 0 && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/40">
              <div
                className="h-full bg-accent transition-all"
                style={{ width: `${percent}%` }}
              />
            </div>
          )}

          {/* Hover overlay */}
          {hovered && (
            <div className="absolute inset-0 flex flex-col items-end justify-between bg-gradient-to-t from-black/90 via-black/40 to-transparent p-3">
              {/* Top actions */}
              <div className="flex gap-1.5">
                <button
                  onClick={toggleFavorite}
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-black/50 backdrop-blur-sm hover:bg-black/70"
                >
                  <Star
                    size={13}
                    className={cn(
                      currentBook.isFavorite
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-white"
                    )}
                  />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDetail(true);
                  }}
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-black/50 backdrop-blur-sm hover:bg-black/70"
                >
                  <MoreVertical size={13} className="text-white" />
                </button>
              </div>

              {/* Bottom action */}
              <Link
                href={`/reader/${currentBook.id}`}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-white py-2 text-xs font-semibold text-black hover:bg-white/90"
              >
                <Play size={12} fill="black" />
                {percent > 0 ? "Continue" : "Read"}
              </Link>
            </div>
          )}
        </div>

        {/* Info below card */}
        <div className="mt-2 space-y-0.5 px-0.5">
          <p className="truncate text-sm font-medium leading-tight">{currentBook.title}</p>
          {currentBook.author && (
            <p className="truncate text-xs text-muted">{currentBook.author}</p>
          )}
          {percent > 0 && (
            <p className="text-xs text-accent">{percent}% read</p>
          )}
        </div>
      </div>

      {showDetail && (
        <BookDetailModal
          book={currentBook}
          onClose={() => setShowDetail(false)}
          onUpdate={(updated) => setCurrentBook((prev) => ({ ...prev, ...updated }))}
          onDelete={() => {
            setShowDetail(false);
            onDelete?.();
          }}
        />
      )}
    </>
  );
}