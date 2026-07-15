# Shelf

A cinematic home for your PDFs. Upload your collection, let AI sort it into genres, and read
in a distraction-free viewer with highlights, notes, bookmarks, and reading progress synced
to your account.

## Features

- **Auth** — email/password and Google sign-in (Better Auth), with a landing page for
  anonymous visitors and a personal dashboard/library once signed in.
- **Upload & library** — drag-and-drop PDF upload with automatic cover thumbnail and metadata
  extraction, organized into a searchable library grid.
- **AI genre classification** — each upload is automatically sorted into a genre (Fiction,
  Business, Science, Biography, etc.), with dynamic filter chips in the library.
- **Reader** — a custom PDF.js-based reader with paper/night/default themes, font
  preferences, highlights, marginalia notes, passage-anchored bookmarks, and reading
  progress that resumes where you left off.
- **AI tools** — "Explain this passage" and "Summarize" powered by OpenAI, tuned differently
  for novels vs. educational texts.

## Tech stack

- [Next.js 15](https://nextjs.org/) (App Router) + React 18 + TypeScript
- [Prisma](https://www.prisma.io/) + PostgreSQL ([Neon](https://neon.tech/) recommended)
- [Better Auth](https://www.better-auth.com/) for authentication
- [Supabase Storage](https://supabase.com/storage) for PDF files and cover images
- [pdf.js](https://mozilla.github.io/pdf.js/) for in-browser PDF rendering
- [OpenAI](https://platform.openai.com/) for genre classification and reader AI tools
- Tailwind CSS + Framer Motion + Zustand

## Prerequisites

- Node.js 18+
- A PostgreSQL database (the app is built against [Neon](https://neon.tech/); any Postgres
  works, but you'll need both a pooled and a direct connection string)
- A [Supabase](https://supabase.com/) project (used only for file storage, not the database)
- A Google OAuth client (optional, only needed for "Continue with Google")
- An OpenAI API key (optional, only needed for genre classification and the reader's AI
  Explain/Summarize tools — the rest of the app works without it)

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Configure environment variables**

   ```bash
   cp .env.example .env
   ```

   Fill in `.env`:

   | Variable | Where to get it |
   |---|---|
   | `DATABASE_URL` / `DIRECT_URL` | Your Postgres connection strings (Neon gives you both a pooled and direct URL) |
   | `BETTER_AUTH_SECRET` | Any random string, e.g. `openssl rand -base64 32` |
   | `BETTER_AUTH_URL` / `NEXT_PUBLIC_BETTER_AUTH_URL` | `http://localhost:3000` for local dev |
   | `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | [Google Cloud Console](https://console.cloud.google.com/apis/credentials) — only needed for Google sign-in |
   | `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase project's API settings |
   | `OPENAI_API_KEY` | [OpenAI platform](https://platform.openai.com/api-keys) — only needed for genre classification and AI reader tools |

3. **Set up Supabase Storage**

   Create two storage buckets in your Supabase project:
   - `books` — private (PDF files are served through a signed-URL API route, not directly)
   - `covers` — public (cover thumbnails are read directly by the browser)

4. **Run database migrations**

   ```bash
   npx prisma migrate dev
   ```

5. **Start the dev server**

   ```bash
   npm run dev
   ```

   Visit [http://localhost:3000](http://localhost:3000).

## Available scripts

```bash
npm run dev          # start the dev server
npm run build         # production build
npm run start          # run a production build
npm run lint           # lint
npm run db:generate    # regenerate the Prisma client after schema changes
npm run db:migrate     # create + apply a new migration
npm run db:studio      # open Prisma Studio (browse the database)
```

## Project structure

```
src/
  app/
    (auth)/           # login, signup — shared cross-fade transition layout
    (dashboard)/       # signed-in home
    library/            # book grid, genre filters, upload
    reader/[bookId]/    # the PDF reader
    api/                # REST routes: books, bookmarks, notes, highlights,
                         # progress, upload, AI explain/summarize, auth
  components/
    ui/                  # shared components (top nav, etc.)
    features/            # feature-scoped components (reader, library, dashboard, marketing)
  lib/                   # prisma client, auth config, supabase client, genre classifier, utils
  types/                 # shared TypeScript types
  styles/                # globals.css — reader theme definitions live here
prisma/
  schema.prisma          # full data model
  migrations/
docs/
  mvp-spec.md            # original feature spec + schema rationale
```

## Notes

- Genre classification and the AI Explain/Summarize tools call OpenAI on your behalf — if
  `OPENAI_API_KEY` is unset or the account is out of quota, uploads and reading still work
  fine, books just stay "Uncategorized" and the AI panels will show an error.
- The PDF.js worker file (`public/pdf.worker.min.mjs`) is checked into `public/` and served
  statically — no separate setup needed.
