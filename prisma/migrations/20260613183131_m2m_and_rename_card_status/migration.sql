/*
  Warnings:

  - The values [NEW,LEARNING,MASTERED] on the enum `CardStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `folderId` on the `Module` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "CardStatus_new" AS ENUM ('UNSTUDIED', 'STILL_LEARNING', 'KNOWN');
ALTER TABLE "public"."Flashcard" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Flashcard" ALTER COLUMN "status" TYPE "CardStatus_new" USING ("status"::text::"CardStatus_new");
ALTER TYPE "CardStatus" RENAME TO "CardStatus_old";
ALTER TYPE "CardStatus_new" RENAME TO "CardStatus";
DROP TYPE "public"."CardStatus_old";
ALTER TABLE "Flashcard" ALTER COLUMN "status" SET DEFAULT 'UNSTUDIED';
COMMIT;

-- AlterTable
ALTER TABLE "Flashcard" ALTER COLUMN "status" SET DEFAULT 'UNSTUDIED';

-- AlterTable
ALTER TABLE "Module" DROP COLUMN "folderId";
