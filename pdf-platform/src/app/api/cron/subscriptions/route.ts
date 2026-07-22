import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SUBSCRIPTION_REMINDER_DAYS_BEFORE_EXPIRY } from "@/lib/constants";

// Daily sweep (see vercel.json). This is bookkeeping only — access control
// never depends on it having run (src/lib/plan.ts re-derives live from
// Subscription.currentPeriodEnd on every request). This route's job is (1)
// flip lapsed subscriptions to EXPIRED / User.plan back to FREE for
// data-at-rest cleanliness, and (2) create reminder notifications ahead of
// expiry.
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();

  const lapsed = await prisma.subscription.findMany({
    where: { status: "ACTIVE", currentPeriodEnd: { lte: now } },
  });
  for (const sub of lapsed) {
    await prisma.$transaction([
      prisma.subscription.update({ where: { id: sub.id }, data: { status: "EXPIRED" } }),
      prisma.user.update({ where: { id: sub.userId }, data: { plan: "FREE" } }),
      prisma.notification.create({
        data: {
          userId: sub.userId,
          type: "SUBSCRIPTION_EXPIRED",
          title: "Your Shelf Pro plan has ended",
          message: "Upgrade to Shelf Pro to unlock your full library again.",
        },
      }),
    ]);
  }

  const reminderCutoff = new Date(now.getTime() + SUBSCRIPTION_REMINDER_DAYS_BEFORE_EXPIRY * 24 * 60 * 60 * 1000);
  const expiringSoon = await prisma.subscription.findMany({
    where: {
      status: "ACTIVE",
      currentPeriodEnd: { gt: now, lte: reminderCutoff },
      expiringSoonNotifiedAt: null,
    },
  });
  for (const sub of expiringSoon) {
    await prisma.$transaction([
      prisma.subscription.update({ where: { id: sub.id }, data: { expiringSoonNotifiedAt: now } }),
      prisma.notification.create({
        data: {
          userId: sub.userId,
          type: "SUBSCRIPTION_EXPIRING_SOON",
          title: "Your Shelf Pro plan is ending soon",
          message: `Your plan ends on ${sub.currentPeriodEnd.toLocaleDateString("en-KE", { year: "numeric", month: "long", day: "numeric" })}. Renew to keep your full library unlocked.`,
        },
      }),
    ]);
  }

  return NextResponse.json({ expired: lapsed.length, reminded: expiringSoon.length });
}
