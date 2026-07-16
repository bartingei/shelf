import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const book = await prisma.book.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!book) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const formData = await req.formData();
  const file = formData.get("file") as File;
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

  const ext = file.name.split(".").pop() ?? "jpg";
  const filePath = `covers/${session.user.id}/${id}.${ext}`;

  // Delete any previous cover first
  await supabaseAdmin.storage.from("covers").remove([
    `covers/${session.user.id}/${id}.jpg`,
    `covers/${session.user.id}/${id}.png`,
    `covers/${session.user.id}/${id}.webp`,
  ]);

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const { error: uploadError } = await supabaseAdmin.storage
    .from("covers")
    .upload(filePath, buffer, {
      contentType: file.type,
      upsert: true,
    });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: { publicUrl } } = supabaseAdmin.storage
    .from("covers")
    .getPublicUrl(filePath);

  const coverUrl = `${publicUrl}?t=${Date.now()}`;

  await prisma.book.update({
    where: { id },
    data: { coverUrl },
  });

  return NextResponse.json({ coverUrl });
}