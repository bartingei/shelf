import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { queryStkPush } from "@/lib/daraja";
import { applyStkResult } from "@/lib/payments";

const RECONCILE_AFTER_MS = 10_000;
const RECONCILE_THROTTLE_MS = 10_000;

export async function GET(req: NextRequest, { params }: { params: Promise<{ checkoutRequestId: string }> }) {
  const { checkoutRequestId } = await params;
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let payment = await prisma.payment.findFirst({
    where: { checkoutRequestId, userId: session.user.id },
    include: { subscription: true },
  });
  if (!payment) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const now = Date.now();
  const stale = now - payment.createdAt.getTime() > RECONCILE_AFTER_MS;
  const notRecentlyQueried = !payment.lastQueriedAt || now - payment.lastQueriedAt.getTime() > RECONCILE_THROTTLE_MS;

  // The callback can be delayed or lost — if we're still PENDING and it's
  // been a little while, pull the result directly from Daraja instead of
  // waiting indefinitely. Throttled so rapid client polling doesn't hammer
  // Safaricom's query endpoint.
  if (payment.status === "PENDING" && stale && notRecentlyQueried) {
    await prisma.payment.update({ where: { id: payment.id }, data: { lastQueriedAt: new Date() } });
    try {
      const result = await queryStkPush(checkoutRequestId);
      if (result.resultCode !== null) {
        await applyStkResult(payment, { ResultCode: result.resultCode, ResultDesc: result.resultDesc });
        payment = await prisma.payment.findFirst({
          where: { checkoutRequestId, userId: session.user.id },
          include: { subscription: true },
        });
      }
    } catch (err) {
      console.error("[mpesa status] reconciliation query failed", err);
    }
  }

  if (!payment) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    status: payment.status,
    resultDesc: payment.resultDesc,
    mpesaReceiptNumber: payment.mpesaReceiptNumber,
    currentPeriodEnd: payment.subscription?.currentPeriodEnd ?? null,
  });
}
