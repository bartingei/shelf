import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET /api/books?sort=recent|lastRead&favorite=true&limit=10
export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const sort = searchParams.get("sort"); // "recent" | "lastRead"
  const favorite = searchParams.get("favorite") === "true";
  const limit = parseInt(searchParams.get("limit") || "50");

  const books = await prisma.book.findMany({
    where: {
      userId: session.user.id,
      ...(favorite && { isFavorite: true }),
      ...(sort === "lastRead" && { lastOpenedAt: { not: null } }),
    },
    orderBy:
      sort === "lastRead"
        ? { lastOpenedAt: "desc" }
        : { createdAt: "desc" },
    take: limit,
    include: { progress: true },
  });

  return NextResponse.json({ books });
}

// POST /api/books — create a book record after file is uploaded to Supabase Storage
export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { title, author, fileUrl, pageCount, coverUrl } = body;

  if (!title || !fileUrl) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const book = await prisma.book.create({
    data: {
      userId: session.user.id,
      title,
      author,
      fileUrl,
      pageCount,
      coverUrl,
    },
  });

  // Queue categorization job
  await prisma.processingJob.create({
    data: { bookId: book.id, type: "CATEGORIZE" },
  });

  return NextResponse.json({ book }, { status: 201 });
}

