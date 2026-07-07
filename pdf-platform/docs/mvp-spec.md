# PDF Reading Platform — Final MVP Spec

## 1. Final MVP Feature List

### Core
- Auth (Better Auth) — email/password + optional OAuth
- PDF upload (single + bulk folder scan)
- Cloud storage (Supabase Storage)
- AI auto-categorization on upload (Education / Novel / Unknown) — one LLM call per book, background job
- PDF metadata auto-extraction (title, author, cover thumbnail) via PDF.js on upload — no AI cost

### Library & Dashboard
- Netflix-style dashboard: Continue Reading, Recently Added, Favorites
- Library grid view with hover actions (Continue / Favorite / More)
- Collections (user-created, drag-to-reorder)
- Favorites/pin (boolean toggle)
- Full-text search via Postgres `tsvector` (title, author, extracted text, tags) — no vector DB yet

### Reader
- PDF.js-based reader with progress sync (page + scroll position, cross-device)
- Reading time estimate ("X min remaining") from personal pages-per-minute average
- Bookmarks, Notes, Highlights (CRUD tied to book + page)
- Keyboard shortcuts (arrows = page nav, "/" = search, "b" = bookmark)
- **Reader themes**: Default (sans), Paper (sepia/serif, paper-grain), Night (true black, not just inverted)
- Font toggle: serif / sans / dyslexic-friendly

### AI (kept minimal, done well)
- Highlight → "Explain this" (in-context, position-aware so no spoilers for novels)
- Summarize (chapter / selection / whole book)

### Coming Soon (stubbed UI only, not built)
- Audiobook / TTS
- AI Quiz + Flashcards
- AI Timeline (characters/relationships for novels)
- Reviews + star ratings
- Achievements / streak gamification
- Reading goals (daily/weekly/monthly targets)
- Social features
- Offline mode / mobile app
- Theme customization beyond the 3 reader themes
- "Chat with your book" via embeddings (vector search)

---

## 2. Prisma Schema

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum BookCategory {
  EDUCATION
  NOVEL
  UNKNOWN
}

enum ReaderTheme {
  DEFAULT
  PAPER
  NIGHT
}

enum FontPreference {
  SANS
  SERIF
  DYSLEXIC
}

enum JobStatus {
  PENDING
  PROCESSING
  COMPLETE
  FAILED
}

model User {
  id            String   @id @default(cuid())
  email         String   @unique
  passwordHash  String?
  name          String?
  avatarUrl     String?
  createdAt     DateTime @default(now())

  settings      UserSettings?
  books         Book[]
  collections   Collection[]
  bookmarks     Bookmark[]
  notes         Note[]
  highlights    Highlight[]
  progress      ReadingProgress[]
  sessions      ReadingSession[]
}

model UserSettings {
  id              String         @id @default(cuid())
  userId          String         @unique
  user            User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  readerTheme     ReaderTheme    @default(DEFAULT)
  fontPreference  FontPreference @default(SANS)
}

model Book {
  id              String        @id @default(cuid())
  userId          String
  user            User          @relation(fields: [userId], references: [id], onDelete: Cascade)

  title           String
  author          String?
  coverUrl        String?
  fileUrl         String        // Supabase storage path
  fileSizeBytes   Int?
  pageCount       Int?

  category        BookCategory  @default(UNKNOWN)
  categorizedAt   DateTime?
  searchVector    Unsupported("tsvector")?  // populated via trigger/raw SQL

  isFavorite      Boolean       @default(false)
  createdAt       DateTime      @default(now())
  lastOpenedAt    DateTime?

  collections     CollectionBook[]
  bookmarks       Bookmark[]
  notes           Note[]
  highlights      Highlight[]
  progress        ReadingProgress?
  sessions        ReadingSession[]
  jobs            ProcessingJob[]

  @@index([userId, category])
  @@index([userId, lastOpenedAt])
}

model Collection {
  id          String           @id @default(cuid())
  userId      String
  user        User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  name        String
  createdAt   DateTime         @default(now())

  books       CollectionBook[]
}

// Join table — also carries manual sort order for drag-to-reorder
model CollectionBook {
  collectionId String
  bookId       String
  sortOrder    Int        @default(0)

  collection   Collection @relation(fields: [collectionId], references: [id], onDelete: Cascade)
  book         Book       @relation(fields: [bookId], references: [id], onDelete: Cascade)

  @@id([collectionId, bookId])
}

model Bookmark {
  id        String   @id @default(cuid())
  userId    String
  bookId    String
  page      Int
  label     String?
  createdAt DateTime @default(now())

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  book      Book     @relation(fields: [bookId], references: [id], onDelete: Cascade)

  @@index([bookId])
}

model Note {
  id        String   @id @default(cuid())
  userId    String
  bookId    String
  page      Int
  content   String
  createdAt DateTime @default(now())

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  book      Book     @relation(fields: [bookId], references: [id], onDelete: Cascade)

  @@index([bookId])
}

model Highlight {
  id          String   @id @default(cuid())
  userId      String
  bookId      String
  page        Int
  textContent String
  colorTag    String?  // e.g. "yellow", "blue"
  createdAt   DateTime @default(now())

  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  book        Book     @relation(fields: [bookId], references: [id], onDelete: Cascade)

  @@index([bookId])
}

// One row per user+book — current position, used for "Continue Reading" and time estimates
model ReadingProgress {
  id              String   @id @default(cuid())
  userId          String
  bookId          String   @unique
  currentPage     Int      @default(1)
  scrollOffset    Float?   // sub-page position within a page, optional
  percentComplete Float    @default(0)
  updatedAt       DateTime @updatedAt

  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  book            Book     @relation(fields: [bookId], references: [id], onDelete: Cascade)
}

// Discrete reading sessions — source of truth for pages/min estimate & future stats
model ReadingSession {
  id            String   @id @default(cuid())
  userId        String
  bookId        String
  startedAt     DateTime @default(now())
  endedAt       DateTime?
  pagesRead     Int      @default(0)

  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  book          Book     @relation(fields: [bookId], references: [id], onDelete: Cascade)

  @@index([userId, bookId])
}

// Background job tracking for categorization (and later: TTS, embeddings, etc.)
model ProcessingJob {
  id          String     @id @default(cuid())
  bookId      String
  type        String     // "CATEGORIZE", "EXTRACT_TEXT", future: "EMBED", "TTS"
  status      JobStatus  @default(PENDING)
  error       String?
  createdAt   DateTime   @default(now())
  completedAt DateTime?

  book        Book       @relation(fields: [bookId], references: [id], onDelete: Cascade)

  @@index([status])
}
```

### Notes on the schema

- `searchVector` uses `Unsupported("tsvector")` since Prisma doesn't natively model Postgres `tsvector` — you'll add a raw SQL migration with a `GENERATED ALWAYS AS` column or a trigger to keep it in sync with title/author/extracted text, plus a GIN index for speed.
- `ProcessingJob` is intentionally generic (`type` as a string, not an enum) so the same table handles categorization now and TTS/embeddings later without a schema migration — just a new job type.
- `ReadingSession` is kept separate from `ReadingProgress` on purpose: progress is "where am I now" (one row per book), sessions are "what did I do and when" (many rows), which is what your time-estimate and future stats/streaks features will both read from.
- Reviews, achievements, goals, and quiz/flashcard tables are deliberately omitted — add them as their own migration when those features come off the "Coming Soon" shelf, so the MVP schema stays lean.
