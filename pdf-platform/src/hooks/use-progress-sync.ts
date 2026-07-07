"use client";

import { useEffect, useRef } from "react";
import { useReaderStore } from "@/lib/reader-store";

// Saves progress to /api/progress/[bookId] 2 seconds after the last page change.
// This avoids hammering the API on every page turn.
export function useProgressSync(bookId: string) {
  const { currentPage, totalPages } = useReaderStore();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!bookId || !currentPage || !totalPages) return;

    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(async () => {
      try {
        await fetch(`/api/progress/${bookId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ currentPage, totalPages }),
        });
      } catch {
        // Non-fatal: progress sync failure shouldn't break the reading experience
      }
    }, 2000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [bookId, currentPage, totalPages]);
}
