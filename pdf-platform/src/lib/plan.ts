import { prisma } from "./prisma";
import { FREE_PLAN_BOOK_LIMIT } from "./constants";

// Payments/subscriptions (Shelf Pro) is deferred to a later version — this
// always resolves FREE rather than touching the Subscription table, which
// is the shape everything downstream (book limits, locking) already expects.
export async function getEffectivePlan(
  userId: string
): Promise<{ plan: "FREE" | "PRO"; subscription: null }> {
  void userId;
  return { plan: "FREE", subscription: null };
}

// Ranks the user's full book set by createdAt ascending and locks everything
// past the free limit. Deliberately not a stored flag: re-running this after
// a deletion naturally "re-unlocks" the next-oldest book purely because its
// rank shifted, with nothing to keep in sync.
async function lockedIdsForPlan(userId: string, plan: "FREE" | "PRO"): Promise<Set<string>> {
  if (plan === "PRO") return new Set();
  const overflow = await prisma.book.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
    select: { id: true },
    skip: FREE_PLAN_BOOK_LIMIT,
  });
  return new Set(overflow.map((b) => b.id));
}

// For callers that already computed the plan (e.g. GET /api/books, which
// needs it for other response fields too) — avoids a duplicate query.
export async function getLockedBookIdsForPlan(userId: string, plan: "FREE" | "PRO"): Promise<Set<string>> {
  return lockedIdsForPlan(userId, plan);
}

// For single-book call sites (file route, reader page) that don't already
// have the plan on hand.
export async function getLockedBookIds(userId: string): Promise<Set<string>> {
  const { plan } = await getEffectivePlan(userId);
  return lockedIdsForPlan(userId, plan);
}

export async function isBookLocked(userId: string, bookId: string): Promise<boolean> {
  return (await getLockedBookIds(userId)).has(bookId);
}
