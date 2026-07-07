"use client";

import { useRef, useState } from "react";
import { Camera, Loader2 } from "lucide-react";

interface CoverUploadProps {
  bookId: string;
  onSuccess: (coverUrl: string) => void;
}

export function CoverUpload({ bookId, onSuccess }: CoverUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`/api/books/${bookId}/cover`, {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Upload failed");
      return;
    }

    onSuccess(data.coverUrl);
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={() => inputRef.current?.click()}
        disabled={loading}
        className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm hover:bg-background disabled:opacity-50"
      >
        {loading ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
        {loading ? "Uploading..." : "Change Cover"}
      </button>
      {error && <p className="text-xs text-red-500">{error}</p>}
      <p className="text-xs text-muted">JPG, PNG or WebP</p>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFile}
      />
    </div>
  );
}