-- CreateEnum
CREATE TYPE "StudyMode" AS ENUM ('FLASHCARDS', 'MATCH', 'TEST', 'LEARN');

-- AlterTable
ALTER TABLE "Flashcard" ADD COLUMN     "lastCorrectAt" TIMESTAMP(3),
ADD COLUMN     "lastWrongAt" TIMESTAMP(3),
ADD COLUMN     "strengthLevel" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "baselineLevel" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "StudyEvent" ADD COLUMN     "correct" BOOLEAN,
ADD COLUMN     "firstTry" BOOLEAN,
ADD COLUMN     "mode" "StudyMode",
ADD COLUMN     "responseMs" INTEGER,
ALTER COLUMN "status" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "StudyEvent_flashcardId_answeredAt_idx" ON "StudyEvent"("flashcardId", "answeredAt");

-- Backfill: the pre-feature status is the only record of past progress, and the
-- StudyEvent rows written before this migration carry no mode/correct, so they
-- cannot be folded. baselineLevel freezes that earned progress as the floor the
-- fold starts from; strengthLevel starts equal to it.
UPDATE "Flashcard" SET "strengthLevel" = 5, "baselineLevel" = 5 WHERE "status" = 'KNOWN';
UPDATE "Flashcard" SET "strengthLevel" = 2, "baselineLevel" = 2 WHERE "status" = 'STILL_LEARNING';
UPDATE "Flashcard" SET "strengthLevel" = 0, "baselineLevel" = 0 WHERE "status" = 'UNSTUDIED';
