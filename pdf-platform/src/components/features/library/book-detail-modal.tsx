"use client";

import { useState } from "react";
import { X, Trash2, Loader2 } from "lucide-react";
import { CoverUpload } from "./cover-upload";
import { GENRE_LABELS, type Book } from "@/types";

interface BookDetailModalProps {
  book: Book;
  onClose: () => void;
  onUpdate: (updated: Partial<Book>) => void;
  onDelete: () => void;
}

export function BookDetailModal({ book, onClose, onUpdate, onDelete }: BookDetailModalProps) {
  const [coverUrl, setCoverUrl] = useState(book.coverUrl);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  function handleCoverSuccess(url: string) {
    setCoverUrl(url);
    onUpdate({ coverUrl: url });
  }

  async function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setDeleting(true);
    await fetch(`/api/books/${book.id}`, { method: "DELETE" });
    onDelete();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="truncate pr-4 text-base font-semibold">{book.title}</h2>
          <button onClick={onClose} className="shrink-0 text-muted hover:text-foreground">
            <X size={20} />
          </button>
        </div>

        {/* Cover preview */}
        <div className="mb-4 flex justify-center">
          <div className="relative h-52 w-36 overflow-hidden rounded-xl shadow-lg">
            {coverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={coverUrl} alt={book.title} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-accent/30 to-accent/10 p-3 text-center">
                <span className="text-4xl">📖</span>
                <span className="text-xs font-medium text-muted">{book.title}</span>
              </div>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="mb-4 space-y-1 text-center">
          {book.author && <p className="text-sm text-muted">{book.author}</p>}
          {book.pageCount && <p className="text-xs text-muted">{book.pageCount} pages</p>}
          <p className="text-xs text-muted">
            {GENRE_LABELS[book.genre] ?? "Uncategorized"}
          </p>
        </div>

        {/* Cover upload */}
        <div className="mb-4 flex justify-center">
          <CoverUpload bookId={book.id} onSuccess={handleCoverSuccess} />
        </div>

        {/* Delete */}
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-500/30 py-2 text-sm font-medium text-red-400 hover:bg-red-500/10 disabled:opacity-50"
        >
          {deleting ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Trash2 size={14} />
          )}
          {confirmDelete ? "Tap again to confirm delete" : "Delete book"}
        </button>
      </div>
    </div>
  );
}