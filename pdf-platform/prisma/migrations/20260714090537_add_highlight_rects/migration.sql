/*
  Warnings:

  - You are about to drop the column `expiresAt` on the `Account` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Account" DROP COLUMN "expiresAt";

-- AlterTable
ALTER TABLE "Highlight" ADD COLUMN     "rects" JSONB;
