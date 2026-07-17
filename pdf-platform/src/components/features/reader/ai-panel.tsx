"use client";

import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface AiPanelProps {
  open: boolean;
  onClose: () => void;
}

export function AiPanel({ open, onClose }: AiPanelProps) {
  return (
    <>
      {open && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={onClose} aria-hidden />
      )}
      <div
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex w-72 flex-col gap-3 border-l border-border bg-card p-4 text-sm transition-transform duration-200 lg:static lg:z-auto lg:w-60 lg:shrink-0 lg:translate-x-0",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-medium">AI Tools</h3>
          <button onClick={onClose} className="text-muted hover:text-foreground lg:hidden">
            <X size={18} />
          </button>
        </div>

        <button className="rounded-md border border-border px-3 py-2 text-left hover:bg-background">
          💡 Explain selection
        </button>
        <button className="rounded-md border border-border px-3 py-2 text-left hover:bg-background">
          📝 Summarize (chapter / page / book)
        </button>

        <div className="mt-2 border-t border-border pt-3 text-xs text-muted">Coming soon</div>
        <button disabled className="cursor-not-allowed rounded-md border border-border px-3 py-2 text-left opacity-50">
          🧠 Flashcards
        </button>
        <button disabled className="cursor-not-allowed rounded-md border border-border px-3 py-2 text-left opacity-50">
          ❓ Quiz me
        </button>
        <button disabled className="cursor-not-allowed rounded-md border border-border px-3 py-2 text-left opacity-50">
          🌐 Translate
        </button>
      </div>
    </>
  );
}
