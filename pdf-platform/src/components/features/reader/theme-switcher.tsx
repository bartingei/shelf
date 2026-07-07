"use client";

import { useReaderStore } from "@/lib/reader-store";
import { cn } from "@/lib/utils";
import type { ReaderThemeName, FontPreferenceName } from "@/types";

const themes: { value: ReaderThemeName; label: string }[] = [
  { value: "DEFAULT", label: "Default" },
  { value: "PAPER", label: "Paper" },
  { value: "NIGHT", label: "Night" },
];

const fonts: { value: FontPreferenceName; label: string }[] = [
  { value: "SANS", label: "Sans" },
  { value: "SERIF", label: "Serif" },
  { value: "DYSLEXIC", label: "Dyslexic" },
];

export function ThemeSwitcher() {
  const { theme, fontPreference, setTheme, setFontPreference } = useReaderStore();

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
      <div>
        <p className="mb-1 text-xs uppercase tracking-wide text-muted">Font</p>
        <div className="flex gap-1">
          {fonts.map((f) => (
            <button
              key={f.value}
              onClick={() => setFontPreference(f.value)}
              className={cn(
                "rounded-md border border-border px-2 py-1 text-xs",
                fontPreference === f.value && "border-accent bg-accent/10"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
