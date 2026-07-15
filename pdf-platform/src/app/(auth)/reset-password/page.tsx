"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) {
      setError("This reset link is invalid or has expired.");
      return;
    }
    setError(null);
    setLoading(true);

    const { error: resetError } = await authClient.resetPassword({ newPassword: password, token });

    setLoading(false);
    if (resetError) {
      setError(resetError.message || "Could not reset your password. The link may have expired.");
      return;
    }
    setDone(true);
    setTimeout(() => router.push("/login"), 1800);
  }

  if (!token) {
    return (
      <>
        <h1 className="mt-10 font-display text-4xl font-semibold tracking-tight">Invalid link</h1>
        <p className="mt-2 text-sm text-muted">
          This password reset link is invalid or has expired.{" "}
          <Link href="/forgot-password" className="text-gold hover:underline">Request a new one</Link>.
        </p>
      </>
    );
  }

  if (done) {
    return (
      <>
        <h1 className="mt-10 font-display text-4xl font-semibold tracking-tight">Password updated</h1>
        <p className="mt-2 text-sm text-muted">Taking you to sign in...</p>
      </>
    );
  }

  return (
    <>
      <h1 className="mt-10 font-display text-4xl font-semibold tracking-tight">Choose a new password</h1>
      <p className="mt-2 text-sm text-muted">Make it something you'll remember.</p>

      {error && <p className="mt-6 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400">{error}</p>}

      <form onSubmit={handleSubmit} className="mt-8 space-y-3">
        <input
          type="password" required minLength={8} placeholder="New password (min. 8 characters)" value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border border-border bg-card px-4 py-3 text-sm outline-none transition-colors focus:border-gold"
        />
        <button
          type="submit" disabled={loading}
          className="w-full rounded-lg bg-gold py-3 text-sm font-semibold text-black transition-transform hover:scale-[1.02] disabled:opacity-50"
        >
          {loading ? "Updating..." : "Update password"}
        </button>
      </form>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 py-12">
      <div className="mx-auto w-full max-w-sm">
        <Link href="/" className="font-display text-2xl italic tracking-tight">
          Shelf<span className="text-gold">.</span>
        </Link>

        <Suspense fallback={null}>
          <ResetPasswordForm />
        </Suspense>

        <p className="mt-8 text-center text-sm text-muted">
          <Link href="/login" className="text-gold hover:underline">Back to sign in</Link>
        </p>
      </div>
    </main>
  );
}
