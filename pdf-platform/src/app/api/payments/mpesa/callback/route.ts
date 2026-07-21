import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { applyStkResult } from "@/lib/payments";

// Public webhook — Safaricom POSTs here directly with no session/auth
// context, so there's nothing to check via auth.api.getSession(). Must
// always ACK with 200 { ResultCode: 0 }, even when something on our side
// goes wrong, or Safaricom will treat the callback as undelivered and retry.
function ack() {
  return NextResponse.json({ ResultCode: 0, ResultDesc: "Success" });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const cb = body?.Body?.stkCallback;

    if (!cb?.CheckoutRequestID || typeof cb.ResultCode === "undefined") {
      console.error("[mpesa callback] unexpected payload shape", JSON.stringify(body));
      return ack();
    }

    const payment = await prisma.payment.findUnique({ where: { checkoutRequestId: cb.CheckoutRequestID } });
    if (!payment) {
      console.error("[mpesa callback] no payment found for checkoutRequestId", cb.CheckoutRequestID);
      return ack();
    }

    // Idempotency: a replayed/duplicate callback for an already-resolved
    // payment (or one already reconciled via the status-poll fallback) is a
    // no-op — Subscription/User/Notification must not be touched twice.
    if (payment.status !== "PENDING") {
      return ack();
    }

    await applyStkResult(payment, {
      ResultCode: cb.ResultCode,
      ResultDesc: cb.ResultDesc ?? "",
      CallbackMetadata: cb.CallbackMetadata,
    });
  } catch (err) {
    console.error("[mpesa callback] processing error", err);
  }
  return ack();
}
