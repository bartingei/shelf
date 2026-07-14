import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ReaderClient } from "@/components/features/reader/reader-client";

export default async function ReaderPage({ params }: { params: Promise<{ bookId: string }> }) {
  const { bookId } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return notFound();

  const book = await prisma.book.findFirst({
    where: { id: bookId, userId: session.user.id },
    include: { progress: true },
  });

  if (!book) return notFound();

  // Update lastOpenedAt
  await prisma.book.update({
    where: { id: bookId },
    data: { lastOpenedAt: new Date() },
  });

  return (
    <ReaderClient
      bookId={book.id}
      bookTitle={book.title}
      initialPage={book.progress?.currentPage ?? 1}
    />
  );
}
