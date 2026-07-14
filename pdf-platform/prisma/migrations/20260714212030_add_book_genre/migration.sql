-- CreateEnum
CREATE TYPE "Genre" AS ENUM ('FICTION', 'NON_FICTION', 'BUSINESS', 'SCIENCE', 'BIOGRAPHY', 'SELF_HELP', 'TECHNICAL', 'HISTORY', 'PHILOSOPHY', 'OTHER', 'UNCATEGORIZED');

-- AlterTable
ALTER TABLE "Book" ADD COLUMN     "genre" "Genre" NOT NULL DEFAULT 'UNCATEGORIZED';

-- CreateIndex
CREATE INDEX "Book_userId_genre_idx" ON "Book"("userId", "genre");
