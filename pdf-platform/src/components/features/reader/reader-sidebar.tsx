"use client";

import { useState, useEffect, useCallback } from "react";
import { Bookmark, FileText, Highlighter, Palette, Trash2, Plus, BookMarked, X } from "lucide-react";
import { useReaderStore } from "@/lib/reader-store";
import { ThemeSwitcher } from "./theme-switcher";
import { cn } from "@/lib/utils";

type Tab = "display" | "bookmarks" | "notes" | "highlights";

interface ReaderSidebarProps {
  bookId: string;
  open: boolean;
  onClose: () => void;
}

export function ReaderSidebar({ bookId, open, onClose }: ReaderSidebarProps) {
  const [tab, setTab] = useState<Tab>("display");
  const { currentPage, setCurrentPage, highlights, setHighlights, removeHighlightLocal } = useReaderStore();

  // Bookmarks
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [isBookmarked, setIsBookmarked] = useState(false);

  // Notes
  const [notes, setNotes] = useState<any[]>([]);
  const [newNote, setNewNote] = useState("");
  const [addingNote, setAddingNote] = useState(false);

  const fetchBookmarks = useCallback(async () => {
    const { bookmarks = [] } = await fetch(`/api/bookmarks/${bookId}`).then((r) => r.json());
    setBookmarks(bookmarks);
  }, [bookId]);

  const fetchNotes = useCallback(async () => {
    const { notes = [] } = await fetch(`/api/notes/${bookId}`).then((r) => r.json());
    setNotes(notes);
  }, [bookId]);

  useEffect(() => {
    fetchBookmarks();
    fetchNotes();
    fetch(`/api/highlights/${bookId}`)
      .then((r) => r.json())
      .then(({ highlights = [] }) => setHighlights(highlights));
  }, [bookId, fetchBookmarks, fetchNotes, setHighlights]);

  useEffect(() => {
    setIsBookmarked(bookmarks.some((b) => b.page === currentPage));
  }, [bookmarks, currentPage]);

  const toggleBookmark = useCallback(async () => {
    await fetch(`/api/bookmarks/${bookId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ page: currentPage, label: `Page ${currentPage}` }),
    });
    fetchBookmarks();
  }, [bookId, currentPage, fetchBookmarks]);

  // "B" shortcut (dispatched from ReaderClient) bookmarks the current page
  useEffect(() => {
    document.addEventListener("bookmark-current-page", toggleBookmark);
    return () => document.removeEventListener("bookmark-current-page", toggleBookmark);
  }, [toggleBookmark]);

  async function deleteBookmark(id: string) {
    await fetch(`/api/bookmarks/${bookId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    fetchBookmarks();
  }

  async function addNote() {
    if (!newNote.trim()) return;
    setAddingNote(true);
    await fetch(`/api/notes/${bookId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ page: currentPage, content: newNote }),
    });
    setNewNote("");
    setAddingNote(false);
    fetchNotes();
  }

  async function deleteNote(id: string) {
    await fetch(`/api/notes/${bookId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    fetchNotes();
  }

  async function deleteHighlight(id: string) {
    await fetch(`/api/highlights/${bookId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    removeHighlightLocal(id);
  }

  const tabs = [
    { id: "display" as Tab, icon: Palette, label: "Display" },
    { id: "bookmarks" as Tab, icon: Bookmark, label: "Bookmarks", count: bookmarks.length },
    { id: "notes" as Tab, icon: FileText, label: "Notes", count: notes.length },
    { id: "highlights" as Tab, icon: Highlighter, label: "Highlights", count: highlights.length },
  ];

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={onClose} aria-hidden />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-border bg-card transition-transform duration-200 lg:static lg:z-auto lg:w-52 lg:shrink-0 lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between border-b border-border px-3 py-2 lg:hidden">
          <span className="text-sm font-medium">Reader tools</span>
          <button onClick={onClose} className="text-muted hover:text-foreground">
            <X size={18} />
          </button>
        </div>
        {/* Tab bar */}
        <div className="flex border-b border-border">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            title={t.label}
            className={cn(
              "relative flex flex-1 items-center justify-center py-3",
              tab === t.id ? "border-b-2 border-accent text-accent" : "text-muted hover:text-foreground"
            )}
          >
            <t.icon size={16} />
            {t.count !== undefined && t.count > 0 && (
              <span className="absolute right-1 top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-accent text-[9px] text-white">
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {/* Display tab */}
        {tab === "display" && (
          <div className="space-y-4">
            <ThemeSwitcher />
            <div>
              <p className="mb-1 text-xs uppercase tracking-wide text-muted">Navigation</p>
              <p className="text-xs text-muted">← → Arrow keys to turn pages</p>
              <p className="text-xs text-muted mt-1">B to bookmark current page</p>
            </div>
          </div>
        )}

        {/* Bookmarks tab */}
        {tab === "bookmarks" && (
          <div className="space-y-2">
            <button
              onClick={toggleBookmark}
              className={cn(
                "flex w-full items-center gap-2 rounded-md border px-3 py-2 text-xs font-medium",
                isBookmarked
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-border hover:bg-background"
              )}
            >
              <BookMarked size={13} />
              {isBookmarked ? "Remove bookmark" : "Bookmark page " + currentPage}
            </button>

            {bookmarks.length === 0 ? (
              <p className="pt-2 text-center text-xs text-muted">No bookmarks yet</p>
            ) : (
              bookmarks.map((b) => (
                <div
                  key={b.id}
                  className="flex items-center gap-2 rounded-md border border-border bg-background px-2 py-1.5"
                >
                  <button
                    onClick={() => setCurrentPage(b.page)}
                    className="flex-1 text-left text-xs hover:text-accent"
                  >
                    Page {b.page}
                  </button>
                  <button onClick={() => deleteBookmark(b.id)} className="text-muted hover:text-red-500">
                    <Trash2 size={11} />
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* Notes tab */}
        {tab === "notes" && (
          <div className="space-y-2">
            <div className="space-y-1">
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder={`Note for page ${currentPage}...`}
                rows={3}
                className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-accent resize-none"
              />
              <button
                onClick={addNote}
                disabled={addingNote || !newNote.trim()}
                className="flex w-full items-center justify-center gap-1 rounded-md bg-accent py-1.5 text-xs font-medium text-white disabled:opacity-50"
              >
                <Plus size={12} /> Add note
              </button>
            </div>

            {notes.length === 0 ? (
              <p className="pt-2 text-center text-xs text-muted">No notes yet</p>
            ) : (
              notes.map((n) => (
                <div key={n.id} className="rounded-md border border-border bg-background p-2">
                  <div className="mb-1 flex items-center justify-between">
                    <button
                      onClick={() => setCurrentPage(n.page)}
                      className="text-[10px] text-muted hover:text-accent"
                    >
                      Page {n.page}
                    </button>
                    <button onClick={() => deleteNote(n.id)} className="text-muted hover:text-red-500">
                      <Trash2 size={11} />
                    </button>
                  </div>
                  <p className="text-xs leading-relaxed">{n.content}</p>
                </div>
              ))
            )}
          </div>
        )}

        {/* Highlights tab */}
        {tab === "highlights" && (
          <div className="space-y-2">
            <p className="text-xs text-muted">
              Turn on the highlighter above the page, pick a color, then select text to highlight it.
            </p>

            {highlights.length === 0 ? (
              <p className="pt-2 text-center text-xs text-muted">No highlights yet</p>
            ) : (
              highlights.map((h) => (
                <div key={h.id} className="rounded-md border border-border bg-background p-2">
                  <div className="mb-1 flex items-center justify-between">
                    <button
                      onClick={() => setCurrentPage(h.page)}
                      className="text-[10px] text-muted hover:text-accent"
                    >
                      Page {h.page}
                    </button>
                    <button
                      onClick={() => deleteHighlight(h.id)}
                      className="text-muted hover:text-red-500"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                  <p
                    className={cn(
                      "rounded px-1 text-xs leading-relaxed",
                      h.colorTag === "yellow" && "bg-yellow-200",
                      h.colorTag === "green" && "bg-green-200",
                      h.colorTag === "blue" && "bg-blue-200",
                      h.colorTag === "pink" && "bg-pink-200"
                    )}
                  >
                    {h.textContent}
                  </p>
                </div>
              ))
            )}
          </div>
        )}
      </div>
      </aside>
    </>
  );
}