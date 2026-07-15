"use client";

import { useState } from "react";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: requestError } = await authClient.requestPasswordReset({
      email,
      redirectTo: "/reset-password",
    });

    setLoading(false);
    if (requestError) {
      setError(requestError.message || "Something went wrong. Please try again.");
      return;
    }
    setSent(true);
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 py-12">
      <div className="mx-auto w-full max-w-sm">
        <Link href="/" className="font-display text-2xl italic tracking-tight">
          Shelf<span className="text-gold">.</span>
        </Link>

        {sent ? (
          <>
            <h1 className="mt-10 font-display text-4xl font-semibold tracking-tight">Check your email</h1>
            <p className="mt-2 text-sm text-muted">
              If an account exists for <span className="text-foreground">{email}</span>, we've sent a link to reset your password.
            </p>
          </>
        ) : (
          <>
            <h1 className="mt-10 font-display text-4xl font-semibold tracking-tight">Reset your password</h1>
            <p className="mt-2 text-sm text-muted">
              Enter your email and we'll send you a link to get back in.
            </p>

            {error && <p className="mt-6 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400">{error}</p>}

            <form onSubmit={handleSubmit} className="mt-8 space-y-3">
              <input
                type="email" required placeholder="Email" value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-border bg-card px-4 py-3 text-sm outline-none transition-colors focus:border-gold"
              />
              <button
                type="submit" disabled={loading}
                className="w-full rounded-lg bg-gold py-3 text-sm font-semibold text-black transition-transform hover:scale-[1.02] disabled:opacity-50"
              >
                {loading ? "Sending..." : "Send reset link"}
              </button>
            </form>
          </>
        )}

        <p className="mt-8 text-center text-sm text-muted">
          <Link href="/login" className="text-gold hover:underline">Back to sign in</Link>
        </p>
      </div>
    </main>
  );
}
