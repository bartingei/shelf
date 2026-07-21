"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Check, Loader2, Sparkles } from "lucide-react";
import { TopNav } from "@/components/ui/top-nav";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { PRICING } from "@/lib/constants";

type PlanKey = keyof typeof PRICING;

interface UpgradeClientProps {
  freeLimit: number;
  pricing: typeof PRICING;
  activeSubscription: { plan: PlanKey; currentPeriodEnd: string } | null;
}

type FlowState = "idle" | "initiating" | "pending" | "timeout";

const POLL_INTERVAL_MS = 3000;
const MAX_POLL_ATTEMPTS = 30; // ~90s

function friendlyMpesaError(resultDesc: string | null | undefined): string {
  const desc = (resultDesc ?? "").toLowerCase();
  if (desc.includes("cancel")) return "Payment was cancelled on your phone.";
  if (desc.includes("timeout") || desc.includes("timed out")) return "You didn't respond to the prompt in time.";
  if (desc.includes("insufficient")) return "Insufficient M-Pesa balance.";
  return "Payment failed. Please try again.";
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-KE", { year: "numeric", month: "long", day: "numeric" });
}

export function UpgradeClient({ freeLimit, pricing, activeSubscription }: UpgradeClientProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [selectedPlan, setSelectedPlan] = useState<PlanKey>(activeSubscription?.plan ?? "MONTHLY");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [flowState, setFlowState] = useState<FlowState>("idle");
  const [checkoutRequestId, setCheckoutRequestId] = useState<string | null>(null);

  const pollHandle = useRef<ReturnType<typeof setInterval> | null>(null);
  const attemptsRef = useRef(0);

  useEffect(() => {
    return () => {
      if (pollHandle.current) clearInterval(pollHandle.current);
    };
  }, []);

  function stopPolling() {
    if (pollHandle.current) {
      clearInterval(pollHandle.current);
      pollHandle.current = null;
    }
  }

  async function pollStatus(id: string) {
    attemptsRef.current += 1;
    try {
      const res = await fetch(`/api/payments/mpesa/status/${id}`);
      const data = await res.json();

      if (data.status === "SUCCESS") {
        stopPolling();
        setFlowState("idle");
        setCheckoutRequestId(null);
        toast(`Payment received — Shelf Pro is active until ${formatDate(data.currentPeriodEnd)}.`);
        router.refresh();
        return;
      }
      if (data.status === "FAILED") {
        stopPolling();
        setFlowState("idle");
        setCheckoutRequestId(null);
        toast(friendlyMpesaError(data.resultDesc), { variant: "error" });
        return;
      }
    } catch {
      // transient network error — keep polling until attempts run out
    }

    if (attemptsRef.current >= MAX_POLL_ATTEMPTS) {
      stopPolling();
      setFlowState("timeout");
    }
  }

  async function startPayment() {
    if (!phoneNumber.trim()) {
      toast("Enter your M-Pesa phone number", { variant: "error" });
      return;
    }

    setFlowState("initiating");
    try {
      const res = await fetch("/api/payments/mpesa/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: selectedPlan, phoneNumber }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast(data.error || "Could not start the payment.", { variant: "error" });
        setFlowState("idle");
        return;
      }

      setCheckoutRequestId(data.checkoutRequestId);
      setFlowState("pending");
      attemptsRef.current = 0;
      pollHandle.current = setInterval(() => pollStatus(data.checkoutRequestId), POLL_INTERVAL_MS);
    } catch {
      toast("Could not reach the payment service. Please try again.", { variant: "error" });
      setFlowState("idle");
    }
  }

  function checkAgain() {
    if (!checkoutRequestId) return;
    setFlowState("pending");
    attemptsRef.current = 0;
    pollHandle.current = setInterval(() => pollStatus(checkoutRequestId), POLL_INTERVAL_MS);
  }

  const busy = flowState === "initiating" || flowState === "pending";

  return (
    <div className="min-h-screen bg-background">
      <TopNav />

      <div className="mx-auto max-w-3xl px-6 pb-24 pt-32 text-center">
        <span className="eyebrow">Plans</span>
        <h1 className="mt-4 font-display text-5xl font-semibold tracking-tight">
          More room for your <span className="italic text-gold">library</span>.
        </h1>
        <p className="mx-auto mt-4 max-w-md text-muted">
          {activeSubscription
            ? `You're on Shelf Pro (${pricing[activeSubscription.plan].label}) until ${formatDate(activeSubscription.currentPeriodEnd)}. Pay again any time to extend it.`
            : "Pay with M-Pesa to unlock unlimited books."}
        </p>

        <div className="mt-14 grid grid-cols-1 gap-6 text-left sm:grid-cols-2">
          {/* Free */}
          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="font-display text-xl font-semibold">Free</h2>
            <p className="mt-1 text-sm text-muted">What you're on today.</p>
            <p className="mt-6 font-display text-3xl font-semibold">KES 0</p>
            <ul className="mt-6 space-y-3 text-sm text-foreground/80">
              <li className="flex items-center gap-2"><Check size={15} className="text-gold" /> Up to {freeLimit} books</li>
              <li className="flex items-center gap-2"><Check size={15} className="text-gold" /> Full reader with highlights, notes, bookmarks</li>
              <li className="flex items-center gap-2"><Check size={15} className="text-gold" /> AI genre classification</li>
            </ul>
          </div>

          {/* Pro */}
          <div className="rounded-2xl border border-gold/40 bg-gold/5 p-6">
            <h2 className="flex items-center gap-2 font-display text-xl font-semibold text-gold">
              <Sparkles size={16} /> Pro
            </h2>
            <p className="mt-1 text-sm text-muted">For growing collections.</p>

            {/* Monthly / Yearly toggle */}
            <div className="mt-6 flex gap-2">
              {(Object.keys(pricing) as PlanKey[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  disabled={busy}
                  onClick={() => setSelectedPlan(key)}
                  className={cn(
                    "flex-1 rounded-lg border px-3 py-2 text-left text-xs font-medium transition-colors disabled:opacity-60",
                    selectedPlan === key
                      ? "border-gold bg-gold/10 text-gold"
                      : "border-border text-muted hover:text-foreground"
                  )}
                >
                  <span className="block font-display text-base font-semibold text-foreground">
                    KES {pricing[key].amount.toLocaleString()}
                  </span>
                  {pricing[key].label}
                </button>
              ))}
            </div>

            <ul className="mt-6 space-y-3 text-sm text-foreground/80">
              <li className="flex items-center gap-2"><Check size={15} className="text-gold" /> Unlimited books</li>
              <li className="flex items-center gap-2"><Check size={15} className="text-gold" /> Everything in Free</li>
              <li className="flex items-center gap-2"><Check size={15} className="text-gold" /> Priority AI processing</li>
            </ul>

            {flowState === "pending" ? (
              <div className="mt-6 flex flex-col items-center gap-2 rounded-lg border border-gold/40 bg-gold/10 py-4 text-center">
                <Loader2 size={18} className="animate-spin text-gold" />
                <p className="text-sm font-medium text-foreground">Check your phone</p>
                <p className="px-4 text-xs text-muted">Enter your M-Pesa PIN on the STK prompt to complete payment.</p>
              </div>
            ) : flowState === "timeout" ? (
              <div className="mt-6 rounded-lg border border-border bg-background py-4 text-center">
                <p className="text-sm text-muted">We didn't hear back. If you completed the prompt, check back shortly.</p>
                <button
                  onClick={checkAgain}
                  className="mt-3 rounded-full border border-gold/40 px-4 py-1.5 text-xs font-semibold text-gold hover:bg-gold/10"
                >
                  Check again
                </button>
              </div>
            ) : (
              <>
                <input
                  type="tel"
                  inputMode="tel"
                  placeholder="07XXXXXXXX"
                  value={phoneNumber}
                  disabled={busy}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="mt-6 w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none transition-colors focus:border-gold disabled:opacity-60"
                />
                <button
                  onClick={startPayment}
                  disabled={busy}
                  className="mt-3 w-full rounded-lg bg-gold py-3 text-sm font-semibold text-black transition-transform hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {flowState === "initiating" ? "Starting..." : `Pay KES ${pricing[selectedPlan].amount.toLocaleString()} with M-Pesa`}
                </button>
              </>
            )}
          </div>
        </div>

        <p className="mt-10 text-sm text-muted">
          <Link href="/library" className="text-gold hover:underline">Back to your library</Link>
        </p>
      </div>
    </div>
  );
}
