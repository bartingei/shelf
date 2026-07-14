import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ bookId: string }> }) {
  const { bookId } = await params;
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const bookmarks = await prisma.bookmark.findMany({
    where: { bookId, userId: session.user.id },
    orderBy: { page: "asc" },
  });

  return NextResponse.json({ bookmarks });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ bookId: string }> }) {
  const { bookId } = await params;
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { page, label } = await req.json();

  // Toggle — if bookmark exists on this page, remove it
  const existing = await prisma.bookmark.findFirst({
    where: { bookId, userId: session.user.id, page },
  });

  if (existing) {
    await prisma.bookmark.delete({ where: { id: existing.id } });
    return NextResponse.json({ deleted: true });
  }

  const bookmark = await prisma.bookmark.create({
    data: { userId: session.user.id, bookId, page, label },
  });

  return NextResponse.json({ bookmark });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ bookId: string }> }) {
  const { bookId } = await params;
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json();
  await prisma.bookmark.deleteMany({
    where: { id, userId: session.user.id },
  });

  return NextResponse.json({ deleted: true });
}