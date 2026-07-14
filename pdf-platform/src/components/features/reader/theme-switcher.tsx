"use client";

import { useReaderStore } from "@/lib/reader-store";
import { cn } from "@/lib/utils";
import type { ReaderThemeName } from "@/types";

const themes: { value: ReaderThemeName; label: string }[] = [
  { value: "DEFAULT", label: "Default" },
  { value: "PAPER", label: "Paper" },
  { value: "NIGHT", label: "Night" },
];

export function ThemeSwitcher() {
  const { theme, setTheme } = useReaderStore();

  return (
    <div className="flex flex-col gap-3 text-sm">
      <div>
        <p className="mb-1 text-xs uppercase tracking-wide text-muted">Theme</p>
        <div className="flex gap-1">
          {themes.map((t) => (
            <button
              key={t.value}
              onClick={() => setTheme(t.value)}
              className={cn(
                "rounded-md border border-border px-2 py-1 text-xs",
                theme === t.value && "border-accent bg-accent/10"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
