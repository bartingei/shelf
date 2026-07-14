import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ bookId: string }> }) {
  const { bookId } = await params;
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const notes = await prisma.note.findMany({
    where: { bookId, userId: session.user.id },
    orderBy: { page: "asc" },
  });

  return NextResponse.json({ notes });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ bookId: string }> }) {
  const { bookId } = await params;
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { page, content } = await req.json();
  if (!content?.trim()) return NextResponse.json({ error: "Empty note" }, { status: 400 });

  const note = await prisma.note.create({
    data: { userId: session.user.id, bookId, page, content },
  });

  return NextResponse.json({ note });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ bookId: string }> }) {
  const { bookId } = await params;
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json();
  await prisma.note.deleteMany({ where: { id, userId: session.user.id } });

  return NextResponse.json({ deleted: true });
}