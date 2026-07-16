import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { classifyGenre } from "@/lib/genre-classifier";
import { FREE_PLAN_BOOK_LIMIT } from "@/lib/constants";

// GET /api/books?sort=recent|lastRead&favorite=true&limit=10
export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const sort = searchParams.get("sort"); // "recent" | "lastRead"
  const favorite = searchParams.get("favorite") === "true";
  const limit = parseInt(searchParams.get("limit") || "50");

  const [books, totalCount, user] = await Promise.all([
    prisma.book.findMany({
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
    }),
    prisma.book.count({ where: { userId: session.user.id } }),
    prisma.user.findUnique({ where: { id: session.user.id }, select: { plan: true } }),
  ]);

  return NextResponse.json({
    books,
    totalCount,
    plan: user?.plan ?? "FREE",
    bookLimit: user?.plan === "PRO" ? null : FREE_PLAN_BOOK_LIMIT,
  });
}

// POST /api/books — create a book record after file is uploaded to Supabase Storage
export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { title, author, fileUrl, pageCount, coverUrl, textSample } = body;

  if (!title || !fileUrl) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { plan: true } });
  if (user?.plan !== "PRO") {
    const bookCount = await prisma.book.count({ where: { userId: session.user.id } });
    if (bookCount >= FREE_PLAN_BOOK_LIMIT) {
      return NextResponse.json(
        { error: `You've reached the ${FREE_PLAN_BOOK_LIMIT}-book limit on the Free plan. Upgrade to add more.`, code: "PLAN_LIMIT_REACHED" },
        { status: 403 }
      );
    }
  }

  const genre = await classifyGenre(`${title}\n${textSample ?? ""}`);

  const book = await prisma.book.create({
    data: {
      userId: session.user.id,
      title,
      author,
      fileUrl,
      pageCount,
      coverUrl,
      genre,
    },
  });

  return NextResponse.json({ book }, { status: 201 });
}

