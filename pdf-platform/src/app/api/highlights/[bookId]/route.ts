import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ bookId: string }> }) {
  const { bookId } = await params;
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const highlights = await prisma.highlight.findMany({
    where: { bookId, userId: session.user.id },
    orderBy: { page: "asc" },
  });

  return NextResponse.json({ highlights });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ bookId: string }> }) {
  const { bookId } = await params;
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { page, textContent, colorTag, rects } = await req.json();
  if (!textContent?.trim()) return NextResponse.json({ error: "Empty highlight" }, { status: 400 });

  const highlight = await prisma.highlight.create({
    data: {
      userId: session.user.id,
      bookId,
      page,
      textContent,
      colorTag: colorTag ?? "yellow",
      rects: rects ?? undefined,
    },
  });

  return NextResponse.json({ highlight });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ bookId: string }> }) {
  const { bookId } = await params;
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json();
  await prisma.highlight.deleteMany({ where: { id, userId: session.user.id } });

  return NextResponse.json({ deleted: true });
}