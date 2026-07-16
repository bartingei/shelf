"use client";

import { useEffect } from "react";
import { PdfViewer } from "./pdf-viewer";
import { AiPanel } from "./ai-panel";
import { ReaderSidebar } from "./reader-sidebar";
import { ProgressBar } from "./progress-bar";
import { useProgressSync } from "@/hooks/use-progress-sync";
import { useReaderStore } from "@/lib/reader-store";
import { HIGHLIGHT_COLORS } from "@/lib/highlight-colors";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { ArrowLeft, Highlighter } from "lucide-react";

interface ReaderClientProps {
  bookId: string;
  bookTitle: string;
  initialPage: number;
}

export function ReaderClient({ bookId, bookTitle, initialPage }: ReaderClientProps) {
  useProgressSync(bookId);
  const { highlightMode, setHighlightMode, activeHighlightColor, setActiveHighlightColor, setTheme, setFont } = useReaderStore();

  // B key to bookmark current page (triggers click on bookmark button via custom event)
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "b" || e.key === "B") {
        document.dispatchEvent(new CustomEvent("bookmark-current-page"));
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Apply the user's saved reader defaults (theme/font) once, on open.
  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then(({ readerTheme, fontPreference }) => {
        if (readerTheme) setTheme(readerTheme);
        if (fontPreference) setFont(fontPreference);
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Top bar */}
      <div className="flex items-center gap-3 border-b border-border bg-card px-4 py-3">
        <Link href="/library" className="text-muted hover:text-foreground">
          <ArrowLeft size={18} />
        </Link>
        <span className="flex-1 truncate text-sm font-medium">{bookTitle}</span>

        <button
          onClick={() => setHighlightMode(!highlightMode)}
          title={highlightMode ? "Highlighter is on — select text to highlight" : "Turn on the highlighter"}
          className={cn(
            "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
            highlightMode
              ? "border-gold bg-gold/15 text-gold"
              : "border-border text-muted hover:border-foreground/40 hover:text-foreground"
          )}
        >
          <Highlighter size={14} />
          Highlighter
          {highlightMode && <span className="h-1.5 w-1.5 rounded-full bg-gold" />}
        </button>

        {highlightMode && (
          <div className="flex items-center gap-1.5 rounded-full border border-border bg-background px-2 py-1.5">
            {HIGHLIGHT_COLORS.map((c) => (
              <button
                key={c.value}
                onClick={() => setActiveHighlightColor(c.value)}
                title={`Highlight color: ${c.value}`}
                className={cn(
                  "h-5 w-5 rounded-full border hover:scale-110",
                  c.swatchClass,
                  activeHighlightColor === c.value ? "border-foreground ring-2 ring-foreground/30" : "border-black/10"
                )}
              />
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar — tabbed: Display, Bookmarks, Notes, Highlights */}
        <ReaderSidebar bookId={bookId} />

        {/* PDF viewer */}
        <PdfViewer bookId={bookId} initialPage={initialPage} />

        {/* Right sidebar — AI */}
        <div className="w-60 shrink-0">
          <AiPanel />
        </div>
      </div>

      {/* Bottom progress bar */}
      <ProgressBar />
    </div>
  );
}