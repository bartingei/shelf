export type BookCategory = "EDUCATION" | "NOVEL" | "UNKNOWN";
export type ReaderThemeName = "DEFAULT" | "PAPER" | "NIGHT";

export type Genre =
  | "FICTION"
  | "NON_FICTION"
  | "BUSINESS"
  | "SCIENCE"
  | "BIOGRAPHY"
  | "SELF_HELP"
  | "TECHNICAL"
  | "HISTORY"
  | "PHILOSOPHY"
  | "OTHER"
  | "UNCATEGORIZED";

export const GENRE_LABELS: Record<Genre, string> = {
  FICTION: "Fiction",
  NON_FICTION: "Non-Fiction",
  BUSINESS: "Business",
  SCIENCE: "Science",
  BIOGRAPHY: "Biography",
  SELF_HELP: "Self-Help",
  TECHNICAL: "Technical",
  HISTORY: "History",
  PHILOSOPHY: "Philosophy",
  OTHER: "Other",
  UNCATEGORIZED: "Uncategorized",
};

export interface Book {
  id: string;
  title: string;
  author: string | null;
  coverUrl: string | null;
  fileUrl: string;
  pageCount: number | null;
  category: BookCategory;
  genre: Genre;
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

export interface HighlightRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Highlight {
  id: string;
  bookId: string;
  page: number;
  textContent: string;
  colorTag: string | null;
  rects: HighlightRect[] | null;
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
