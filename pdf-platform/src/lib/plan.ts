import type { Subscription } from "@prisma/client";
import { prisma } from "./prisma";
import { FREE_PLAN_BOOK_LIMIT } from "./constants";

export function isSubscriptionActive(
  subscription: Pick<Subscription, "status" | "currentPeriodEnd"> | null
): boolean {
  if (!subscription) return false;
  return subscription.status === "ACTIVE" && subscription.currentPeriodEnd.getTime() > Date.now();
}

// Single source of truth for "is this user effectively Pro right now". Always
// re-derives from Subscription.currentPeriodEnd rather than trusting the
// cached User.plan column, so access control never depends on the cron sweep
// (/api/cron/subscriptions) having run yet.
export async function getEffectivePlan(
  userId: string
): Promise<{ plan: "FREE" | "PRO"; subscription: Subscription | null }> {
  const subscription = await prisma.subscription.findUnique({ where: { userId } });
  return { plan: isSubscriptionActive(subscription) ? "PRO" : "FREE", subscription };
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
