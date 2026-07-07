"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useReaderStore, themeClassMap, fontClassMap } from "@/lib/reader-store";
import { cn } from "@/lib/utils";

async function getPdfJs() {
  const pdfjsLib = await import("pdfjs-dist");
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs";
  return pdfjsLib;
}

interface PdfViewerProps {
  bookId: string;
  initialPage?: number;
  onPageChange?: (page: number, total: number) => void;
}

export function PdfViewer({ bookId, initialPage = 1, onPageChange }: PdfViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderTaskRef = useRef<{ cancel: () => void } | null>(null);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { theme, fontPreference, currentPage, totalPages, setCurrentPage, setTotalPages } =
    useReaderStore();

  // Load PDF from our proxy API (bypasses CORS)
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const pdfjsLib = await getPdfJs();
        const res = await fetch(`/api/books/${bookId}/file`);
        if (!res.ok) throw new Error("Could not load PDF file");
        const arrayBuffer = await res.arrayBuffer();
        if (cancelled) return;
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        if (cancelled) return;
        setPdfDoc(pdf);
        setTotalPages(pdf.numPages);
        setCurrentPage(initialPage);
      } catch (err) {
        if (!cancelled) setError((err as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [bookId, initialPage, setCurrentPage, setTotalPages]);

  // Render current page whenever pdfDoc or currentPage changes
  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return;

    // Cancel any in-progress render
    if (renderTaskRef.current) {
      renderTaskRef.current.cancel();
      renderTaskRef.current = null;
    }

    let cancelled = false;

    async function render() {
      try {
        const page = await pdfDoc.getPage(currentPage);
        if (cancelled) return;

        const canvas = canvasRef.current!;
        const ctx = canvas.getContext("2d")!;

        // Scale to fill container width
        const containerWidth = canvas.parentElement?.clientWidth ?? 800;
        const viewport = page.getViewport({ scale: 1 });
        const scale = containerWidth / viewport.width;
        const scaled = page.getViewport({ scale: scale * window.devicePixelRatio });

        canvas.width = scaled.width;
        canvas.height = scaled.height;
        canvas.style.width = `${containerWidth}px`;
        canvas.style.height = `${scaled.height / window.devicePixelRatio}px`;

        const task = page.render({ canvasContext: ctx, viewport: scaled });
        renderTaskRef.current = task;
        await task.promise;
        onPageChange?.(currentPage, pdfDoc.numPages);
      } catch (err: any) {
        // "Rendering cancelled" is expected when navigating quickly — not a real error
        if (err?.name !== "RenderingCancelledException") {
          console.error("Render error:", err);
        }
      }
    }

    render();
    return () => { cancelled = true; };
  }, [pdfDoc, currentPage, onPageChange]);

  // Keyboard navigation
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") goNext();
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") goPrev();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [currentPage, totalPages]);

  const goPrev = useCallback(() => {
    setCurrentPage(Math.max(1, currentPage - 1));
  }, [currentPage, setCurrentPage]);

  const goNext = useCallback(() => {
    setCurrentPage(Math.min(totalPages, currentPage + 1));
  }, [currentPage, totalPages, setCurrentPage]);

  return (
    <div className={cn("reader-surface flex flex-1 flex-col overflow-hidden", themeClassMap[theme])}>
      {/* Scrollable page area */}
      <div className="flex flex-1 flex-col items-center overflow-y-auto px-4 py-8">
        <div className={cn("reader-column w-full", fontClassMap[fontPreference])}>
          {loading && (
            <div className="flex h-96 items-center justify-center text-sm text-muted">
              Loading PDF...
            </div>
          )}
          {error && (
            <div className="flex h-96 items-center justify-center text-sm text-red-500">
              {error}
            </div>
          )}
          <canvas
            ref={canvasRef}
            className={cn("mx-auto shadow-md", loading && "hidden")}
          />
        </div>
      </div>

      {/* Page navigation */}
      <div className="flex items-center justify-center gap-6 border-t border-border py-3">
        <button
          onClick={goPrev}
          disabled={currentPage <= 1}
          className="rounded-lg border border-border p-2 hover:bg-card disabled:opacity-30"
        >
          <ChevronLeft size={18} />
        </button>
        <span className="min-w-[100px] text-center text-sm">
          {currentPage} / {totalPages || "—"}
        </span>
        <button
          onClick={goNext}
          disabled={currentPage >= totalPages}
          className="rounded-lg border border-border p-2 hover:bg-card disabled:opacity-30"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}
