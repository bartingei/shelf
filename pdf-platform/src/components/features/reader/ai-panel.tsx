"use client";

export function AiPanel() {
  return (
    <div className="flex h-full flex-col gap-3 border-l border-border bg-card p-4 text-sm">
      <h3 className="font-medium">AI Tools</h3>

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
  );
}
