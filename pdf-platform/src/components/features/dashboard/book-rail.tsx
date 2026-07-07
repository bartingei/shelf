import type { Book } from "@/types";
import { BookCard } from "@/components/features/library/book-card";

interface BookRailProps {
  title: string;
  books?: Book[];
  emptyHint?: string;
}

export function BookRail({ title, books = [], emptyHint }: BookRailProps) {
  return (
    <section className="mb-10">
      <h2 className="mb-3 text-lg font-medium">{title}</h2>
      {books.length === 0 ? (
        <p className="text-sm text-muted">{emptyHint}</p>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-2">
          {books.map((book) => (
            <div key={book.id} className="w-32 shrink-0">
              <BookCard book={book} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
