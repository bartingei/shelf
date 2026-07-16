import { create } from "zustand";
import type { ReaderThemeName, FontPreferenceName, Highlight } from "@/types";
import { HIGHLIGHT_COLORS } from "@/lib/highlight-colors";

interface ReaderState {
  theme: ReaderThemeName;
  font: FontPreferenceName;
  currentPage: number;
  totalPages: number;
  highlights: Highlight[];
  highlightMode: boolean;
  activeHighlightColor: string;
  setTheme: (theme: ReaderThemeName) => void;
  setFont: (font: FontPreferenceName) => void;
  setCurrentPage: (page: number) => void;
  setTotalPages: (total: number) => void;
  setHighlights: (highlights: Highlight[]) => void;
  addHighlightLocal: (highlight: Highlight) => void;
  removeHighlightLocal: (id: string) => void;
  setHighlightMode: (mode: boolean) => void;
  setActiveHighlightColor: (color: string) => void;
}

export const useReaderStore = create<ReaderState>((set) => ({
  theme: "DEFAULT",
  font: "SANS",
  currentPage: 1,
  totalPages: 0,
  highlights: [],
  highlightMode: false,
  activeHighlightColor: HIGHLIGHT_COLORS[0].value,
  setTheme: (theme) => set({ theme }),
  setFont: (font) => set({ font }),
  setCurrentPage: (currentPage) => set({ currentPage }),
  setTotalPages: (totalPages) => set({ totalPages }),
  setHighlights: (highlights) => set({ highlights }),
  addHighlightLocal: (highlight) => set((s) => ({ highlights: [...s.highlights, highlight] })),
  removeHighlightLocal: (id) => set((s) => ({ highlights: s.highlights.filter((h) => h.id !== id) })),
  setHighlightMode: (highlightMode) => set({ highlightMode }),
  setActiveHighlightColor: (activeHighlightColor) => set({ activeHighlightColor }),
}));

export const themeClassMap: Record<ReaderThemeName, string> = {
  DEFAULT: "theme-default",
  PAPER: "theme-paper",
  NIGHT: "theme-night",
};

export const fontClassMap: Record<FontPreferenceName, string> = {
  SANS: "font-sans",
  SERIF: "font-serif",
  DYSLEXIC: "font-dyslexic",
};
