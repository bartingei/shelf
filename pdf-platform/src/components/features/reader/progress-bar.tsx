"use client";

import { useReaderStore } from "@/lib/reader-store";
import { calcPercentComplete, formatTimeRemaining } from "@/lib/utils";

// Placeholder: replace with the user's real pages-per-minute average from ReadingSession data
const ASSUMED_PAGES_PER_MINUTE = 1.2;

export function ProgressBar() {
  const { currentPage, totalPages } = useReaderStore();
  const percent = calcPercentComplete(currentPage, totalPages);
  const pagesLeft = Math.max(0, totalPages - currentPage);
  const minutesLeft = pagesLeft / ASSUMED_PAGES_PER_MINUTE;

  return (
    <div className="flex items-center gap-4 border-t border-border bg-card px-6 py-3 text-xs text-muted">
      <span>
        Page {currentPage} {totalPages ? `of ${totalPages}` : ""}
      </span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-border">
        <div className="h-full bg-accent transition-all" style={{ width: `${percent}%` }} />
      </div>
      <span>{percent}%</span>
      {totalPages > 0 && <span>{formatTimeRemaining(minutesLeft)}</span>}
    </div>
  );
}
