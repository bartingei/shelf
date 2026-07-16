import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { isFavorite } = body;

  const book = await prisma.book.updateMany({
    where: { id, userId: session.user.id },
    data: { ...(isFavorite !== undefined && { isFavorite }) },
  });

  return NextResponse.json({ book });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const book = await prisma.book.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!book) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Delete file from Supabase Storage
  await supabaseAdmin.storage.from("books").remove([book.fileUrl]);

  // Delete cover if exists
  if (book.coverUrl) {
    const coverPath = book.coverUrl.split("/covers/")[1]?.split("?")[0];
    if (coverPath) {
      await supabaseAdmin.storage.from("covers").remove([`covers/${coverPath}`]);
    }
  }

  // Delete book — cascades to progress, bookmarks, notes, highlights
  await prisma.book.delete({ where: { id } });

  return NextResponse.json({ deleted: true });
}