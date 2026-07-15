"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { signIn } from "@/lib/auth-client";
import { IMAGES } from "@/lib/images";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: signInError } = await signIn.email({ email, password });

    setLoading(false);
    if (signInError) {
      setError(signInError.message || "Could not sign in. Check your credentials.");
      return;
    }
    router.push("/library");
  }

  async function handleGoogleSignIn() {
    setError(null);
    setGoogleLoading(true);
    try {
      await signIn.social({ provider: "google", callbackURL: "/library" });
    } catch (err) {
      setError("Could not sign in with Google. Please try again.");
      setGoogleLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      {/* Image side */}
      <div className="relative hidden overflow-hidden lg:block">
        <motion.img
          src={IMAGES.shelves} alt="" aria-hidden loading="lazy" decoding="async"
          className="absolute inset-0 h-full w-full object-cover"
          initial={{ scale: 1.15, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/30 to-background/40" />
        <motion.div
          className="absolute bottom-14 left-12 right-12"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="font-display text-3xl italic leading-snug text-foreground drop-shadow-lg">
            “A room without books is like a body without a soul.”
          </p>
          <p className="mt-3 text-sm text-muted">— Marcus Tullius Cicero</p>
        </motion.div>
      </div>

      {/* Form side */}
      <div className="flex flex-col justify-center px-6 py-12 sm:px-16">
        <div className="mx-auto w-full max-w-sm">
          <Link href="/" className="font-display text-2xl italic tracking-tight">
            Shelf<span className="text-gold">.</span>
          </Link>

          <h1 className="mt-10 font-display text-4xl font-semibold tracking-tight">Welcome back</h1>
          <p className="mt-2 text-sm text-muted">Pick up right where you left off.</p>

          {error && <p className="mt-6 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400">{error}</p>}

          <form onSubmit={handleSubmit} className="mt-8 space-y-3">
            <input
              type="email" required placeholder="Email" value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-border bg-card px-4 py-3 text-sm outline-none transition-colors focus:border-gold"
            />
            <input
              type="password" required placeholder="Password" value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-border bg-card px-4 py-3 text-sm outline-none transition-colors focus:border-gold"
            />
            <p className="text-right">
              <Link href="/forgot-password" className="text-xs text-muted hover:text-gold hover:underline">
                Forgot password?
              </Link>
            </p>
            <button
              type="submit" disabled={loading || googleLoading}
              className="w-full rounded-lg bg-gold py-3 text-sm font-semibold text-black transition-transform hover:scale-[1.02] disabled:opacity-50"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted">or</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <button
            type="button" onClick={handleGoogleSignIn} disabled={loading || googleLoading}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-card py-3 text-sm font-medium transition-colors hover:border-foreground/40 disabled:opacity-50"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            {googleLoading ? "Signing in..." : "Continue with Google"}
          </button>

          <p className="mt-8 text-center text-sm text-muted">
            No account?{" "}
            <Link href="/signup" className="text-gold hover:underline">Create one</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
