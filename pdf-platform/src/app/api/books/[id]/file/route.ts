import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

// Proxies the PDF file from Supabase Storage so PDF.js can load it
// without needing CORS configuration on the storage bucket.
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const book = await prisma.book.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!book) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // fileUrl is stored as the storage path (e.g. "userId/filename.pdf")
  const { data, error } = await supabaseAdmin.storage
    .from("books")
    .download(book.fileUrl);

  if (error || !data) {
    return NextResponse.json({ error: "File not found in storage" }, { status: 404 });
  }

  const buffer = await data.arrayBuffer();

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${book.title}.pdf"`,
    },
  });
}
