-- AlterTable
ALTER TABLE "StudyEvent" ADD COLUMN     "clientEventId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "StudyEvent_userId_clientEventId_key" ON "StudyEvent"("userId", "clientEventId");

