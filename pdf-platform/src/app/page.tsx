import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-4 text-center">
      <h1 className="text-4xl font-semibold tracking-tight">Welcome back.</h1>
      <p className="max-w-md text-muted">
        Your library, your way. PDFs reimagined as a Netflix-style reading platform.
      </p>
      <div className="flex gap-3">
        <Link
          href="/library"
          className="rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white hover:opacity-90"
        >
          Continue Reading
        </Link>
        <Link
          href="/login"
          className="rounded-lg border border-border px-5 py-2.5 text-sm font-medium hover:bg-card"
        >
          Sign In
        </Link>
      </div>
    </main>
  );
}
