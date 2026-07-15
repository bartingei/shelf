import { create } from "zustand";
import type { ReaderThemeName, Highlight } from "@/types";

interface ReaderState {
  theme: ReaderThemeName;
  currentPage: number;
  totalPages: number;
  highlights: Highlight[];
  setTheme: (theme: ReaderThemeName) => void;
  setCurrentPage: (page: number) => void;
  setTotalPages: (total: number) => void;
  setHighlights: (highlights: Highlight[]) => void;
  addHighlightLocal: (highlight: Highlight) => void;
  removeHighlightLocal: (id: string) => void;
}

export const useReaderStore = create<ReaderState>((set) => ({
  theme: "DEFAULT",
  currentPage: 1,
  totalPages: 0,
  highlights: [],
  setTheme: (theme) => set({ theme }),
  setCurrentPage: (currentPage) => set({ currentPage }),
  setTotalPages: (totalPages) => set({ totalPages }),
  setHighlights: (highlights) => set({ highlights }),
  addHighlightLocal: (highlight) => set((s) => ({ highlights: [...s.highlights, highlight] })),
  removeHighlightLocal: (id) => set((s) => ({ highlights: s.highlights.filter((h) => h.id !== id) })),
}));

export const themeClassMap: Record<ReaderThemeName, string> = {
  DEFAULT: "theme-default",
  PAPER: "theme-paper",
  NIGHT: "theme-night",
};
