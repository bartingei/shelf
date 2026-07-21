import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { initiateStkPush, normalizePhoneNumber } from "@/lib/daraja";
import { PRICING, type SubscriptionPlanKey } from "@/lib/constants";
import { SITE_URL } from "@/lib/site";

const DEDUPE_WINDOW_MS = 2 * 60 * 1000;

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const plan = body?.plan as SubscriptionPlanKey | undefined;
  const phoneNumberInput = body?.phoneNumber as string | undefined;

  if (!plan || !(plan in PRICING)) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }
  if (!phoneNumberInput) {
    return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
  }

  const phoneNumber = normalizePhoneNumber(phoneNumberInput);
  if (!phoneNumber) {
    return NextResponse.json(
      { error: "Enter a valid Safaricom M-Pesa number", code: "INVALID_PHONE" },
      { status: 400 }
    );
  }

  // Avoid firing a second STK prompt at the same phone if the user
  // double-taps "Pay" while one is already in flight.
  const recentPending = await prisma.payment.findFirst({
    where: {
      userId: session.user.id,
      status: "PENDING",
      checkoutRequestId: { not: null },
      createdAt: { gt: new Date(Date.now() - DEDUPE_WINDOW_MS) },
    },
    orderBy: { createdAt: "desc" },
  });
  if (recentPending?.checkoutRequestId) {
    return NextResponse.json({ checkoutRequestId: recentPending.checkoutRequestId, paymentId: recentPending.id });
  }

  const { amount } = PRICING[plan];

  const payment = await prisma.payment.create({
    data: { userId: session.user.id, plan, amount, phoneNumber, status: "PENDING" },
  });

  try {
    const result = await initiateStkPush({
      phoneNumber,
      amount,
      accountReference: "ShelfPro",
      transactionDesc: `Shelf ${plan}`,
      callbackUrl: `${SITE_URL}/api/payments/mpesa/callback`,
    });

    await prisma.payment.update({
      where: { id: payment.id },
      data: { checkoutRequestId: result.checkoutRequestId, merchantRequestId: result.merchantRequestId },
    });

    return NextResponse.json({ checkoutRequestId: result.checkoutRequestId, paymentId: payment.id });
  } catch (err) {
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: "FAILED", resultDesc: err instanceof Error ? err.message : "Unknown error" },
    });
    return NextResponse.json(
      { error: "Could not start the M-Pesa payment. Please try again." },
      { status: 502 }
    );
  }
}
