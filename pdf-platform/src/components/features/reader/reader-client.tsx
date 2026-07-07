"use client";

import { useEffect } from "react";
import { PdfViewer } from "./pdf-viewer";
import { AiPanel } from "./ai-panel";
import { ReaderSidebar } from "./reader-sidebar";
import { ProgressBar } from "./progress-bar";
import { useProgressSync } from "@/hooks/use-progress-sync";
import { useReaderStore } from "@/lib/reader-store";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface ReaderClientProps {
  bookId: string;
  bookTitle: string;
  initialPage: number;
}

export function ReaderClient({ bookId, bookTitle, initialPage }: ReaderClientProps) {
  useProgressSync(bookId);

  // B key to bookmark current page (triggers click on bookmark button via custom event)
  const { currentPage } = useReaderStore();
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "b" || e.key === "B") {
        document.dispatchEvent(new CustomEvent("bookmark-current-page"));
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [currentPage]);

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Top bar */}
      <div className="flex items-center gap-3 border-b border-border bg-card px-4 py-3">
        <Link href="/library" className="text-muted hover:text-foreground">
          <ArrowLeft size={18} />
        </Link>
        <span className="text-sm font-medium truncate">{bookTitle}</span>
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