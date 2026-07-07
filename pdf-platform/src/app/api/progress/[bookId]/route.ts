import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: { bookId: string } }) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const progress = await prisma.readingProgress.findFirst({
    where: { bookId: params.bookId, userId: session.user.id },
  });

  return NextResponse.json({ progress });
}

export async function POST(req: NextRequest, { params }: { params: { bookId: string } }) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { currentPage, totalPages, scrollOffset } = await req.json();
  const percentComplete = totalPages ? Math.round((currentPage / totalPages) * 100) : 0;

  const progress = await prisma.readingProgress.upsert({
    where: { bookId: params.bookId },
    update: { currentPage, percentComplete, scrollOffset },
    create: {
      userId: session.user.id,
      bookId: params.bookId,
      currentPage,
      percentComplete,
      scrollOffset,
    },
  });

  return NextResponse.json({ progress });
}
