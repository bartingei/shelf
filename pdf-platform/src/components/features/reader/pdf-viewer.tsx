"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useReaderStore, themeClassMap } from "@/lib/reader-store";
import { cn } from "@/lib/utils";
import { HIGHLIGHT_COLORS } from "@/lib/highlight-colors";
import type { HighlightRect } from "@/types";

async function getPdfJs() {
  const pdfjsLib = await import("pdfjs-dist");
  // Self-hosted (same-origin) so it matches the installed pdfjs-dist version
  // exactly and isn't blocked by CSPs that disallow cross-origin workers.
  pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
  return pdfjsLib;
}

interface PdfViewerProps {
  bookId: string;
  initialPage?: number;
  onPageChange?: (page: number, total: number) => void;
}

interface PendingSelection {
  text: string;
  rects: HighlightRect[];
  toolbarX: number;
  toolbarY: number;
}

export function PdfViewer({ bookId, initialPage = 1, onPageChange }: PdfViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pageBoxRef = useRef<HTMLDivElement>(null);
  const textLayerRef = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const renderTaskRef = useRef<{ cancel: () => void } | null>(null);
  const textLayerTaskRef = useRef<{ cancel: () => void } | null>(null);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pageSize, setPageSize] = useState<{ width: number; height: number } | null>(null);
  const [pendingSelection, setPendingSelection] = useState<PendingSelection | null>(null);

  const {
    theme,
    currentPage,
    totalPages,
    setCurrentPage,
    setTotalPages,
    highlights,
    addHighlightLocal,
  } = useReaderStore();

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

  // Render current page (canvas + text layer) whenever pdfDoc or currentPage changes
  useEffect(() => {
    if (!pdfDoc || !canvasRef.current || !textLayerRef.current) return;

    // Cancel any in-progress render
    if (renderTaskRef.current) {
      renderTaskRef.current.cancel();
      renderTaskRef.current = null;
    }
    if (textLayerTaskRef.current) {
      textLayerTaskRef.current.cancel();
      textLayerTaskRef.current = null;
    }
    textLayerRef.current.replaceChildren();
    setPendingSelection(null);

    let cancelled = false;

    async function render() {
      try {
        const pdfjsLib = await getPdfJs();
        const page = await pdfDoc.getPage(currentPage);
        if (cancelled) return;

        const canvas = canvasRef.current!;
        const ctx = canvas.getContext("2d")!;

        // Scale to fill container width. Measured from the page box's parent
        // (not the page box itself) since the page box's own width is derived
        // from this same calculation — measuring it here would be circular.
        const containerWidth = pageBoxRef.current?.parentElement?.clientWidth ?? 800;
        const baseViewport = page.getViewport({ scale: 1 });
        const scale = containerWidth / baseViewport.width;
        const cssViewport = page.getViewport({ scale });
        const pixelViewport = page.getViewport({ scale: scale * window.devicePixelRatio });

        canvas.width = pixelViewport.width;
        canvas.height = pixelViewport.height;
        canvas.style.width = `${containerWidth}px`;
        canvas.style.height = `${cssViewport.height}px`;

        const task = page.render({ canvasContext: ctx, viewport: pixelViewport });
        renderTaskRef.current = task;
        await task.promise;
        if (cancelled) return;

        setPageSize({ width: containerWidth, height: cssViewport.height });

        // Real, selectable/copyable text layer aligned to the rendered glyphs.
        // pdf.js sizes each text span with `calc(var(--scale-factor) * Npx)`, so
        // the container MUST expose --scale-factor (= viewport scale) or the
        // invisible spans mis-size and no longer line up with the canvas glyphs.
        if (textLayerRef.current) {
          textLayerRef.current.style.setProperty("--scale-factor", String(scale));
          const textContent = await page.getTextContent();
          if (cancelled || !textLayerRef.current) return;
          const textLayer = new pdfjsLib.TextLayer({
            textContentSource: textContent,
            container: textLayerRef.current,
            viewport: cssViewport,
          });
          textLayerTaskRef.current = textLayer;
          await textLayer.render();
        }

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

  // Capture text selections made on the page and offer to save them as highlights
  useEffect(() => {
    function handleSelectionEnd(e: MouseEvent | TouchEvent) {
      // Let clicks inside the color-picker toolbar reach their own onClick handlers
      if (toolbarRef.current && e.target instanceof Node && toolbarRef.current.contains(e.target)) {
        return;
      }

      const selection = window.getSelection();
      if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
        setPendingSelection(null);
        return;
      }

      const textLayerEl = textLayerRef.current;
      const pageBoxEl = pageBoxRef.current;
      if (!textLayerEl || !pageBoxEl) return;

      const range = selection.getRangeAt(0);
      if (!textLayerEl.contains(range.commonAncestorContainer)) return;

      const text = selection.toString().trim();
      if (!text) return;

      const boxRect = pageBoxEl.getBoundingClientRect();
      const clientRects = Array.from(range.getClientRects()).filter((r) => r.width > 0 && r.height > 0);
      if (clientRects.length === 0) return;

      const rects: HighlightRect[] = clientRects.map((r) => ({
        x: (r.left - boxRect.left) / boxRect.width,
        y: (r.top - boxRect.top) / boxRect.height,
        width: r.width / boxRect.width,
        height: r.height / boxRect.height,
      }));

      const last = clientRects[clientRects.length - 1];
      setPendingSelection({
        text,
        rects,
        toolbarX: last.left - boxRect.left + last.width / 2,
        toolbarY: last.top - boxRect.top + last.height + 8,
      });
    }

    document.addEventListener("mouseup", handleSelectionEnd);
    document.addEventListener("touchend", handleSelectionEnd);
    return () => {
      document.removeEventListener("mouseup", handleSelectionEnd);
      document.removeEventListener("touchend", handleSelectionEnd);
    };
  }, []);

  async function createHighlight(colorTag: string) {
    if (!pendingSelection) return;
    try {
      const res = await fetch(`/api/highlights/${bookId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          page: currentPage,
          textContent: pendingSelection.text,
          colorTag,
          rects: pendingSelection.rects,
        }),
      });
      if (res.ok) {
        const { highlight } = await res.json();
        addHighlightLocal(highlight);
      }
    } finally {
      window.getSelection()?.removeAllRanges();
      setPendingSelection(null);
    }
  }

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

  const pageHighlights = highlights.filter((h) => h.page === currentPage && h.rects?.length);

  return (
    <div className={cn("reader-surface flex flex-1 flex-col overflow-hidden", themeClassMap[theme])}>
      {/* Scrollable page area */}
      <div className="flex flex-1 flex-col items-center overflow-y-auto px-4 py-8">
        <div className="reader-column w-full">
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

          <div
            ref={pageBoxRef}
            className={cn("relative mx-auto shadow-md", loading && "hidden")}
            style={pageSize ? { width: pageSize.width, height: pageSize.height } : undefined}
          >
            <canvas ref={canvasRef} className="block" />

            {/* Saved highlights for this page */}
            <div className="pointer-events-none absolute inset-0">
              {pageHighlights.map((h) =>
                h.rects!.map((r, i) => (
                  <div
                    key={`${h.id}-${i}`}
                    className="absolute rounded-sm"
                    style={{
                      left: `${r.x * 100}%`,
                      top: `${r.y * 100}%`,
                      width: `${r.width * 100}%`,
                      height: `${r.height * 100}%`,
                      backgroundColor:
                        HIGHLIGHT_COLORS.find((c) => c.value === h.colorTag)?.rgba ??
                        HIGHLIGHT_COLORS[0].rgba,
                      mixBlendMode: "multiply",
                    }}
                  />
                ))
              )}
            </div>

            {/* Real, selectable/copyable text */}
            <div ref={textLayerRef} className="textLayer" />

            {/* Color picker for a pending selection */}
            {pendingSelection && (
              <div
                ref={toolbarRef}
                className="absolute z-10 flex -translate-x-1/2 items-center gap-1.5 rounded-lg border border-border bg-card px-2 py-1.5 shadow-lg"
                style={{ left: pendingSelection.toolbarX, top: pendingSelection.toolbarY }}
              >
                {HIGHLIGHT_COLORS.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => createHighlight(c.value)}
                    title={`Highlight ${c.value}`}
                    className={cn("h-5 w-5 rounded-full border border-black/10 hover:scale-110", c.swatchClass)}
                  />
                ))}
              </div>
            )}
          </div>
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
