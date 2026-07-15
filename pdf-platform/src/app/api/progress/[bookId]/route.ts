import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ bookId: string }> }) {
  const { bookId } = await params;
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const progress = await prisma.readingProgress.findFirst({
    where: { bookId, userId: session.user.id },
  });

  return NextResponse.json({ progress });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ bookId: string }> }) {
  const { bookId } = await params;
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { currentPage, totalPages, scrollOffset } = await req.json();
  const percentComplete = totalPages ? Math.round((currentPage / totalPages) * 100) : 0;

  const progress = await prisma.readingProgress.upsert({
    where: { bookId },
    update: { currentPage, percentComplete, scrollOffset },
    create: {
      userId: session.user.id,
      bookId,
      currentPage,
      percentComplete,
      scrollOffset,
    },
  });

  return NextResponse.json({ progress });
}
