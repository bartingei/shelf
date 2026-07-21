import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { classifyGenre } from "@/lib/genre-classifier";
import { FREE_PLAN_BOOK_LIMIT } from "@/lib/constants";
import { getEffectivePlan, getLockedBookIdsForPlan } from "@/lib/plan";

// GET /api/books?sort=recent|lastRead&favorite=true&limit=10
export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const sort = searchParams.get("sort"); // "recent" | "lastRead"
  const favorite = searchParams.get("favorite") === "true";
  const limit = parseInt(searchParams.get("limit") || "50");

  const { plan } = await getEffectivePlan(session.user.id);

  const [books, totalCount, lockedIds] = await Promise.all([
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
    // Ranked against the user's full book set, independent of the
    // sort/favorite/limit filters above — a filtered query must not skew
    // which books look locked.
    getLockedBookIdsForPlan(session.user.id, plan),
  ]);

  return NextResponse.json({
    books: books.map((book) => ({ ...book, locked: lockedIds.has(book.id) })),
    totalCount,
    plan,
    bookLimit: plan === "PRO" ? null : FREE_PLAN_BOOK_LIMIT,
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

  const { plan } = await getEffectivePlan(session.user.id);
  if (plan !== "PRO") {
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

