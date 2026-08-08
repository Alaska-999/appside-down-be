-- AlterTable
ALTER TABLE "StudyEvent" ADD COLUMN     "clientEventId" TEXT;

-- Backfill existing rows so the column can be NOT NULL
UPDATE "StudyEvent" SET "clientEventId" = "id" WHERE "clientEventId" IS NULL;

ALTER TABLE "StudyEvent" ALTER COLUMN "clientEventId" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "StudyEvent_userId_clientEventId_key" ON "StudyEvent"("userId", "clientEventId");
