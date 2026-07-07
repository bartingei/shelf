import { create } from "zustand";
import type { ReaderThemeName, FontPreferenceName } from "@/types";

interface ReaderState {
  theme: ReaderThemeName;
  fontPreference: FontPreferenceName;
  currentPage: number;
  totalPages: number;
  setTheme: (theme: ReaderThemeName) => void;
  setFontPreference: (font: FontPreferenceName) => void;
  setCurrentPage: (page: number) => void;
  setTotalPages: (total: number) => void;
}

export const useReaderStore = create<ReaderState>((set) => ({
  theme: "DEFAULT",
  fontPreference: "SANS",
  currentPage: 1,
  totalPages: 0,
  setTheme: (theme) => set({ theme }),
  setFontPreference: (fontPreference) => set({ fontPreference }),
  setCurrentPage: (currentPage) => set({ currentPage }),
  setTotalPages: (totalPages) => set({ totalPages }),
}));

export const themeClassMap: Record<ReaderThemeName, string> = {
  DEFAULT: "theme-default",
  PAPER: "theme-paper",
  NIGHT: "theme-night",
};

export const fontClassMap: Record<FontPreferenceName, string> = {
  SANS: "font-pref-sans",
  SERIF: "font-pref-serif",
  DYSLEXIC: "font-pref-dyslexic",
};
