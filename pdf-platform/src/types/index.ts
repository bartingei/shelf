export type BookCategory = "EDUCATION" | "NOVEL" | "UNKNOWN";
export type ReaderThemeName = "DEFAULT" | "PAPER" | "NIGHT";
export type FontPreferenceName = "SANS" | "SERIF" | "DYSLEXIC";

export interface Book {
  id: string;
  title: string;
  author: string | null;
  coverUrl: string | null;
  fileUrl: string;
  pageCount: number | null;
  category: BookCategory;
  isFavorite: boolean;
  createdAt: string;
  lastOpenedAt: string | null;
}

export interface ReadingProgress {
  bookId: string;
  currentPage: number;
  percentComplete: number;
  updatedAt: string;
}

export interface Collection {
  id: string;
  name: string;
  books: Book[];
}

export interface Highlight {
  id: string;
  bookId: string;
  page: number;
  textContent: string;
  colorTag: string | null;
}

export interface Note {
  id: string;
  bookId: string;
  page: number;
  content: string;
}

export interface Bookmark {
  id: string;
  bookId: string;
  page: number;
  label: string | null;
}
