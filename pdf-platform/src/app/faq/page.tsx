import type { Metadata } from "next";
import Link from "next/link";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "Answers to common questions about Shelf — pricing, supported files, privacy, syncing across devices, and how the reader works.",
  alternates: {
    canonical: "/faq",
  },
};

const FAQS = [
  {
    question: "What is Shelf?",
    answer:
      "Shelf is a home for your PDF collection. Upload your books, let AI sort them into genres, and read them in a distraction-free viewer with highlights, notes, bookmarks, and reading progress that syncs to your account.",
  },
  {
    question: "Is Shelf free?",
    answer:
      "Yes. The Free plan includes up to 10 books, the full reader with highlights, notes, and bookmarks, and AI genre classification — no card required. A Pro plan for unlimited books is in the works.",
  },
  {
    question: "What file types can I upload?",
    answer:
      "PDF only, up to 100MB per file. That covers everything from novels and scanned textbooks to reports.",
  },
  {
    question: "Do I need to create an account?",
    answer:
      "Yes — an account is what keeps your library, highlights, notes, and reading progress attached to you and synced across devices. Sign up with email and password (a verification email is sent before you can sign in) or continue with Google.",
  },
  {
    question: "Will my reading progress sync across devices?",
    answer:
      "Yes. Your current page, highlights, notes, and bookmarks are all tied to your account, so opening a book on your phone picks up exactly where your desktop left off.",
  },
  {
    question: "Can I use Shelf on my phone?",
    answer:
      "Yes, the library and reader are both built to work on mobile as well as desktop.",
  },
  {
    question: "Is my library private?",
    answer:
      "Yes. Every book, highlight, note, and bookmark is scoped to your account — other users can't see or access your library.",
  },
  {
    question: "What can I do with highlights and notes?",
    answer:
      "Turn on the highlighter, pick from several colors, and select text on the page to highlight it instantly. You can also leave page-anchored notes and bookmarks, all listed in the reader's sidebar for quick jumping.",
  },
  {
    question: "How does the AI genre classification work?",
    answer:
      "When you upload a PDF, Shelf automatically classifies it into a genre (Fiction, Business, Science, Biography, and more) so your library stays organized without manual tagging.",
  },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQS.map((f) => ({
    "@type": "Question",
    name: f.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: f.answer,
    },
  })),
};

export default function FaqPage() {
  return (
    <div className="min-h-screen bg-background">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <header className="border-b border-border">
        <div className="mx-auto flex h-[70px] max-w-[1240px] items-center justify-between px-6">
          <Link href="/" className="font-display text-2xl italic tracking-tight">
            {SITE_NAME}
            <span className="text-gold">.</span>
          </Link>
          <Link href="/signup" className="rounded-full bg-foreground px-5 py-2 text-sm font-semibold text-background transition-transform hover:scale-[1.03]">
            Get Started
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-20">
        <span className="eyebrow">Questions</span>
        <h1 className="mt-4 font-display text-5xl font-semibold leading-[1.05] tracking-tight">
          Frequently asked <span className="italic text-gold">questions</span>.
        </h1>
        <p className="mt-6 text-lg leading-relaxed text-muted">
          Everything you need to know before you upload your first book.
        </p>

        <div className="mt-14 divide-y divide-border border-t border-border">
          {FAQS.map((f) => (
            <details key={f.question} className="group py-6">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-display text-lg font-semibold">
                {f.question}
                <span className="shrink-0 text-xl text-muted transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-muted">{f.answer}</p>
            </details>
          ))}
        </div>

        <div className="mt-16 rounded-2xl border border-border bg-card p-8 text-center">
          <p className="font-display text-xl font-semibold">Still have a question?</p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
            Create your free account and see the rest for yourself — your first 10 books are on us.
          </p>
          <Link href="/signup" className="mt-6 inline-flex rounded-lg bg-gold px-7 py-3 text-sm font-semibold text-black transition-transform hover:scale-[1.03]">
            Get started
          </Link>
        </div>
      </main>
    </div>
  );
}
