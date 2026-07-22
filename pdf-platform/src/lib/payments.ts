import type { Payment } from "@prisma/client";
import { prisma } from "./prisma";
import { PRICING } from "./constants";
import { isSubscriptionActive } from "./plan";

interface StkResult {
  ResultCode: number;
  ResultDesc: string;
  CallbackMetadata?: { Item: { Name: string; Value?: string | number }[] };
}

// Shared by the callback webhook and the status-poll reconciliation fallback
// so the two code paths (Safaricom's push vs. our own pull) can never
// diverge in how a result gets applied. Assumes the caller has already
// confirmed `payment.status === "PENDING"` (idempotency check).
export async function applyStkResult(payment: Payment, cb: StkResult): Promise<void> {
  const success = cb.ResultCode === 0;

  if (!success) {
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: "FAILED",
        resultCode: cb.ResultCode,
        resultDesc: cb.ResultDesc,
        rawCallback: cb as object,
      },
    });
    return;
  }

  const meta = Object.fromEntries((cb.CallbackMetadata?.Item ?? []).map((i) => [i.Name, i.Value]));
  const now = new Date();
  const { durationDays } = PRICING[payment.plan];

  await prisma.$transaction(async (tx) => {
    const existing = await tx.subscription.findUnique({ where: { userId: payment.userId } });
    // Stack on top of the remaining active period instead of resetting from
    // now, so paying again before expiry extends access rather than voiding
    // time the user already paid for.
    const base = existing && isSubscriptionActive(existing) ? existing.currentPeriodEnd : now;
    const currentPeriodEnd = new Date(base.getTime() + durationDays * 24 * 60 * 60 * 1000);

    const subscription = await tx.subscription.upsert({
      where: { userId: payment.userId },
      create: {
        userId: payment.userId,
        plan: payment.plan,
        status: "ACTIVE",
        currentPeriodStart: now,
        currentPeriodEnd,
      },
      update: {
        plan: payment.plan,
        status: "ACTIVE",
        currentPeriodEnd,
        // Reset so the cron reminder can fire again ahead of the new expiry.
        expiringSoonNotifiedAt: null,
        ...(existing && !isSubscriptionActive(existing) ? { currentPeriodStart: now } : {}),
      },
    });

    await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: "SUCCESS",
        subscriptionId: subscription.id,
        mpesaReceiptNumber: typeof meta.MpesaReceiptNumber === "string" ? meta.MpesaReceiptNumber : null,
        resultCode: cb.ResultCode,
        resultDesc: cb.ResultDesc,
        rawCallback: cb as object,
      },
    });

    await tx.user.update({ where: { id: payment.userId }, data: { plan: "PRO" } });

    await tx.notification.create({
      data: {
        userId: payment.userId,
        type: "PAYMENT_SUCCESS",
        title: "Payment received",
        message: `Shelf Pro (${PRICING[payment.plan].label}) is active until ${currentPeriodEnd.toLocaleDateString("en-KE", { year: "numeric", month: "long", day: "numeric" })}.`,
      },
    });
  });
}
