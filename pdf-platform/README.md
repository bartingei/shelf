# Shelf — PDF Reading Platform (MVP Scaffold)

A Netflix-style home for your PDFs: AI auto-categorization, a custom reader with
paper/night themes, highlights/notes/bookmarks, collections, and two AI tools
(Explain, Summarize). See `docs/mvp-spec.md` for the full feature list and the
rationale behind what's in MVP vs. "Coming Soon."

## What's here

This is a structural scaffold, not a finished app — it's meant to be the
starting point you build features into one at a time.

**Functional/wired:**
- Folder structure matching the planned architecture
- Prisma schema (`prisma/schema.prisma`) — full MVP data model
- Tailwind theme tokens incl. the three reader themes (Default / Paper / Night)
- Zustand store for reader theme + font + progress state
- Auth — Better Auth wired end-to-end: sign-up, sign-in, sign-out, session-based
  middleware protecting `/library` and `/reader`, `/api/books` reading the real
  session instead of a query param
- API route shapes for books, AI explain, AI summarize
- Categorization worker logic (`src/lib/categorize-worker.ts`)

**Stubbed (structure exists, logic is a TODO):**
- PDF.js rendering in `pdf-viewer.tsx` — canvas target exists, render loop doesn't
- File upload flow to Supabase Storage
- Search (`tsvector` column declared, no migration trigger/index yet)
- Session-based reading-time estimate (currently a hardcoded constant)

## Setup

```bash
npm install
cp .env.example .env   # fill in DATABASE_URL, Supabase, OpenAI keys
npx prisma migrate dev --name init
npm run dev
```

## Suggested build order

1. ~~Wire Better Auth sign-up/sign-in + session middleware~~ ✅ done
2. File upload → Supabase Storage → `POST /api/books`
3. PDF.js render loop in `pdf-viewer.tsx` + progress sync to `ReadingProgress`
4. Categorization worker as a cron route or queue consumer
5. Bookmarks/Notes/Highlights CRUD (straightforward — schema's ready)
6. Full-text search (`tsvector` migration + search bar wiring)
7. AI Explain/Summarize — routes exist, just need the reader UI hooked up
8. Collections drag-to-reorder

## Project structure

```
src/
  app/              # Next.js App Router pages + API routes
  components/
    ui/             # primitive/shared components
    features/       # feature-scoped components (reader, library, dashboard...)
  lib/              # prisma, supabase, auth, utils, stores
  hooks/
  types/
  styles/           # globals.css — reader theme definitions live here
prisma/
  schema.prisma
docs/
  mvp-spec.md       # full feature list + schema rationale
```
