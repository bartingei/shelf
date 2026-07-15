"use client";

import { useState, useRef, useCallback } from "react";
import { X, Upload, FileText, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

// PDF.js is loaded dynamically to avoid SSR issues
async function getPdfJs() {
  const pdfjsLib = await import("pdfjs-dist");
  pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
  return pdfjsLib;
}

// Pulls a short plain-text sample from the first couple pages, used for genre classification.
async function extractTextSample(pdf: any): Promise<string> {
  const pageCount = Math.min(pdf.numPages, 2);
  const parts: string[] = [];
  for (let i = 1; i <= pageCount; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    parts.push(content.items.map((item: any) => item.str).join(" "));
  }
  return parts.join(" ").slice(0, 3000);
}

// Renders the first page to a canvas and returns it as a JPEG blob for use as the cover thumbnail.
async function renderCoverThumbnail(pdf: any): Promise<Blob | null> {
  const page = await pdf.getPage(1);
  const baseViewport = page.getViewport({ scale: 1 });
  const scale = 400 / baseViewport.width;
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement("canvas");
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  await page.render({ canvasContext: ctx, viewport }).promise;

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.85);
  });
}

interface UploadFile {
  file: File;
  status: "pending" | "extracting" | "uploading" | "saving" | "done" | "error";
  title?: string;
  author?: string;
  pageCount?: number;
  error?: string;
}

interface UploadModalProps {
  userId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function UploadModal({ userId, onClose, onSuccess }: UploadModalProps) {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = (newFiles: FileList | null) => {
    if (!newFiles) return;
    const pdfs = Array.from(newFiles).filter((f) => f.type === "application/pdf");
    setFiles((prev) => [
      ...prev,
      ...pdfs.map((f) => ({ file: f, status: "pending" as const })),
    ]);
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    addFiles(e.dataTransfer.files);
  }, []);

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  async function uploadAll() {
    if (files.length === 0 || uploading) return;
    setUploading(true);

    const pdfjsLib = await getPdfJs();

    for (let i = 0; i < files.length; i++) {
      const item = files[i];
      if (item.status === "done") continue;

      // Step 1: Extract metadata with PDF.js
      setFiles((prev) =>
        prev.map((f, idx) => (idx === i ? { ...f, status: "extracting" } : f))
      );

      let title = item.file.name.replace(/\.pdf$/i, "");
      let author: string | undefined;
      let pageCount: number | undefined;
      let coverBlob: Blob | null = null;
      let textSample = "";

      try {
        const arrayBuffer = await item.file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const meta = await pdf.getMetadata().catch(() => null);
        pageCount = pdf.numPages;
        if (meta?.info) {
          const info = meta.info as Record<string, string>;
          if (info.Title?.trim()) title = info.Title.trim();
          if (info.Author?.trim()) author = info.Author.trim();
        }
        coverBlob = await renderCoverThumbnail(pdf).catch(() => null);
        textSample = await extractTextSample(pdf).catch(() => "");
      } catch {
        // metadata extraction failure is non-fatal — use filename as title
      }

      // Step 2: Upload file to Supabase Storage
      setFiles((prev) =>
        prev.map((f, idx) =>
          idx === i ? { ...f, status: "uploading", title, author, pageCount } : f
        )
      );

      const filePath = `${userId}/${Date.now()}.pdf`;

  const formData = new FormData();
  formData.append("file", item.file);
  formData.append("filePath", filePath);

  const uploadRes = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });

  if (!uploadRes.ok) {
    const err = await uploadRes.json();
    setFiles((prev) =>
      prev.map((f, idx) =>
        idx === i ? { ...f, status: "error", error: err.error || "Upload failed" } : f
      )
    );
    continue;
  }

      // Step 3: Save book record to database
      setFiles((prev) =>
        prev.map((f, idx) => (idx === i ? { ...f, status: "saving" } : f))
      );

      const res = await fetch("/api/books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, author, fileUrl: filePath, pageCount, textSample }),
      });

      if (!res.ok) {
        const err = await res.json();
        setFiles((prev) =>
          prev.map((f, idx) =>
            idx === i ? { ...f, status: "error", error: err.error || "Save failed" } : f
          )
        );
        continue;
      }

      const { book } = await res.json();

      // Step 4: Set the extracted cover thumbnail (best-effort — a missing cover isn't fatal)
      if (coverBlob) {
        const coverForm = new FormData();
        coverForm.append("file", coverBlob, "cover.jpg");
        await fetch(`/api/books/${book.id}/cover`, { method: "POST", body: coverForm }).catch(() => null);
      }

      setFiles((prev) =>
        prev.map((f, idx) => (idx === i ? { ...f, status: "done" } : f))
      );
    }

    setUploading(false);
    const allDone = files.every((f) => f.status === "done");
    if (allDone) {
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 800);
    }
  }

  const statusIcon = (status: UploadFile["status"]) => {
    if (status === "done") return <CheckCircle size={16} className="text-green-500" />;
    if (status === "error") return <AlertCircle size={16} className="text-red-500" />;
    if (["extracting", "uploading", "saving"].includes(status))
      return <Loader2 size={16} className="animate-spin text-accent" />;
    return <FileText size={16} className="text-muted" />;
  };

  const statusLabel = (status: UploadFile["status"]) => {
    if (status === "extracting") return "Reading metadata...";
    if (status === "uploading") return "Uploading...";
    if (status === "saving") return "Saving...";
    if (status === "done") return "Done";
    if (status === "error") return "Failed";
    return "Pending";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Upload PDFs</h2>
          <button onClick={onClose} className="text-muted hover:text-foreground">
            <X size={20} />
          </button>
        </div>

        {/* Drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "mb-4 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-8 text-center transition-colors",
            dragging ? "border-accent bg-accent/10" : "border-border hover:border-accent/50"
          )}
        >
          <Upload size={28} className="text-muted" />
          <p className="text-sm font-medium">Drop PDFs here or click to browse</p>
          <p className="text-xs text-muted">Multiple files supported</p>
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,application/pdf"
            multiple
            className="hidden"
            onChange={(e) => addFiles(e.target.files)}
          />
        </div>

        {/* File list */}
        {files.length > 0 && (
          <div className="mb-4 max-h-48 space-y-2 overflow-y-auto">
            {files.map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-lg border border-border bg-background px-3 py-2 text-sm"
              >
                {statusIcon(item.status)}
                <div className="flex-1 truncate">
                  <p className="truncate font-medium">
                    {item.title || item.file.name}
                  </p>
                  {item.error ? (
                    <p className="text-xs text-red-500">{item.error}</p>
                  ) : (
                    <p className="text-xs text-muted">
                      {item.pageCount ? `${item.pageCount} pages · ` : ""}
                      {statusLabel(item.status)}
                    </p>
                  )}
                </div>
                {item.status === "pending" && (
                  <button onClick={() => removeFile(i)} className="text-muted hover:text-foreground">
                    <X size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={uploading}
            className="flex-1 rounded-lg border border-border py-2 text-sm hover:bg-background disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={uploadAll}
            disabled={files.length === 0 || uploading}
            className="flex-1 rounded-lg bg-accent py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            {uploading
              ? "Uploading..."
              : `Upload ${files.length > 0 ? files.length : ""} PDF${files.length !== 1 ? "s" : ""}`}
          </button>
        </div>
      </div>
    </div>
  );
}
