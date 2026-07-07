"use client";

import { useState, useEffect, useCallback } from "react";
import { Bookmark, FileText, Highlighter, Palette, Trash2, Plus, BookMarked } from "lucide-react";
import { useReaderStore } from "@/lib/reader-store";
import { ThemeSwitcher } from "./theme-switcher";
import { cn } from "@/lib/utils";

type Tab = "display" | "bookmarks" | "notes" | "highlights";

const COLORS = [
  { value: "yellow", bg: "bg-yellow-300" },
  { value: "green", bg: "bg-green-300" },
  { value: "blue", bg: "bg-blue-300" },
  { value: "pink", bg: "bg-pink-300" },
];

interface ReaderSidebarProps {
  bookId: string;
}

export function ReaderSidebar({ bookId }: ReaderSidebarProps) {
  const [tab, setTab] = useState<Tab>("display");
  const { currentPage, setCurrentPage } = useReaderStore();

  // Bookmarks
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [isBookmarked, setIsBookmarked] = useState(false);

  // Notes
  const [notes, setNotes] = useState<any[]>([]);
  const [newNote, setNewNote] = useState("");
  const [addingNote, setAddingNote] = useState(false);

  // Highlights
  const [highlights, setHighlights] = useState<any[]>([]);
  const [newHighlight, setNewHighlight] = useState("");
  const [highlightColor, setHighlightColor] = useState("yellow");
  const [addingHighlight, setAddingHighlight] = useState(false);

  const fetchAll = useCallback(async () => {
    const [bRes, nRes, hRes] = await Promise.all([
      fetch(`/api/bookmarks/${bookId}`).then((r) => r.json()),
      fetch(`/api/notes/${bookId}`).then((r) => r.json()),
      fetch(`/api/highlights/${bookId}`).then((r) => r.json()),
    ]);
    setBookmarks(bRes.bookmarks ?? []);
    setNotes(nRes.notes ?? []);
    setHighlights(hRes.highlights ?? []);
  }, [bookId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  useEffect(() => {
    setIsBookmarked(bookmarks.some((b) => b.page === currentPage));
  }, [bookmarks, currentPage]);

  async function toggleBookmark() {
    await fetch(`/api/bookmarks/${bookId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ page: currentPage, label: `Page ${currentPage}` }),
    });
    fetchAll();
  }

  async function deleteBookmark(id: string) {
    await fetch(`/api/bookmarks/${bookId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    fetchAll();
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
    fetchAll();
  }

  async function deleteNote(id: string) {
    await fetch(`/api/notes/${bookId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    fetchAll();
  }

  async function addHighlight() {
    if (!newHighlight.trim()) return;
    setAddingHighlight(true);
    await fetch(`/api/highlights/${bookId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        page: currentPage,
        textContent: newHighlight,
        colorTag: highlightColor,
      }),
    });
    setNewHighlight("");
    setAddingHighlight(false);
    fetchAll();
  }

  async function deleteHighlight(id: string) {
    await fetch(`/api/highlights/${bookId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    fetchAll();
  }

  const tabs = [
    { id: "display" as Tab, icon: Palette, label: "Display" },
    { id: "bookmarks" as Tab, icon: Bookmark, label: "Bookmarks", count: bookmarks.length },
    { id: "notes" as Tab, icon: FileText, label: "Notes", count: notes.length },
    { id: "highlights" as Tab, icon: Highlighter, label: "Highlights", count: highlights.length },
  ];

  return (
    <aside className="flex h-full w-52 shrink-0 flex-col border-r border-border bg-card">
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
            <div className="space-y-1">
              <textarea
                value={newHighlight}
                onChange={(e) => setNewHighlight(e.target.value)}
                placeholder={`Paste highlighted text from page ${currentPage}...`}
                rows={3}
                className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-accent resize-none"
              />
              <div className="flex items-center gap-1">
                {COLORS.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => setHighlightColor(c.value)}
                    className={cn(
                      "h-5 w-5 rounded-full border-2",
                      c.bg,
                      highlightColor === c.value ? "border-foreground" : "border-transparent"
                    )}
                  />
                ))}
              </div>
              <button
                onClick={addHighlight}
                disabled={addingHighlight || !newHighlight.trim()}
                className="flex w-full items-center justify-center gap-1 rounded-md bg-accent py-1.5 text-xs font-medium text-white disabled:opacity-50"
              >
                <Plus size={12} /> Save highlight
              </button>
            </div>

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
  );
}